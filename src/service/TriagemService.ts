import prismaClient from "../prisma/index.js";
import { calcularStatusVisita, etapaQueBloqueia, fimAoConcluir, inicioEFimDoDia, lerData } from "../regras/agenda.js";
import { conflito, naoEncontrado, requisicaoInvalida, lerId } from "../erros.js";
import { publicar } from "../eventos.js";

const incluirNomes = {
    cliente: true,
    funcionario: true,
    tipoAgenda: true
}

interface id{
    id: string
}


// Recalcula o status das etapas da visita (mesma cliente, mesmo dia) e avisa em tempo real
// as profissionais cujas etapas acabaram de ser liberadas.
async function recalcularVisita(clienteId: number | null, data: Date){
    if(!clienteId) return

    const { inicio, fim } = inicioEFimDoDia(data)
    const etapas = await prismaClient.agenda.findMany({
        where:{
            clienteId: clienteId,
            horaInicio: { gte: inicio, lt: fim }
        },
        orderBy: { horaInicio: 'asc' }
    })

    for(const mudanca of calcularStatusVisita(etapas)){
        const etapa = await prismaClient.agenda.update({
            where: { id: mudanca.id },
            data: { status: mudanca.status },
            include: incluirNomes
        })
        if(mudanca.status === 'liberado'){
            publicar("etapa_liberada", {
                id: etapa.id,
                funcionarioId: etapa.funcionarioId,
                clienteId: etapa.clienteId,
                cliente: etapa.cliente?.descricao ?? null,
                servico: etapa.tipoAgenda.descricao
            })
        }
    }
}

type AgendaBasica = { id: number, clienteId: number | null, horaInicio: Date, status: string }

// Acrescenta "aguardando" às etapas que esperam outra: qual serviço, com quem e a que horas.
// Assim a tela mostra "Aguardando Manicure com Ana (16:00)" em vez de só "etapa anterior".
async function anotarEtapaAnterior<T extends AgendaBasica>(agendas: T[]){
    const esperando = agendas.filter((a) => a.status === 'agendado' && a.clienteId)
    if(esperando.length === 0) return agendas.map((a) => ({ ...a, aguardando: null }))

    const datas = esperando.map((a) => a.horaInicio.getTime())
    const { inicio } = inicioEFimDoDia(new Date(Math.min(...datas)))
    const { fim } = inicioEFimDoDia(new Date(Math.max(...datas)))
    const pendentes = await prismaClient.agenda.findMany({
        where: {
            clienteId: { in: [...new Set(esperando.map((a) => a.clienteId!))] },
            horaInicio: { gte: inicio, lt: fim },
            status: { not: 'concluido' }
        },
        include: { funcionario: true, tipoAgenda: true }
    })

    return agendas.map((a) => {
        if(a.status !== 'agendado' || !a.clienteId) return { ...a, aguardando: null }
        const dia = inicioEFimDoDia(a.horaInicio)
        const daVisita = pendentes.filter((p) => p.clienteId === a.clienteId && p.horaInicio >= dia.inicio && p.horaInicio < dia.fim)
        const anterior = etapaQueBloqueia(a, daVisita)
        return {
            ...a,
            aguardando: anterior ? {
                id: anterior.id,
                servico: anterior.tipoAgenda.descricao,
                profissional: anterior.funcionario.descricao,
                horaInicio: anterior.horaInicio
            } : null
        }
    })
}

class IniciarAgendaService{
    async execute({id}: id){
        const agenda = await prismaClient.agenda.findUnique({ where: { id: lerId(id) } })
        if(!agenda) throw naoEncontrado("Agenda não encontrada")
        if(agenda.status === 'agendado') throw conflito("A etapa anterior desta cliente ainda não foi concluída")
        if(agenda.status !== 'liberado') throw conflito("Esta etapa já foi iniciada")

        // o where com status impede que dois toques simultâneos iniciem a etapa duas vezes
        const { count } = await prismaClient.agenda.updateMany({
            where: { id: agenda.id, status: 'liberado' },
            data: { status: 'em_andamento', inicioReal: new Date() }
        })
        if(count === 0) throw conflito("Esta etapa já foi iniciada")

        publicar("agenda_alterada", { acao: "iniciada", id: agenda.id, funcionarioId: agenda.funcionarioId, clienteId: agenda.clienteId })
        return prismaClient.agenda.findUnique({ where: { id: agenda.id }, include: incluirNomes })
    }
}

class ConcluirAgendaService{
    async execute({id}: id){
        const agenda = await prismaClient.agenda.findUnique({ where: { id: lerId(id) } })
        if(!agenda) throw naoEncontrado("Agenda não encontrada")
        if(agenda.status !== 'em_andamento') throw conflito("Inicie a etapa antes de concluir")

        const agora = new Date()
        // terminou antes do combinado: o resto do horário fica livre na agenda da profissional
        const novoFim = fimAoConcluir(agenda.horaInicio, agenda.horaFim, agora)

        const { count } = await prismaClient.agenda.updateMany({
            where: { id: agenda.id, status: 'em_andamento' },
            data: {
                status: 'concluido',
                fimReal: agora,
                ...(novoFim ? { horaFim: novoFim, horaFimPrevista: agenda.horaFim } : {})
            }
        })
        if(count === 0) throw conflito("Esta etapa já foi concluída")

        // libera a próxima etapa da visita
        await recalcularVisita(agenda.clienteId, agenda.horaInicio)
        publicar("agenda_alterada", { acao: "concluida", id: agenda.id, funcionarioId: agenda.funcionarioId, clienteId: agenda.clienteId })

        return prismaClient.agenda.findUnique({ where: { id: agenda.id }, include: incluirNomes })
    }
}

class BuscarAgendaFuncionarioService{
    async execute({funcionarioId, data}: {funcionarioId: string, data?: string}){
        const { inicio, fim } = inicioEFimDoDia(lerData(data))

        return anotarEtapaAnterior(await prismaClient.agenda.findMany({
            include: incluirNomes,
            where:{
                funcionarioId: lerId(funcionarioId),
                horaInicio: { gte: inicio, lt: fim }
            },
            orderBy: { horaInicio: 'asc' }
        }))
    }
}

export { recalcularVisita, anotarEtapaAnterior, IniciarAgendaService, ConcluirAgendaService, BuscarAgendaFuncionarioService }
