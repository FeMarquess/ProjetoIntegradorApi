import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { CriarAgendaController, BuscarAgendaController, BuscarAgendaNomeController, BuscarAgendaIdController, BuscarAgendaDataController, DeletarAgendaController, AlterarAgendaController } from "./controller/AgendaController.js";
import { CriarFuncionarioController, BuscarFuncionarioController, BuscarFuncionarioNomeController, BuscarFuncionarioIdController, EditarFuncionarioController, DeletarFuncionarioController } from "./controller/FuncionarioController.js";
import { CriarClienteController, BuscarClienteController, BuscarClienteIdController, BuscarClienteNomeController, EditarClienteController, DeletarClienteController } from "./controller/ClienteController.js";
import { BuscarTipoAgendaController, BuscarTipoAgendaIdController, BuscarTipoAgendaNomeController, CriarTipoAgendaController, EditarTipoAgendaController, DeletarTipoAgendaController } from "./controller/TipoAgendaController.js";

export async function routes(fastify: FastifyInstance, options: FastifyPluginOptions){
// Agenda
    fastify.get("/agendaBuscarData",  async (req, res) =>{
        return new BuscarAgendaDataController().handle(req, res)
    })

    fastify.get("/agendaBuscarId",  async (req, res) =>{
        return new BuscarAgendaIdController().handle(req, res)
    })

    fastify.get("/agendaBuscar",  async (req, res) =>{
        return new BuscarAgendaController().handle(req, res)
    })
    
    fastify.get("/agendaBuscarNome",  async (req, res) =>{
        return new BuscarAgendaNomeController().handle(req, res)
    })

    fastify.post("/agenda",  async (req, res) =>{
        return new CriarAgendaController().handle(req, res)
    })

    fastify.delete("/deletarAgenda",  async (req, res) =>{
        return new DeletarAgendaController().handle(req, res)
    })

    fastify.put("/alterarAgenda",  async (req, res) =>{
        return new AlterarAgendaController().handle(req, res)
    })

// Funcioario   
    fastify.post("/funcionario",  async (req, res) =>{
        return new CriarFuncionarioController().handle(req, res)
    })

    fastify.get("/funcionarioBuscar",  async (req, res) =>{
        return new BuscarFuncionarioController().handle(req, res)
    })

    fastify.get("/funcionarioBuscarNome",  async (req, res) =>{
        return new BuscarFuncionarioNomeController().handle(req, res)
    })

    fastify.get("/funcionarioBuscarId",  async (req, res) =>{
        return new BuscarFuncionarioIdController().handle(req, res)
    })

    fastify.put("/alterarFuncionario",  async (req, res) =>{
        return new EditarFuncionarioController().handle(req, res)
    })

    fastify.delete("/deletarFuncionario",  async (req, res) =>{
        return new DeletarFuncionarioController().handle(req, res)
    })
    
// Cliente    
    fastify.post("/cliente",  async (req, res) =>{
        return new CriarClienteController().handle(req, res)
    })

     fastify.get("/clienteBuscar",  async (req, res) =>{
        return new BuscarClienteController().handle(req, res)
    })

    fastify.get("/clienteBuscarNome",  async (req, res) =>{
        return new BuscarClienteNomeController().handle(req, res)
    })

    fastify.get("/clienteBuscarId",  async (req, res) =>{
        return new BuscarClienteIdController().handle(req, res)
    })

    fastify.put("/alterarCliente",  async (req, res) =>{
        return new EditarClienteController().handle(req, res)
    })

    fastify.delete("/deletarCliente",  async (req, res) =>{
        return new DeletarClienteController().handle(req, res)
    })
   
// TipoAgenda    
    fastify.post("/tipoAgenda",  async (req, res) =>{
        return new CriarTipoAgendaController().handle(req, res)
    })

    fastify.get("/tipoAgendaBuscar",  async (req, res) =>{
        return new BuscarTipoAgendaController().handle(req, res)
    })

    fastify.get("/tipoAgendaBuscarId",  async (req, res) =>{
        return new BuscarTipoAgendaIdController().handle(req, res)
    })

    fastify.get("/tipoAgendaBuscarNome",  async (req, res) =>{
        return new BuscarTipoAgendaNomeController().handle(req, res)
    })

    fastify.put("/alterarTipoAgenda",  async (req, res) =>{
        return new EditarTipoAgendaController().handle(req, res)
    })
    
    fastify.delete("/deletarTipoAgenda",  async (req, res) =>{
        return new DeletarTipoAgendaController().handle(req, res)
    })
} 