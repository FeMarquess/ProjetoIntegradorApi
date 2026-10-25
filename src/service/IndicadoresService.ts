import prismaClient from "../prisma/index.js";

const FAIXAS = [
    { faixa: "Até 17", min: 0, max: 17 },
    { faixa: "18 a 24", min: 18, max: 24 },
    { faixa: "25 a 34", min: 25, max: 34 },
    { faixa: "35 a 44", min: 35, max: 44 },
    { faixa: "45 a 59", min: 45, max: 59 },
    { faixa: "60 ou mais", min: 60, max: 200 }
]

// idade da cliente no dia do atendimento
function idadeNaData(nascimento: Date, data: Date){
    let idade = data.getFullYear() - nascimento.getUTCFullYear()
    const fezAniversario = data.getMonth() > nascimento.getUTCMonth()
        || (data.getMonth() === nascimento.getUTCMonth() && data.getDate() >= nascimento.getUTCDate())
    if(!fezAniversario) idade--
    return idade
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
            profissionais: Map<number, { id: number, descricao: string, total: number }>
        }>()
        const faixas = FAIXAS.map((f) => ({ faixa: f.faixa, total: 0 }))

        for(const agenda of agendas){
            const servico = servicos.get(agenda.tipoAgendaId) ?? {
                id: agenda.tipoAgendaId,
                descricao: agenda.tipoAgenda.descricao,
                total: 0,
                idades: [] as number[],
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
                const faixa = FAIXAS.findIndex((f) => idade >= f.min && idade <= f.max)
                if(faixa >= 0) faixas[faixa]!.total++
            }

            servicos.set(agenda.tipoAgendaId, servico)
        }

        const listaServicos = [...servicos.values()]
            .map((s) => ({
                id: s.id,
                descricao: s.descricao,
                total: s.total,
                idadeMedia: s.idades.length
                    ? Math.round(s.idades.reduce((soma, idade) => soma + idade, 0) / s.idades.length)
                    : null,
                profissionais: [...s.profissionais.values()].sort((a, b) => b.total - a.total)
            }))
            .sort((a, b) => b.total - a.total)

        return {
            totalAtendimentos: agendas.length,
            servicos: listaServicos,
            faixas: faixas
        }
    }
}

export { BuscarIndicadoresService }
