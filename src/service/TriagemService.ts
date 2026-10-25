import prismaClient from "../prisma/index.js";

const incluirNomes = {
    cliente: true,
    funcionario: true,
    tipoAgenda: true
}

interface id{
    id: string
}

function inicioDoDia(data: Date){
    const inicio = new Date(data)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(inicio)
    fim.setDate(fim.getDate() + 1)
    return { inicio, fim }
}

// "AAAA-MM-DD" sem hora é lido como UTC; força horário local para não cair no dia anterior
function lerData(data?: string){
    if(!data) return new Date()
    return /^\d{4}-\d{2}-\d{2}$/.test(data) ? new Date(`${data}T00:00:00`) : new Date(data)
}

// A visita é o conjunto de agendas da mesma cliente no mesmo dia, em ordem de horário.
// Uma etapa fica liberada quando todas as anteriores foram concluídas; senão fica agendada.
// Etapas em andamento ou concluídas não são alteradas.
async function recalcularVisita(clienteId: number | null, data: Date){
    if(!clienteId) return

    const { inicio, fim } = inicioDoDia(data)
    const etapas = await prismaClient.agenda.findMany({
        where:{
            clienteId: clienteId,
            horaInicio: { gte: inicio, lt: fim }
        },
        orderBy: { horaInicio: 'asc' }
    })

    let anterioresConcluidas = true
    for(const etapa of etapas){
        if(etapa.status === 'agendado' || etapa.status === 'liberado'){
            const novoStatus = anterioresConcluidas ? 'liberado' : 'agendado'
            if(novoStatus !== etapa.status){
                await prismaClient.agenda.update({
                    where: { id: etapa.id },
                    data: { status: novoStatus }
                })
            }
        }
        if(etapa.status !== 'concluido') anterioresConcluidas = false
    }
}

class IniciarAgendaService{
    async execute({id}: id){
        const agenda = await prismaClient.agenda.findUnique({ where: { id: Number(id) } })
        if(!agenda) return ("Agenda não encontrada")
        if(agenda.status === 'agendado') return ("A etapa anterior desta cliente ainda não foi concluída")
        if(agenda.status !== 'liberado') return ("Esta etapa já foi iniciada")

        return await prismaClient.agenda.update({
            include: incluirNomes,
            where: { id: agenda.id },
            data: { status: 'em_andamento' }
        })
    }
}

class ConcluirAgendaService{
    async execute({id}: id){
        const agenda = await prismaClient.agenda.findUnique({ where: { id: Number(id) } })
        if(!agenda) return ("Agenda não encontrada")
        if(agenda.status !== 'em_andamento') return ("Inicie a etapa antes de concluir")

        const concluida = await prismaClient.agenda.update({
            include: incluirNomes,
            where: { id: agenda.id },
            data: { status: 'concluido' }
        })

        // libera a próxima etapa da visita
        await recalcularVisita(agenda.clienteId, agenda.horaInicio)

        return concluida
    }
}

class BuscarAgendaFuncionarioService{
    async execute({funcionarioId, data}: {funcionarioId: string, data?: string}){
        const { inicio, fim } = inicioDoDia(lerData(data))

        return await prismaClient.agenda.findMany({
            include: incluirNomes,
            where:{
                funcionarioId: Number(funcionarioId),
                horaInicio: { gte: inicio, lt: fim }
            },
            orderBy: { horaInicio: 'asc' }
        })
    }
}

export { recalcularVisita, IniciarAgendaService, ConcluirAgendaService, BuscarAgendaFuncionarioService }
