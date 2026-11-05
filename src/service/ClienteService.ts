import prismaClient from "../prisma/index.js";
import { ClienteSchema } from "../type/Cliente.js";
import { lerId, naoEncontrado } from "../erros.js";

interface id {
    id: string
}

function dadosCliente(corpo: unknown){
    const cliente = ClienteSchema.parse(corpo)
    return {
        descricao: cliente.descricao,
        telefone: cliente.telefone || null,
        dataNascimento: cliente.dataNascimento ?? null
    }
}

class CriarClienteService{
    async execute(corpo: unknown){
        return prismaClient.cliente.create({
            data: dadosCliente(corpo)
        })
    }
}

class BuscarClienteService{
    async execute(){
        return prismaClient.cliente.findMany({ orderBy: { descricao: 'asc' } })
    }
}

class BuscarClienteIdService{
    async execute({id}: id){
        const cliente = await prismaClient.cliente.findUnique({
            where:{
                id: lerId(id)
            }
        })
        if(!cliente) throw naoEncontrado("Cliente não encontrada")
        return cliente
    }
}

class BuscarClienteNomeService{
    async execute({descricao}: {descricao?: string}){
        return prismaClient.cliente.findMany({
            where:{
                descricao: {
                    contains: descricao ?? '',
                    mode: 'insensitive'
                }
            },
            orderBy: { descricao: 'asc' }
        })
    }
}

class EditarClienteService{
    async execute(corpo: unknown, id: string){
        return prismaClient.cliente.update({
            where:{
                id: lerId(id)
            },
            data: dadosCliente(corpo)
        })
    }
}

class DeletarClienteIdService{
    async execute({id}: id){
        // as agendas da cliente ficam sem cliente (ON DELETE SET NULL), preservando os indicadores
        return prismaClient.cliente.delete({
            where:{
                id: lerId(id)
            }
        })
    }
}

export { CriarClienteService, BuscarClienteService, BuscarClienteIdService, BuscarClienteNomeService, EditarClienteService, DeletarClienteIdService }
