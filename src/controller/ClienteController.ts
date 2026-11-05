import type { FastifyRequest, FastifyReply } from "fastify";
import { CriarClienteService, BuscarClienteService, BuscarClienteIdService, BuscarClienteNomeService, EditarClienteService, DeletarClienteIdService } from "../service/ClienteService.js";

class CriarClienteController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const clienteCriar = req.body;

        const criarClienteService = new CriarClienteService()

        const cliente = await criarClienteService.execute(clienteCriar);

        res.send(cliente);
    }
}

class BuscarClienteController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const buscarClienteService = new BuscarClienteService()

        const cliente = await buscarClienteService.execute();

        res.send(cliente);
    }
}

class BuscarClienteIdController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const { id } = req.query as {id: string};

        const buscarClienteIdService = new BuscarClienteIdService()

        const cliente = await buscarClienteIdService.execute({id});

        res.send(cliente);
    }
}

class BuscarClienteNomeController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const funcrionarioBuscarNome = req.query as {descricao?: string};

        const buscarClienteNomeService = new BuscarClienteNomeService()

        const funcrionario = await buscarClienteNomeService.execute(funcrionarioBuscarNome);

        res.send(funcrionario);
    }
}

class EditarClienteController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const clienteEditar = req.body
        const { id } = req.query as {id: string}

        const editarClienteService = new EditarClienteService()

        const cliente = await editarClienteService.execute(clienteEditar, id);

        res.send(cliente);
    }
}

class DeletarClienteController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const id = req.query as {id: string}
        const deletarClienteService = new DeletarClienteIdService()

        const cliente = await deletarClienteService.execute(id);

        res.send(cliente);
    }
}

export { CriarClienteController, BuscarClienteController, BuscarClienteIdController, BuscarClienteNomeController, EditarClienteController, DeletarClienteController }