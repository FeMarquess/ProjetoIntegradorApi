import type { FastifyRequest, FastifyReply } from "fastify";
import { IniciarAgendaService, ConcluirAgendaService, BuscarAgendaFuncionarioService } from "../service/TriagemService.js";

class IniciarAgendaController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const { id } = req.query as {id: string}
        const iniciarAgendaService = new IniciarAgendaService()

        const agenda = await iniciarAgendaService.execute({id});

        res.send(agenda);
    }
}

class ConcluirAgendaController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const { id } = req.query as {id: string}
        const concluirAgendaService = new ConcluirAgendaService()

        const agenda = await concluirAgendaService.execute({id});

        res.send(agenda);
    }
}

class BuscarAgendaFuncionarioController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const { funcionarioId, data } = req.query as {funcionarioId: string, data?: string}
        const buscarAgendaFuncionarioService = new BuscarAgendaFuncionarioService()

        const agenda = await buscarAgendaFuncionarioService.execute(data ? {funcionarioId, data} : {funcionarioId});

        res.send(agenda);
    }
}

export { IniciarAgendaController, ConcluirAgendaController, BuscarAgendaFuncionarioController }
