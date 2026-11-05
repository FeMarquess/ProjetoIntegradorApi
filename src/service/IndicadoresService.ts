import prismaClient from "../prisma/index.js";
import { FAIXAS, chaveDia, idadeNaData, indiceFaixa, mediaArredondada, minutosEntre } from "../regras/indicadores.js";

const DIAS_PROXIMOS = 14

// Agendamentos ainda não concluídos por dia, de hoje até DIAS_PROXIMOS à frente.
// Dias sem agendamento entram com 0 para a série ficar contínua.
async function proximosAgendamentos(){
    const inicio = new Date()
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(inicio)
    fim.setDate(fim.getDate() + DIAS_PROXIMOS)

    const agendas = await prismaClient.agenda.findMany({
        where: {
            status: { not: 'concluido' },
            horaInicio: { gte: inicio, lt: fim }
        },
        select: { horaInicio: true }
    })

    const dias: { data: string, total: number }[] = []
    for(let i = 0; i < DIAS_PROXIMOS; i++){
        const dia = new Date(inicio)
        dia.setDate(dia.getDate() + i)
        dias.push({ data: chaveDia(dia), total: 0 })
    }
    for(const agenda of agendas){
        const dia = dias.find((d) => d.data === chaveDia(agenda.horaInicio))
        if(dia) dia.total++
    }
    return dias
}

// Só atendimentos concluídos entram nos indicadores: agendamentos futuros ou em andamento
// ainda podem ser cancelados ou alterados
class BuscarIndicadoresService{
    async execute(){
        const agendas = await prismaClient.agenda.findMany({
            where: { status: 'concluido' },
            include: {
                cliente: true,
                funcionario: true,
                tipoAgenda: true
            }
        })

        const servicos = new Map<number, {
            id: number,
            descricao: string,
            total: number,
            idades: number[],
            duracoesPrevistas: number[],
            duracoesReais: number[],
            profissionais: Map<number, { id: number, descricao: string, total: number }>
        }>()
        const faixas = FAIXAS.map((f) => ({ faixa: f.faixa, total: 0 }))

        for(const agenda of agendas){
            const servico = servicos.get(agenda.tipoAgendaId) ?? {
                id: agenda.tipoAgendaId,
                descricao: agenda.tipoAgenda.descricao,
                total: 0,
                idades: [] as number[],
                duracoesPrevistas: [] as number[],
                duracoesReais: [] as number[],
                profissionais: new Map<number, { id: number, descricao: string, total: number }>()
            }
            servico.total++

            const profissional = servico.profissionais.get(agenda.funcionarioId) ?? {
                id: agenda.funcionarioId,
                descricao: agenda.funcionario.descricao,
                total: 0
            }
            profissional.total++
            servico.profissionais.set(agenda.funcionarioId, profissional)

            if(agenda.cliente?.dataNascimento){
                const idade = idadeNaData(agenda.cliente.dataNascimento, agenda.horaInicio)
                servico.idades.push(idade)
                const faixa = indiceFaixa(idade)
                if(faixa >= 0) faixas[faixa]!.total++
            }

            // tempo combinado x tempo real (só quando a etapa foi iniciada e concluída pelo painel)
            servico.duracoesPrevistas.push(minutosEntre(agenda.horaInicio, agenda.horaFimPrevista ?? agenda.horaFim))
            if(agenda.inicioReal && agenda.fimReal){
                servico.duracoesReais.push(minutosEntre(agenda.inicioReal, agenda.fimReal))
            }

            servicos.set(agenda.tipoAgendaId, servico)
        }

        const listaServicos = [...servicos.values()]
            .map((s) => ({
                id: s.id,
                descricao: s.descricao,
                total: s.total,
                idadeMedia: mediaArredondada(s.idades),
                duracaoPrevistaMedia: mediaArredondada(s.duracoesPrevistas),
                duracaoRealMedia: mediaArredondada(s.duracoesReais),
                profissionais: [...s.profissionais.values()].sort((a, b) => b.total - a.total)
            }))
            .sort((a, b) => b.total - a.total)

        return {
            totalAtendimentos: agendas.length,
            servicos: listaServicos,
            faixas: faixas,
            proximosDias: await proximosAgendamentos()
        }
    }
}

export { BuscarIndicadoresService }
