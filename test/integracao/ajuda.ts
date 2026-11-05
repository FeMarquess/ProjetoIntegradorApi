import { describe } from 'vitest'
import { criarApp } from '../../src/app.js'
import prismaClient from '../../src/prisma/index.js'

export { prismaClient }

// Pula a suíte inteira quando não há banco de teste configurado
export const descreverComBanco = process.env.DATABASE_URL_TESTE ? describe : describe.skip

export async function novoApp(){
    const app = await criarApp({ logger: false })
    await app.ready()
    return app
}

// Apaga todos os dados e reinicia os ids entre um teste e outro
export async function limparBanco(){
    await prismaClient.$executeRawUnsafe(
        'TRUNCATE TABLE "agendas", "_Especialidades", "funcionario", "cliente", "tipoAgenda" RESTART IDENTITY CASCADE'
    )
}

// Cenário básico: dois serviços, duas profissionais e duas clientes
export async function cenario(){
    const manicure = await prismaClient.tipoAgenda.create({ data: { descricao: 'Manicure' } })
    const cabelo = await prismaClient.tipoAgenda.create({ data: { descricao: 'Cabelo' } })
    const ana = await prismaClient.funcionario.create({
        data: { descricao: 'Ana', especialidades: { connect: [{ id: manicure.id }] } }
    })
    const bia = await prismaClient.funcionario.create({
        data: { descricao: 'Bia', especialidades: { connect: [{ id: cabelo.id }, { id: manicure.id }] } }
    })
    const camila = await prismaClient.cliente.create({
        data: { descricao: 'Camila', dataNascimento: new Date('1990-05-20T00:00:00.000Z') }
    })
    const duda = await prismaClient.cliente.create({ data: { descricao: 'Duda' } })
    return { manicure, cabelo, ana, bia, camila, duda }
}

// Horário local num dia fixo, para os testes não dependerem do relógio
export const DIA = '2026-11-10'
export const h = (hora: string, dia = DIA) => new Date(`${dia}T${hora}:00`)

export function corpoAgenda(dados: { funcionarioId: number, clienteId: number | null, tipoAgendaId: number, inicio: string, fim: string, dia?: string }){
    return {
        descricao: 'teste',
        funcionarioId: dados.funcionarioId,
        clienteId: dados.clienteId,
        tipoAgendaId: dados.tipoAgendaId,
        horaInicio: h(dados.inicio, dados.dia).toISOString(),
        horaFim: h(dados.fim, dados.dia).toISOString()
    }
}
