import prismaClient from "../prisma/index.js";
import type { Cliente } from "../type/Cliente.js";

interface id {
    id: string
}

class CriarClienteService{
    async execute(Cliente: Cliente){
        
        const cliente = await prismaClient.cliente.create({
            data:{
                descricao: Cliente.descricao
            }
        })

        return cliente
    }
}

class BuscarClienteService{
    async execute(){
        try{
        const cliente = await prismaClient.cliente.findMany()

        return cliente
    }catch(error){
        return ("Não foi possível retornar agenda nessa busca")
    }
}
}

class BuscarClienteIdService{
    async execute({id}: id){

        console.log("service")
        if(id)
        {
            console.log(id)
            const clienteBusca = await prismaClient.cliente.findFirst({
                where:{
                    id: Number(id)
                }
            })

            return clienteBusca
        } else{
            return("Não existe retorno para essa pesquisa")
        }
    }
}

class BuscarClienteNomeService{
    async execute(Cliente: Cliente){

        if(Cliente.descricao){
            const cliente = await prismaClient.cliente.findMany({
                where:{
                    descricao: Cliente.descricao
                }
            })

            return cliente
        }else{
            return("Não existe retorno para essa pesquisa")
        }        
    }
}

class EditarClienteService{
    async execute(Cliente: Cliente, id: string){

        if(id){
            const idAlterar = Number(id)
            const cliente = await prismaClient.cliente.update({
                where:{
                    id: idAlterar
                },
                data:{
                    descricao: Cliente.descricao
                }
            })

            return Cliente
        }else{
            return("Não existe retorno para essa pesquisa")
        }        
    }
}

class DeletarClienteIdService{
    async execute({id}: id){
        try {
            console.log(Number(id))
            const Cliente = await prismaClient.cliente.delete({
            where:{
                id: Number(id)
            }
        })

        return Cliente
        } catch (error) {
            return ("Não foi possível deletar esse cliente")
        }     
    }
}

export { CriarClienteService, BuscarClienteService, BuscarClienteIdService, BuscarClienteNomeService, EditarClienteService, DeletarClienteIdService }