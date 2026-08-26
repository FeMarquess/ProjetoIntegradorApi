import prismaClient from "../prisma/index.js";
import type { Agenda } from "../type/Agenda.js";

const dataInicio = new Date()
const dataFim = new Date(dataInicio.setMinutes(dataInicio.getMinutes() + 30))

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
        return Agenda
        }catch (error){
            return("Não foi possível criar a agenda")
        }
    }
}

class BuscarAgendaService{
    async execute(){
        try{
        const Agenda = await prismaClient.agenda.findMany()

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
      const inicio = new Date(data)
        inicio.setHours(0, 0, 0, 0)
    const agenda = await prismaClient.agenda.findMany({      
      where: {
        horaInicio: {
          gte: inicio
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

        return Agenda
        } catch (error) {
            return ("Não foi possível deletar essa agenda")
        }     
    }
}

class AlterarAgendaIdService{
    async execute(Agenda: Agenda, id: Number){
        if(id){
            const idAlterar = Number(id)
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
            
        return ("Sucesso ao alterar")
        }else {
            return("Erro ao alterar agenda")
        }
        
    }
}

export { CriarAgendaService, BuscarAgendaService, BuscarAgendaNomeService, BuscarAgendaDataService, BuscarAgendaIdService, DeletarAgendaIdService, AlterarAgendaIdService }