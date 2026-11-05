import prismaClient from "../prisma/index.js";
import { AgendaSchema, type Agenda } from "../type/Agenda.js";
import { anotarEtapaAnterior, recalcularVisita } from "./TriagemService.js";
import { horarioInvalido, inicioEFimDoDia, lerData } from "../regras/agenda.js";
import { conflito, naoEncontrado, requisicaoInvalida, lerId } from "../erros.js";
import { publicar } from "../eventos.js";

// traz os nomes de cliente, profissional e serviço junto com cada agenda
const incluirNomes = {
    cliente: true,
    funcionario: true,
    tipoAgenda: true
}

// Classes de trava do Postgres (pg_advisory_xact_lock): uma para profissional, outra para cliente
const TRAVA_PROFISSIONAL = 1
const TRAVA_CLIENTE = 2

// várias reservas da mesma profissional esperam a trava uma da outra; dá folga para a fila andar
const OPCOES_TRANSACAO = { maxWait: 10000, timeout: 15000 }

type Transacao = Parameters<Parameters<typeof prismaClient.$transaction>[0]>[0]

const formatarHora = (data: Date) =>
    data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: process.env.TZ_SALAO ?? 'America/Sao_Paulo' })

interface data{
    data: Date
}

interface id{
    id: string
}

interface descricao{
    descricao: string
}

function lerAgenda(corpo: unknown): Agenda {
    const agenda = AgendaSchema.parse(corpo)
    if(horarioInvalido(agenda.horaInicio, agenda.horaFim)){
        throw requisicaoInvalida("O fim da agenda deve ser depois do início")
    }
    return agenda
}


// Exclusão mútua: a agenda de cada profissional (e de cada cliente) é um recurso compartilhado.
// A trava do Postgres vale até o fim da transação, então duas reservas simultâneas para a mesma
// profissional são processadas uma depois da outra, e a segunda já enxerga a primeira.
// A ordem das travas é sempre profissional -> cliente, o que evita deadlock.
async function travarERecusarSobreposicao(tx: Transacao, agenda: Agenda, idIgnorar?: number){
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${TRAVA_PROFISSIONAL}::int, ${agenda.funcionarioId}::int)`
    if(agenda.clienteId){
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${TRAVA_CLIENTE}::int, ${agenda.clienteId}::int)`
    }

    const mesmoHorario = {
        horaInicio: { lt: agenda.horaFim },
        horaFim: { gt: agenda.horaInicio },
        ...(idIgnorar ? { id: { not: idIgnorar } } : {})
    }

    const daProfissional = await tx.agenda.findFirst({
        where: { funcionarioId: agenda.funcionarioId, ...mesmoHorario },
        include: { cliente: true },
        orderBy: { horaInicio: 'asc' }
    })
    if(daProfissional){
        throw conflito(`A profissional já tem atendimento das ${formatarHora(daProfissional.horaInicio)} às ${formatarHora(daProfissional.horaFim)}` +
            (daProfissional.cliente ? ` com ${daProfissional.cliente.descricao}` : '') + ". Escolha outro horário")
    }

    if(agenda.clienteId){
        const daCliente = await tx.agenda.findFirst({
            where: { clienteId: agenda.clienteId, ...mesmoHorario },
            include: { funcionario: true },
            orderBy: { horaInicio: 'asc' }
        })
        if(daCliente){
            throw conflito(`A cliente já está agendada das ${formatarHora(daCliente.horaInicio)} às ${formatarHora(daCliente.horaFim)} com ${daCliente.funcionario.descricao}. Escolha outro horário`)
        }
    }
}

// A profissional precisa atender o serviço escolhido
async function validarEspecialidade(tx: Transacao, agenda: Agenda){
    const profissional = await tx.funcionario.findUnique({
        where: { id: agenda.funcionarioId },
        include: { especialidades: true }
    })
    if(!profissional) throw naoEncontrado("Profissional não encontrada")
    if(!profissional.especialidades.some((e) => e.id === agenda.tipoAgendaId)){
        throw requisicaoInvalida(`${profissional.descricao} não atende este serviço`)
    }
}

class CriarAgendaService{
    async execute(corpo: unknown){
        const agenda = lerAgenda(corpo)

        const res = await prismaClient.$transaction(async (tx) => {
            await validarEspecialidade(tx, agenda)
            await travarERecusarSobreposicao(tx, agenda)
            return tx.agenda.create({
                data:{
                    descricao: agenda.descricao,
                    funcionarioId: agenda.funcionarioId,
                    clienteId: agenda.clienteId ?? null,
                    tipoAgendaId: agenda.tipoAgendaId,
                    horaInicio: agenda.horaInicio,
                    horaFim: agenda.horaFim
                }
            })
        }, OPCOES_TRANSACAO)

        await recalcularVisita(res.clienteId, res.horaInicio)
        publicar("agenda_alterada", { acao: "criada", id: res.id, funcionarioId: res.funcionarioId, clienteId: res.clienteId })
        return prismaClient.agenda.findUnique({ where: { id: res.id }, include: incluirNomes })
    }
}

