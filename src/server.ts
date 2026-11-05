import 'dotenv/config'
import { criarApp } from './app.js'

const start = async () =>{
    const app = await criarApp()

    try{
        // PORT e HOST permitem hospedar em nuvem (Render, Railway etc.); localmente continua na 3333
        await app.listen({
            port: Number(process.env.PORT ?? 3333),
            host: process.env.HOST ?? '0.0.0.0'
        })
    }catch(err){
        app.log.error(err)
        process.exit(1)
    }
}

start();
