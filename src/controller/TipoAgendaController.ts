import type { FastifyRequest, FastifyReply } from "fastify";
import type { TipoAgenda } from "../type/TipoAgenda.js";
import { CriarTipoAgendaService, BuscarTipoAgendaService, BuscarTipoAgendaIdService, BuscarTipoAgendaNomeService, EditarTipoAgendaService, DeletarTipoAgendaIdService } from "../service/TipoAgendaService.js";

class CriarTipoAgendaController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const tipoAgendaCriar = req.body as TipoAgenda;
        console.log(req.body)
        const criarTipoAgendaService = new CriarTipoAgendaService()

        const tipoAgenda = await criarTipoAgendaService.execute(tipoAgendaCriar);

        res.send(tipoAgenda);
    }
}

class BuscarTipoAgendaController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const buscarTipoAgendaService = new BuscarTipoAgendaService()

        const tipoAgenda = await buscarTipoAgendaService.execute();

        res.send(tipoAgenda);
    }
}

class BuscarTipoAgendaIdController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const { id } = req.query as {id: string};
        console.log(id)

        const buscarTipoAgendaIdService = new BuscarTipoAgendaIdService()

        const tipoAgenda = await buscarTipoAgendaIdService.execute({id});

        res.send(tipoAgenda);
    }
}

class BuscarTipoAgendaNomeController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const tipoAgendaBuscarNome = req.query as TipoAgenda;

        const buscarTipoAgendaNomeService = new BuscarTipoAgendaNomeService()

        const tipoAgenda = await buscarTipoAgendaNomeService.execute(tipoAgendaBuscarNome);

        res.send(tipoAgenda);
    }
}

class EditarTipoAgendaController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const TipoAgenda = req.body as TipoAgenda
        const { id } = req.query as {id: string}
        const alterarTipoAgendaService = new EditarTipoAgendaService()

        const tipoAgenda = await alterarTipoAgendaService.execute(TipoAgenda, id);

        res.send(tipoAgenda);
    }
}

class DeletarTipoAgendaController{
    async handle(req: FastifyRequest , res: FastifyReply){
        console.log(req.query)
        const id = req.query as {id: string}
        const deletarTipoAgendaService = new DeletarTipoAgendaIdService()

        const tipoAgenda = await deletarTipoAgendaService.execute(id);

        res.send(tipoAgenda);
    }
}

export { CriarTipoAgendaController, BuscarTipoAgendaController, BuscarTipoAgendaIdController, BuscarTipoAgendaNomeController, EditarTipoAgendaController, DeletarTipoAgendaController }