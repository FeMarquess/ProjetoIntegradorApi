import prismaClient from "../prisma/index.js";
import type { TipoAgenda } from "../type/TipoAgenda.js";

interface id{
    id: string
}

class CriarTipoAgendaService{
    async execute(TipoAgenda: TipoAgenda){

        const tipoAgenda = await prismaClient.tipoAgenda.create({
            data:{
                descricao: TipoAgenda.descricao
            }
        })

        return tipoAgenda
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
            const tipoAgenda = await prismaClient.tipoAgenda.findMany({
                where:{
                    descricao: {
                        contains: TipoAgenda.descricao,
                        mode: 'insensitive'
                    }
                }
            })

            return tipoAgenda
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

            return tipoAgenda
        }else{
            return("Não existe retorno para essa pesquisa")
        }        
    }
}

class DeletarTipoAgendaIdService{
    async execute({id}: id){
        try {
            // funcionario.funcao não é chave estrangeira, então o banco não bloqueia sozinho
            const emUso = await prismaClient.funcionario.count({
                where:{
                    funcao: Number(id)
                }
            })
            if(emUso > 0){
                return ("Especialidade em uso por profissionais, não pode ser excluída")
            }

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