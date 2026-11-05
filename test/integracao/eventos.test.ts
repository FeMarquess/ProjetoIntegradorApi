import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import type { AddressInfo } from 'node:net'
import { cenario, corpoAgenda, descreverComBanco, limparBanco, novoApp } from './ajuda.js'

// Lê o fluxo SSE até chegar um evento do tipo esperado
async function esperarEvento(leitor: ReadableStreamDefaultReader<Uint8Array>, tipo: string, limiteMs = 5000){
    const decodificador = new TextDecoder()
    let texto = ''
    const prazo = Date.now() + limiteMs
    while(Date.now() < prazo){
        const { value, done } = await leitor.read()
        if(done) break
        texto += decodificador.decode(value, { stream: true })
        const bloco = texto.split('\n\n').find((b) => b.includes(`event: ${tipo}\n`))
        if(bloco) return JSON.parse(bloco.split('\n').find((l) => l.startsWith('data: '))!.slice(6))
    }
    throw new Error(`evento ${tipo} não chegou`)
}

descreverComBanco('tempo real (SSE em /eventos)', () => {
    let app: FastifyInstance
    let base: string
    let c: Awaited<ReturnType<typeof cenario>>

    beforeAll(async () => {
        app = await novoApp()
        await app.listen({ port: 0, host: '127.0.0.1' })
        base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`
    })
    afterAll(async () => { await app.close() })
    beforeEach(async () => {
        await limparBanco()
        c = await cenario()
    })

    it('avisa os aparelhos conectados quando uma agenda é criada', async () => {
        const controle = new AbortController()
        const res = await fetch(`${base}/eventos`, { signal: controle.signal, headers: { Origin: 'http://localhost:3000' } })
        expect(res.headers.get('content-type')).toMatch(/text\/event-stream/)
        expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
        const leitor = res.body!.getReader()

        const criada = (await app.inject({ method: 'POST', url: '/agenda', payload: corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }) })).json()

        const evento = await esperarEvento(leitor, 'agenda_alterada')
        expect(evento).toMatchObject({ acao: 'criada', id: criada.id, funcionarioId: c.ana.id })
        controle.abort()
    })

    it('avisa a próxima profissional quando a etapa dela é liberada', async () => {
        const r1 = (await app.inject({ method: 'POST', url: '/agenda', payload: corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }) })).json()
        await app.inject({ method: 'POST', url: '/agenda', payload: corpoAgenda({ funcionarioId: c.bia.id, clienteId: c.camila.id, tipoAgendaId: c.cabelo.id, inicio: '11:00', fim: '12:00' }) })
        await app.inject({ method: 'PUT', url: `/agendaIniciar?id=${r1.id}`, payload: {} })

        const controle = new AbortController()
        const leitor = (await fetch(`${base}/eventos`, { signal: controle.signal })).body!.getReader()

        await app.inject({ method: 'PUT', url: `/agendaConcluir?id=${r1.id}`, payload: {} })

        const evento = await esperarEvento(leitor, 'etapa_liberada')
        expect(evento).toMatchObject({ funcionarioId: c.bia.id, cliente: 'Camila', servico: 'Cabelo' })
        controle.abort()
    })
})