class BuscarAgendaService{
    async execute(){
        return prismaClient.agenda.findMany({
            include: incluirNomes,
            orderBy: { horaInicio: 'asc' }
        })
    }
}

class BuscarAgendaNomeService{
    async execute({descricao}: descricao){
        return anotarEtapaAnterior(await prismaClient.agenda.findMany({
            include: incluirNomes,
            orderBy: { horaInicio: 'asc' },
            where: {
                descricao: {
                    contains: descricao ?? '',
                    mode: 'insensitive'
                }
            }
        }))
    }
}

class BuscarAgendaDataService {
    async execute({ data }: data) {
        const { inicio, fim } = inicioEFimDoDia(lerData(data))
        return anotarEtapaAnterior(await prismaClient.agenda.findMany({
            include: incluirNomes,
            orderBy: { horaInicio: 'asc' },
            where: {
                horaInicio: {
                    gte: inicio,
                    lt: fim
                }
            }
        }))
    }
}

// Histórico de procedimentos da cliente, do mais recente para o mais antigo
class BuscarAgendaClienteService{
    async execute({clienteId}: {clienteId: string}){
        return anotarEtapaAnterior(await prismaClient.agenda.findMany({
            include: incluirNomes,
            where: { clienteId: lerId(clienteId) },
            orderBy: { horaInicio: 'desc' }
        }))
    }
}

class BuscarAgendaIdService{
    async execute({id}: id){
        const agenda = await prismaClient.agenda.findUnique({
            include: incluirNomes,
            where:{
                id: lerId(id)
            }
        })
        if(!agenda) throw naoEncontrado("Agenda não encontrada")
        const [anotada] = await anotarEtapaAnterior([agenda])
        return anotada
    }
}

class DeletarAgendaIdService{
    async execute({id}: id){
        const agenda = await prismaClient.agenda.delete({
            where:{
                id: lerId(id)
            }
        })
        await recalcularVisita(agenda.clienteId, agenda.horaInicio)
        publicar("agenda_alterada", { acao: "excluida", id: agenda.id, funcionarioId: agenda.funcionarioId, clienteId: agenda.clienteId })

        return agenda
    }
}

class AlterarAgendaIdService{
    async execute(corpo: unknown, id: unknown){
        const idAlterar = lerId(id)
        const agenda = lerAgenda(corpo)

        const { anterior, alterada } = await prismaClient.$transaction(async (tx) => {
            const anterior = await tx.agenda.findUnique({ where: { id: idAlterar } })
            if(!anterior) throw naoEncontrado("Agenda não encontrada")

            // só confere a especialidade se trocou profissional ou serviço,
            // para não travar a edição de agendas antigas
            if(anterior.funcionarioId !== agenda.funcionarioId || anterior.tipoAgendaId !== agenda.tipoAgendaId){
                await validarEspecialidade(tx, agenda)
            }
            await travarERecusarSobreposicao(tx, agenda, idAlterar)

            const alterada = await tx.agenda.update({
                where: {
                    id: idAlterar
                },
                data:{
                    descricao: agenda.descricao,
                    funcionarioId: agenda.funcionarioId,
                    clienteId: agenda.clienteId ?? null,
                    tipoAgendaId: agenda.tipoAgendaId,
                    horaInicio: agenda.horaInicio,
                    horaFim: agenda.horaFim
                }
            })
            return { anterior, alterada }
        }, OPCOES_TRANSACAO)

        // a agenda pode ter mudado de cliente ou de dia: recalcula a visita antiga e a nova
        await recalcularVisita(anterior.clienteId, anterior.horaInicio)
        await recalcularVisita(alterada.clienteId, alterada.horaInicio)
        publicar("agenda_alterada", { acao: "alterada", id: alterada.id, funcionarioId: alterada.funcionarioId, clienteId: alterada.clienteId })

        return prismaClient.agenda.findUnique({ where: { id: alterada.id }, include: incluirNomes })
    }
}

export { CriarAgendaService, BuscarAgendaService, BuscarAgendaNomeService, BuscarAgendaDataService, BuscarAgendaClienteService, BuscarAgendaIdService, DeletarAgendaIdService, AlterarAgendaIdService }
