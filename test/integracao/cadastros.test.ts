import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { cenario, corpoAgenda, descreverComBanco, limparBanco, novoApp, prismaClient } from './ajuda.js'

descreverComBanco('cadastros: profissionais, especialidades e histórico da cliente', () => {
    let app: FastifyInstance
    let c: Awaited<ReturnType<typeof cenario>>

    beforeAll(async () => { app = await novoApp() })
    afterAll(async () => { await app.close() })
    beforeEach(async () => {
        await limparBanco()
        c = await cenario()
    })

    it('cadastra profissional com várias especialidades', async () => {
        const res = await app.inject({ method: 'POST', url: '/funcionario', payload: { descricao: 'Carla', especialidades: [c.manicure.id, c.cabelo.id] } })
        expect(res.statusCode).toBe(200)
        expect(res.json().especialidades.map((e: { descricao: string }) => e.descricao)).toEqual(['Cabelo', 'Manicure'])
    })

    it('ainda aceita o formato antigo com uma "funcao"', async () => {
        const res = await app.inject({ method: 'POST', url: '/funcionario', payload: { descricao: 'Dani', funcao: c.cabelo.id } })
        expect(res.statusCode).toBe(200)
        expect(res.json().especialidades).toHaveLength(1)
    })

    it('exige ao menos uma especialidade válida', async () => {
        expect((await app.inject({ method: 'POST', url: '/funcionario', payload: { descricao: 'Eva', especialidades: [] } })).statusCode).toBe(400)
        expect((await app.inject({ method: 'POST', url: '/funcionario', payload: { descricao: 'Eva', especialidades: [999] } })).statusCode).toBe(400)
    })

    it('editar troca a lista inteira de especialidades', async () => {
        const res = await app.inject({ method: 'PUT', url: `/alterarFuncionario?id=${c.bia.id}`, payload: { descricao: 'Bia', especialidades: [c.cabelo.id] } })
        expect(res.statusCode).toBe(200)
        expect(res.json().especialidades.map((e: { id: number }) => e.id)).toEqual([c.cabelo.id])
    })

    it('busca para agendamento devolve um item por profissional e serviço', async () => {
        // "manicure" bate no serviço: Ana e Bia fazem manicure
        const porServico = (await app.inject({ method: 'GET', url: '/funcionarioBuscarEspecialidade?descricao=manicure' })).json()
        expect(porServico.map((f: { descricao: string, especialidade: string }) => `${f.descricao}/${f.especialidade}`)).toEqual(['Ana/Manicure', 'Bia/Manicure'])

        // "bia" bate no nome: todos os serviços da Bia
        const porNome = (await app.inject({ method: 'GET', url: '/funcionarioBuscarEspecialidade?descricao=bia' })).json()
        expect(porNome.map((f: { tipoAgendaId: number }) => f.tipoAgendaId).sort()).toEqual([c.manicure.id, c.cabelo.id].sort())
    })

    it('não exclui especialidade em uso nem profissional com agenda', async () => {
        const especialidade = await app.inject({ method: 'DELETE', url: `/deletarTipoAgenda?id=${c.cabelo.id}` })
        expect(especialidade.statusCode).toBe(409)
        expect(especialidade.json().mensagem).toMatch(/Bia/)

        await app.inject({ method: 'POST', url: '/agenda', payload: corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }) })
        const profissional = await app.inject({ method: 'DELETE', url: `/deletarFuncionario?id=${c.ana.id}` })
        expect(profissional.statusCode).toBe(409)
        expect(await prismaClient.funcionario.count()).toBe(2)
    })

    it('histórico da cliente traz os procedimentos do mais recente ao mais antigo', async () => {
        await app.inject({ method: 'POST', url: '/agenda', payload: corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.camila.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00', dia: '2026-10-01' }) })
        await app.inject({ method: 'POST', url: '/agenda', payload: corpoAgenda({ funcionarioId: c.bia.id, clienteId: c.camila.id, tipoAgendaId: c.cabelo.id, inicio: '09:00', fim: '10:00', dia: '2026-11-01' }) })
        await app.inject({ method: 'POST', url: '/agenda', payload: corpoAgenda({ funcionarioId: c.ana.id, clienteId: c.duda.id, tipoAgendaId: c.manicure.id, inicio: '10:00', fim: '11:00' }) })

        const res = await app.inject({ method: 'GET', url: `/agendaBuscarCliente?clienteId=${c.camila.id}` })
        expect(res.statusCode).toBe(200)
        expect(res.json().map((a: { tipoAgenda: { descricao: string } }) => a.tipoAgenda.descricao)).toEqual(['Cabelo', 'Manicure'])
    })

    it('cliente: valida nome e devolve 404 para id inexistente', async () => {
        expect((await app.inject({ method: 'POST', url: '/cliente', payload: { descricao: '  ' } })).statusCode).toBe(400)
        expect((await app.inject({ method: 'GET', url: '/clienteBuscarId?id=999' })).statusCode).toBe(404)
        expect((await app.inject({ method: 'GET', url: '/clienteBuscarId?id=abc' })).statusCode).toBe(400)
    })
})
