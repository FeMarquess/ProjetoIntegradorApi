import type { FastifyRequest, FastifyReply } from "fastify";
import { BuscarIndicadoresService } from "../service/IndicadoresService.js";

class BuscarIndicadoresController{
    async handle(req: FastifyRequest , res: FastifyReply){
        const buscarIndicadoresService = new BuscarIndicadoresService()

        const indicadores = await buscarIndicadoresService.execute();

        res.send(indicadores);
    }
}

export { BuscarIndicadoresController }
