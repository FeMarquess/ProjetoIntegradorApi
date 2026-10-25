import prismaClient from "../prisma/index.js";
import type { Agenda } from "../type/Agenda.js";
import { recalcularVisita } from "./TriagemService.js";

const dataInicio = new Date()
const dataFim = new Date(dataInicio.setMinutes(dataInicio.getMinutes() + 30))

// traz os nomes de cliente, profissional e serviço junto com cada agenda
const incluirNomes = {
    cliente: true,
    funcionario: true,
    tipoAgenda: true
}

function horarioInvalido(Agenda: Agenda){
    return new Date(Agenda.horaFim) <= new Date(Agenda.horaInicio)
}

interface data{
    data: Date
}

interface id{
    id: string
}

interface descricao{
    descricao: string
}

class CriarAgendaService{
    async execute(Agenda: Agenda){
        if(horarioInvalido(Agenda)){
            return("O fim da agenda deve ser depois do início")
        }
        try{
        const res = await prismaClient.agenda.create({
            data:{
                descricao: Agenda.descricao,
                funcionarioId: Agenda.funcionarioId,
                clienteId: Agenda.clienteId,
                tipoAgendaId: Agenda.tipoAgendaId,
                horaInicio: Agenda.horaInicio,
                horaFim: Agenda.horaFim
            }
        })
        await recalcularVisita(res.clienteId, res.horaInicio)
        return res
        }catch (error){
            return("Não foi possível criar a agenda")
        }
    }
}

class BuscarAgendaService{
    async execute(){
        try{
        const Agenda = await prismaClient.agenda.findMany({
            include: incluirNomes
        })

        return Agenda
    }catch(error){
        return ("Não foi possível retornar agenda nessa busca")
    }
}
}

class BuscarAgendaNomeService{
    async execute({descricao}: descricao){
        console.log(descricao)
        try{
        const Agenda = await prismaClient.agenda.findMany({
            include: incluirNomes,
            where: {
                descricao: {
                contains: descricao,
                mode: 'insensitive'
        }
      }
    })
        return Agenda
    }catch(error){
        return ("Não foi possível retornar agenda nessa busca")
    }
}
}

class BuscarAgendaDataService {
      async execute({ data }: data) {
    try {
      // "AAAA-MM-DD" sem hora é lido como UTC; força horário local para não cair no dia anterior
      const inicio = /^\d{4}-\d{2}-\d{2}$/.test(String(data)) ? new Date(`${data}T00:00:00`) : new Date(data)
        inicio.setHours(0, 0, 0, 0)
      const fim = new Date(inicio)
        fim.setDate(fim.getDate() + 1)
    const agenda = await prismaClient.agenda.findMany({
      include: incluirNomes,
      where: {
        horaInicio: {
          gte: inicio,
          lt: fim
        }
      }
    })
    return agenda  
    } catch (error) {
        return ("Não foi possível retornar agenda nessa busca")
    }    
  }
}

class BuscarAgendaIdService{
    async execute({id}: id){
        try {
         const Agenda = await prismaClient.agenda.findUnique({
            include: incluirNomes,
            where:{
                id: Number(id)
            }
        })

        return Agenda   
        } catch (error) {
            return ("Não foi possível retornar agenda nessa busca") 
        }      
    }
}

class DeletarAgendaIdService{
    async execute({id}: id){
        try {
            const Agenda = await prismaClient.agenda.delete({
            where:{
                id: Number(id)
            }
        })
        await recalcularVisita(Agenda.clienteId, Agenda.horaInicio)

        return Agenda
        } catch (error) {
            return ("Não foi possível deletar essa agenda")
        }     
    }
}

class AlterarAgendaIdService{
    async execute(Agenda: Agenda, id: Number){
        if(horarioInvalido(Agenda)){
            return("O fim da agenda deve ser depois do início")
        }
        if(id){
            const idAlterar = Number(id)
            const anterior = await prismaClient.agenda.findUnique({ where: { id: idAlterar } })
            const agenda = await prismaClient.agenda.update({
                 where: {
                    id: idAlterar
                },
                data:{
                    descricao: Agenda.descricao,                
                    funcionarioId: Agenda.funcionarioId,
                    clienteId: Agenda.clienteId,         
                    tipoAgendaId: Agenda.tipoAgendaId,
                    horaInicio: Agenda.horaInicio,
                    horaFim: Agenda.horaFim
                }                       
            })
            // a agenda pode ter mudado de cliente ou de dia: recalcula a visita antiga e a nova
            if(anterior) await recalcularVisita(anterior.clienteId, anterior.horaInicio)
            await recalcularVisita(agenda.clienteId, agenda.horaInicio)
            
        return ("Sucesso ao alterar")
        }else {
            return("Erro ao alterar agenda")
        }
        
    }
}

export { CriarAgendaService, BuscarAgendaService, BuscarAgendaNomeService, BuscarAgendaDataService, BuscarAgendaIdService, DeletarAgendaIdService, AlterarAgendaIdService }