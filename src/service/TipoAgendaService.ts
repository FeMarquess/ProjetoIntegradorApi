import prismaClient from "../prisma/index.js";
import type { TipoAgenda } from "../type/TipoAgenda.js";

interface id{
    id: string
}

class CriarTipoAgendaService{
    async execute(TipoAgenda: TipoAgenda){

        await prismaClient.tipoAgenda.create({
            data:{
                descricao: TipoAgenda.descricao
            }
        })

        return TipoAgenda
    }
}

class BuscarTipoAgendaService{
    async execute(){
        try{
        const tipoAgenda = await prismaClient.tipoAgenda.findMany()

        return tipoAgenda
    }catch(error){
        return ("Não foi possível retornar agenda nessa busca")
    }
}
}

class BuscarTipoAgendaIdService{
    async execute({id}: id){

        console.log("service")
        if(id)
        {
            console.log(id)
            const tipoAgendaBusca = await prismaClient.tipoAgenda.findFirst({
                where:{
                    id: Number(id)
                }
            })

            return tipoAgendaBusca
        } else{
            return("Não existe retorno para essa pesquisa")
        }
    }
}

class BuscarTipoAgendaNomeService{
    async execute(TipoAgenda: TipoAgenda){

        if(TipoAgenda.descricao){
            await prismaClient.tipoAgenda.findMany({
                where:{
                    descricao: {
                        contains: TipoAgenda.descricao,
                        mode: 'insensitive'
                    }
                }
            })

            return TipoAgenda
        }else{
            return("Não existe retorno para essa pesquisa")
        }        
    }
}

class EditarTipoAgendaService{
    async execute(TipoAgenda: TipoAgenda, id: string){
        console.log(id)
        if(id){
            const idAlterar = Number(id)
            const tipoAgenda = await prismaClient.tipoAgenda.update({
                where:{
                    id: idAlterar
                },
                data:{
                    descricao: TipoAgenda.descricao
                }
            })

            return TipoAgenda
        }else{
            return("Não existe retorno para essa pesquisa")
        }        
    }
}

class DeletarTipoAgendaIdService{
    async execute({id}: id){
        try {
            console.log(Number(id))
            const Agenda = await prismaClient.tipoAgenda.delete({
            where:{
                id: Number(id)
            }
        })

        return Agenda
        } catch (error) {
            return ("Não foi possível deletar esse tipo de agenda")
        }     
    }
}

export { CriarTipoAgendaService, BuscarTipoAgendaService, BuscarTipoAgendaIdService, BuscarTipoAgendaNomeService, EditarTipoAgendaService, DeletarTipoAgendaIdService }