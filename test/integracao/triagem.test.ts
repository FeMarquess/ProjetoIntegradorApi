import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { cenario, corpoAgenda, descreverComBanco, h, limparBanco, novoApp, prismaClient } from './ajuda.js'

descreverComBanco('triagem encadeada: iniciar, concluir e liberar', () => {
    let app: FastifyInstance
    let c: Awaited<ReturnType<typeof cenario>>
    let etapa1: number
    let etapa2: number

    beforeAll(async () => { app = await novoApp() })
    afterAll(async () => { await app.close() })
    afterEach(() => { vi.useRealTimers() })
    beforeEach(async () => {
        await limparBanco()
        c = await cenario()
        // visita da Camila: manicure 10:00-11:00 com Ana, depois cabelo 11:00-12:00 com Bia
        const r1 = await app.inject({ method: 'POST', url: '/agenda', payload: corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }) })
        const r2 = await app.inject({ method: 'POST', url: '/agenda', payload: corpoAgenda({ funcionarioId: c.bia.id, clienteId: c.camila.id, tipoAgendaId: c.cabelo.id, inicio: '11:00', fim: '12:00' }) })
        etapa1 = r1.json().id
        etapa2 = r2.json().id
    })

    // relógio do servidor parado num horário do dia do teste (só Date; timers continuam reais)
    const relogio = (hora: string) => {
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(h(hora))
    }
    const iniciar = (id: number) => app.inject({ method: 'PUT', url: `/agendaIniciar?id=${id}`, payload: {} })
    const concluir = (id: number) => app.inject({ method: 'PUT', url: `/agendaConcluir?id=${id}`, payload: {} })
    const status = async (id: number) => (await prismaClient.agenda.findUniqueOrThrow({ where: { id } })).status

    it('a segunda etapa espera a primeira', async () => {
        expect(await status(etapa1)).toBe('liberado')
        expect(await status(etapa2)).toBe('agendado')

        const res = await iniciar(etapa2)
        expect(res.statusCode).toBe(409)
        expect(res.json().mensagem).toMatch(/etapa anterior/)
    })

    it('não deixa concluir sem iniciar, nem iniciar duas vezes', async () => {
        expect((await concluir(etapa1)).statusCode).toBe(409)
        expect((await iniciar(etapa1)).statusCode).toBe(200)
        expect((await iniciar(etapa1)).statusCode).toBe(409)
    })

    it('id inexistente devolve 404', async () => {
        expect((await iniciar(999)).statusCode).toBe(404)
        expect((await concluir(999)).statusCode).toBe(404)
    })

    it('concluir libera a próxima etapa e grava os horários reais', async () => {
        relogio('10:05')
        expect((await iniciar(etapa1)).json()).toMatchObject({ status: 'em_andamento' })
        relogio('11:00')
        const res = await concluir(etapa1)
        expect(res.statusCode).toBe(200)

        const feita = await prismaClient.agenda.findUniqueOrThrow({ where: { id: etapa1 } })
        expect(feita.status).toBe('concluido')
        expect(feita.inicioReal).toEqual(h('10:05'))
        expect(feita.fimReal).toEqual(h('11:00'))
        // terminou no horário: nada muda no fim combinado
        expect(feita.horaFim).toEqual(h('11:00'))
        expect(feita.horaFimPrevista).toBeNull()

        expect(await status(etapa2)).toBe('liberado')
        expect((await iniciar(etapa2)).statusCode).toBe(200)
    })

    it('concluir antes do horário libera o resto do horário na agenda da profissional', async () => {
        relogio('10:00')
        await iniciar(etapa1)
        relogio('10:40')
        await concluir(etapa1)

        const feita = await prismaClient.agenda.findUniqueOrThrow({ where: { id: etapa1 } })
        expect(feita.horaFim).toEqual(h('10:40'))
        expect(feita.horaFimPrevista).toEqual(h('11:00'))

        // os 20 minutos liberados agora podem ser agendados para outra cliente
        vi.useRealTimers()
        const encaixe = await app.inject({ method: 'POST', url: '/agenda', payload: corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.duda.id, tipoAgendaId: c.manicure.id, inicio: '10:40', fim: '11:00' }) })
        expect(encaixe.statusCode).toBe(200)
    })

    it('etapa bloqueada informa qual etapa está esperando', async () => {
        const res = await app.inject({ method: 'GET', url: `/agendaBuscarFuncionario?funcionarioId=${c.bia.id}&data=2026-11-10` })
        const [cabelo] = res.json()
        expect(cabelo.status).toBe('agendado')
        expect(cabelo.aguardando).toMatchObject({ id: etapa1, servico: 'Manicure', profissional: 'Ana' })
        expect(new Date(cabelo.aguardando.horaInicio)).toEqual(h('10:00'))

        // a etapa liberada não espera nada
        const dia = (await app.inject({ method: 'GET', url: '/agendaBuscarData?data=2026-11-10' })).json()
        expect(dia.find((a: { id: number }) => a.id === etapa1).aguardando).toBeNull()

        // depois de concluir a manicure, o cabelo deixa de esperar
        await iniciar(etapa1)
        await concluir(etapa1)
        const porId = (await app.inject({ method: 'GET', url: `/agendaBuscarId?id=${etapa2}` })).json()
        expect(porId.status).toBe('liberado')
        expect(porId.aguardando).toBeNull()
    })

    it('painel da profissional lista só as agendas dela no dia', async () => {
        const res = await app.inject({ method: 'GET', url: `/agendaBuscarFuncionario?funcionarioId=${c.bia.id}&data=2026-11-10` })
        expect(res.statusCode).toBe(200)
        expect(res.json().map((a: { id: number }) => a.id)).toEqual([etapa2])
    })

    it('indicadores contam só concluídos e comparam tempo previsto com real', async () => {
        relogio('10:00')
        await iniciar(etapa1)
        relogio('10:40')
        await concluir(etapa1)
        vi.useRealTimers()

        const res = await app.inject({ method: 'GET', url: '/indicadores' })
        const dados = res.json()
        expect(dados.totalAtendimentos).toBe(1)
        expect(dados.servicos[0]).toMatchObject({
            descricao: 'Manicure',
            total: 1,
            duracaoPrevistaMedia: 60,
            duracaoRealMedia: 40,
            idadeMedia: 36
        })
        expect(dados.faixas.find((f: { faixa: string }) => f.faixa === '35 a 44').total).toBe(1)
    })
})
