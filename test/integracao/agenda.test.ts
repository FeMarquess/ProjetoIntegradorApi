import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { cenario, corpoAgenda, descreverComBanco, limparBanco, novoApp, prismaClient } from './ajuda.js'

descreverComBanco('agenda: conflitos de horário (exclusão mútua)', () => {
    let app: FastifyInstance
    let c: Awaited<ReturnType<typeof cenario>>

    beforeAll(async () => { app = await novoApp() })
    afterAll(async () => { await app.close() })
    beforeEach(async () => {
        await limparBanco()
        c = await cenario()
    })

    const criar = (corpo: object) => app.inject({ method: 'POST', url: '/agenda', payload: corpo })

    it('cria uma agenda válida e a primeira etapa já fica liberada', async () => {
        const res = await criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }))
        expect(res.statusCode).toBe(200)
        expect(res.json()).toMatchObject({ status: 'liberado', cliente: { descricao: 'Camila' }, funcionario: { descricao: 'Ana' } })
    })

    it('recusa fim antes do início com 400', async () => {
        const res = await criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '11:00', fim: '10:00' }))
        expect(res.statusCode).toBe(400)
        expect(res.json().mensagem).toMatch(/fim/)
    })

    it('recusa corpo inválido com 400', async () => {
        const res = await criar({ descricao: 'x' })
        expect(res.statusCode).toBe(400)
    })

    it('recusa a mesma profissional em horário sobreposto com 409', async () => {
        await criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }))
        const res = await criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.duda.id, tipoAgendaId: c.manicure.id, inicio: '10:30', fim: '11:30' }))
        expect(res.statusCode).toBe(409)
        expect(res.json().mensagem).toMatch(/profissional já tem atendimento.*Camila/)
        expect(await prismaClient.agenda.count()).toBe(1)
    })

    it('permite horário encostado (começa quando o outro termina)', async () => {
        await criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }))
        const res = await criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.duda.id, tipoAgendaId: c.manicure.id, inicio: '11:00', fim: '12:00' }))
        expect(res.statusCode).toBe(200)
    })

    it('permite outra profissional no mesmo horário', async () => {
        await criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }))
        const res = await criar(corpoAgenda({ funcionarioId: c.bia.id, clienteId: c.duda.id, tipoAgendaId: c.cabelo.id, inicio: '10:00', fim: '11:00' }))
        expect(res.statusCode).toBe(200)
    })

    it('recusa a mesma cliente em dois atendimentos ao mesmo tempo', async () => {
        await criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }))
        const res = await criar(corpoAgenda({ funcionarioId: c.bia.id, clienteId: c.camila.id, tipoAgendaId: c.cabelo.id, inicio: '10:30', fim: '11:30' }))
        expect(res.statusCode).toBe(409)
        expect(res.json().mensagem).toMatch(/cliente já está agendada/)
    })

    it('recusa profissional que não atende o serviço', async () => {
        // Ana só faz manicure
        const res = await criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.cabelo.id, inicio: '10:00', fim: '11:00' }))
        expect(res.statusCode).toBe(400)
        expect(res.json().mensagem).toMatch(/não atende/)
    })

    it('com 10 reservas simultâneas no mesmo horário, só uma é aceita', async () => {
        const clientes = await Promise.all(Array.from({ length: 10 }, (_, i) =>
            prismaClient.cliente.create({ data: { descricao: `Cliente ${i}` } })))

        const respostas = await Promise.all(clientes.map((cliente) =>
            criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: cliente.id, tipoAgendaId: c.manicure.id, inicio: '14:00', fim: '15:00' }))))

        const codigos = respostas.map((r) => r.statusCode).sort()
        expect(codigos.filter((s) => s === 200)).toHaveLength(1)
        expect(codigos.filter((s) => s === 409)).toHaveLength(9)
        expect(await prismaClient.agenda.count({ where: { funcionarioId: c.ana.id } })).toBe(1)
    })

    it('alterar para um horário ocupado é recusado, mas a agenda não conflita com ela mesma', async () => {
        const a = (await criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }))).json()
        await criar(corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.duda.id, tipoAgendaId: c.manicure.id, inicio: '12:00', fim: '13:00' }))

        // estender a própria agenda em 30 min: ok
        const ok = await app.inject({ method: 'PUT', url: `/alterarAgenda?id=${a.id}`, payload: corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:30' }) })
        expect(ok.statusCode).toBe(200)

        // invadir a agenda das 12:00: recusado
        const ruim = await app.inject({ method: 'PUT', url: `/alterarAgenda?id=${a.id}`, payload: corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '11:30', fim: '12:30' }) })
        expect(ruim.statusCode).toBe(409)
    })

    it('alterar ou buscar agenda inexistente devolve 404', async () => {
        const alterar = await app.inject({ method: 'PUT', url: '/alterarAgenda?id=999', payload: corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }) })
        expect(alterar.statusCode).toBe(404)
        const buscar = await app.inject({ method: 'GET', url: '/agendaBuscarId?id=999' })
        expect(buscar.statusCode).toBe(404)
    })
})
