import type { FastifyRequest, FastifyReply } from "fastify";
import type { Funcionario } from "../type/Funcionario.js";
import { CriarFuncionarioService, BuscarFuncionarioService, BuscarFuncionarioIdService, BuscarFuncionarioNomeService, EditarFuncionarioService, DeletarFuncionarioIdService } from "../service/FuncionarioService.js";

class CriarFuncionarioController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const funcionarioCriar = req.body as Funcionario;

        const criarFuncionarioService = new CriarFuncionarioService()

        const funcionario = await criarFuncionarioService.execute(funcionarioCriar);

        res.send(funcionario);
    }
}

class BuscarFuncionarioController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const buscarFuncionarioService = new BuscarFuncionarioService()

        const funcionario = await buscarFuncionarioService.execute();

        res.send(funcionario);
    }
}

class BuscarFuncionarioIdController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const { id } = req.query as {id: string};
        console.log(id)

        const buscarFuncionarioIdService = new BuscarFuncionarioIdService()

        const funcrionario = await buscarFuncionarioIdService.execute({id});

        res.send(funcrionario);
    }
}

class BuscarFuncionarioNomeController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const funcrionarioBuscarNome = req.query as Funcionario;

        const buscarFuncionarioNomeService = new BuscarFuncionarioNomeService()

        const funcrionario = await buscarFuncionarioNomeService.execute(funcrionarioBuscarNome);

        res.send(funcrionario);
    }
}

class EditarFuncionarioController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const funcionarioEditar = req.body as Funcionario
        const { id } = req.query as {id: string}
        const editarFuncionarioService = new EditarFuncionarioService()

        const funcioarnio = await editarFuncionarioService.execute(funcionarioEditar, id);

        res.send(funcioarnio);
    }
}

class DeletarFuncionarioController{
    async handle(req: FastifyRequest , res: FastifyReply){
        console.log(req.query)
        const id = req.query as {id: string}
        const deletarFuncionarioService = new DeletarFuncionarioIdService()

        const funcionario = await deletarFuncionarioService.execute(id);

        res.send(funcionario);
    }
}

export { CriarFuncionarioController, BuscarFuncionarioController, BuscarFuncionarioIdController, BuscarFuncionarioNomeController, EditarFuncionarioController, DeletarFuncionarioController }