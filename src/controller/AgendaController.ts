import type { FastifyRequest, FastifyReply } from "fastify";
import { CriarAgendaService, BuscarAgendaService, BuscarAgendaNomeService, BuscarAgendaDataService, BuscarAgendaIdService, DeletarAgendaIdService, AlterarAgendaIdService } from "../service/AgendaService.js";
import type { Agenda } from "../type/Agenda.js";

class CriarAgendaController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const agendaCriar = req.body as Agenda;
        console.log(agendaCriar)
        const criarAgendaService = new CriarAgendaService()

        const agenda = await criarAgendaService.execute(agendaCriar);

        res.send(agenda);
    }
}

class BuscarAgendaController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const buscarAgendaService = new BuscarAgendaService()

        const agenda = await buscarAgendaService.execute();

        res.send(agenda);
    }
}

class BuscarAgendaNomeController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const { descricao } = req.query as {descricao: string}
        const buscarAgendaService = new BuscarAgendaNomeService()

        const agenda = await buscarAgendaService.execute({descricao});

        res.send(agenda);
    }
}

class BuscarAgendaIdController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const { id } = req.query as {id: string};
        const buscarAgendaService = new BuscarAgendaIdService()

        const agenda = await buscarAgendaService.execute({id});

        res.send(agenda);
    }
}

class BuscarAgendaDataController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const { data } = req.query as {data: Date}
        const buscarAgendaService = new BuscarAgendaDataService()

        const agenda = await buscarAgendaService.execute({data});

        res.send(agenda);
    }
}

class DeletarAgendaController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const id = req.query as {id: string}
        const deletarAgendaService = new DeletarAgendaIdService()

        const agenda = await deletarAgendaService.execute(id);

        res.send(agenda);
    }
}

class AlterarAgendaController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const Agenda = req.body as Agenda
        const { id } = req.query as {id: Number}
        const alterarAgendaService = new AlterarAgendaIdService()

        const agenda = await alterarAgendaService.execute(Agenda, id);

        res.send(agenda); 
    }
}

export { CriarAgendaController, BuscarAgendaController, BuscarAgendaNomeController, BuscarAgendaIdController, BuscarAgendaDataController, DeletarAgendaController, AlterarAgendaController }