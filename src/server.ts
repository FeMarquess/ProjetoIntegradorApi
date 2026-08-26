import { fastify } from 'fastify'
import cors from '@fastify/cors'
import { routes } from './routes.js'
import 'dotenv/config'

const app = fastify({ logger: true })

const start = async () =>{
    await app.register(cors, {
     origin: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE']
    })

    app.register(routes)
    
    try{
        await app.listen({port: 3333})

        app.get('/', async () => {
          return { hello: 'world' }
        })
    }catch(err){

    }
}

start();