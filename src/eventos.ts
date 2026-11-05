import { EventEmitter } from "node:events";
import type { FastifyInstance } from "fastify";

// Notificação em tempo real por Server-Sent Events (SSE).
// Os serviços chamam publicar() quando a agenda muda; cada navegador conectado em GET /eventos
// recebe o evento na hora e recarrega a tela, sem esperar a atualização periódica.

export type TipoEvento = "agenda_alterada" | "etapa_liberada"

export interface Evento {
    tipo: TipoEvento
    dados: Record<string, unknown>
}

const barramento = new EventEmitter()
// cada aparelho conectado é um ouvinte; não há limite fixo
barramento.setMaxListeners(0)

export function publicar(tipo: TipoEvento, dados: Record<string, unknown>){
    barramento.emit("evento", { tipo, dados } satisfies Evento)
}

export function assinar(ouvinte: (evento: Evento) => void){
    barramento.on("evento", ouvinte)
    return () => { barramento.off("evento", ouvinte) }
}

const BATIMENTO_MS = 25000

export async function rotasEventos(fastify: FastifyInstance){
    fastify.get("/eventos", (req, reply) => {
        // a conexão fica aberta; o Fastify não deve tentar responder sozinho
        reply.hijack()

        const origem = req.headers.origin
        reply.raw.writeHead(200, {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            // hijack pula o plugin de CORS, então o cabeçalho vai aqui
            ...(origem ? { "Access-Control-Allow-Origin": origem, "Vary": "Origin" } : {})
        })
        // se a conexão cair, o navegador tenta de novo em 3 s
        reply.raw.write("retry: 3000\n\n")

        const parar = assinar(({ tipo, dados }) => {
            reply.raw.write(`event: ${tipo}\ndata: ${JSON.stringify(dados)}\n\n`)
        })
        // comentário periódico para proxies não derrubarem a conexão parada
        const batimento = setInterval(() => reply.raw.write(": ping\n\n"), BATIMENTO_MS)

        req.raw.on("close", () => {
            clearInterval(batimento)
            parar()
        })
    })
}
