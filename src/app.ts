import { fastify, type FastifyServerOptions } from 'fastify'
import cors from '@fastify/cors'
import { ZodError } from 'zod'
import { routes } from './routes.js'
import { rotasEventos } from './eventos.js'
import { ErroApi, codigoPrisma } from './erros.js'

// Monta o app sem abrir porta: o server.ts chama listen() e os testes usam app.inject()
export async function criarApp(opcoes: FastifyServerOptions = {}){
    const app = fastify({
        logger: true,
        // conexões SSE ficam abertas; fecha todas ao desligar o servidor
        forceCloseConnections: true,
        ...opcoes
    })

    await app.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    })

    // Erros viram respostas HTTP com código correto e corpo { mensagem }
    app.setErrorHandler((error, req, reply) => {
        if(error instanceof ErroApi){
            return reply.status(error.status).send({ mensagem: error.message })
        }
        if(error instanceof ZodError){
            const detalhe = error.issues.map((i) => `${i.path.join('.') || 'corpo'}: ${i.message}`).join('; ')
            return reply.status(400).send({ mensagem: `Dados inválidos (${detalhe})` })
        }
        const codigo = codigoPrisma(error)
        if(codigo === 'P2025'){
            return reply.status(404).send({ mensagem: 'Registro não encontrado' })
        }
        if(codigo === 'P2003'){
            return reply.status(409).send({ mensagem: 'O registro está em uso por outro cadastro' })
        }
        const status = (error as { statusCode?: number }).statusCode
        if(status && status < 500){
            return reply.status(status).send({ mensagem: (error as Error).message })
        }
        req.log.error(error)
        return reply.status(500).send({ mensagem: 'Erro interno no servidor' })
    })

    await app.register(routes)
    await app.register(rotasEventos)

    app.get('/', async () => {
        return { hello: 'world' }
    })

    return app
}
