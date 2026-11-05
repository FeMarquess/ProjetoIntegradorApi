import { describe, it, expect } from 'vitest'
import { calcularStatusVisita, etapaQueBloqueia, fimAoConcluir, horarioInvalido, inicioEFimDoDia, lerData, sobrepoe } from '../../src/regras/agenda.js'

const h = (hora: string) => new Date(`2026-11-10T${hora}:00`)

describe('horarioInvalido', () => {
    it('aceita fim depois do início', () => {
        expect(horarioInvalido(h('09:00'), h('10:00'))).toBe(false)
    })
    it('recusa fim igual ou antes do início', () => {
        expect(horarioInvalido(h('10:00'), h('10:00'))).toBe(true)
        expect(horarioInvalido(h('10:00'), h('09:00'))).toBe(true)
    })
    it('recusa datas inválidas', () => {
        expect(horarioInvalido(new Date('xx'), h('10:00'))).toBe(true)
    })
})

describe('sobrepoe', () => {
    const base = { inicio: h('10:00'), fim: h('11:00') }

    it('detecta horário que começa no meio de outro', () => {
        expect(sobrepoe(base, { inicio: h('10:30'), fim: h('11:30') })).toBe(true)
    })
    it('detecta horário que termina no meio de outro', () => {
        expect(sobrepoe(base, { inicio: h('09:30'), fim: h('10:15') })).toBe(true)
    })
    it('detecta horário contido e horário que contém', () => {
        expect(sobrepoe(base, { inicio: h('10:15'), fim: h('10:45') })).toBe(true)
        expect(sobrepoe(base, { inicio: h('09:00'), fim: h('12:00') })).toBe(true)
    })
    it('detecta horário idêntico', () => {
        expect(sobrepoe(base, { ...base })).toBe(true)
    })
    it('permite horários encostados (um termina quando o outro começa)', () => {
        expect(sobrepoe(base, { inicio: h('11:00'), fim: h('12:00') })).toBe(false)
        expect(sobrepoe(base, { inicio: h('09:00'), fim: h('10:00') })).toBe(false)
    })
    it('é simétrica', () => {
        const outro = { inicio: h('10:30'), fim: h('12:00') }
        expect(sobrepoe(base, outro)).toBe(sobrepoe(outro, base))
    })
})

describe('calcularStatusVisita', () => {
    it('libera só a primeira etapa de uma visita nova', () => {
        const etapas = [
            { id: 1, status: 'agendado' },
            { id: 2, status: 'agendado' },
            { id: 3, status: 'agendado' }
        ]
        expect(calcularStatusVisita(etapas)).toEqual([{ id: 1, status: 'liberado' }])
    })

    it('libera a próxima etapa quando a anterior é concluída', () => {
        const etapas = [
            { id: 1, status: 'concluido' },
            { id: 2, status: 'agendado' },
            { id: 3, status: 'agendado' }
        ]
        expect(calcularStatusVisita(etapas)).toEqual([{ id: 2, status: 'liberado' }])
    })

    it('não libera etapas depois de uma em andamento', () => {
        const etapas = [
            { id: 1, status: 'em_andamento' },
            { id: 2, status: 'agendado' }
        ]
        expect(calcularStatusVisita(etapas)).toEqual([])
    })

    it('volta para agendado uma etapa liberada que ganhou etapa pendente antes dela', () => {
        // ex.: foi incluída uma nova etapa mais cedo no mesmo dia
        const etapas = [
            { id: 9, status: 'agendado' },
            { id: 1, status: 'liberado' }
        ]
        expect(calcularStatusVisita(etapas)).toEqual([
            { id: 9, status: 'liberado' },
            { id: 1, status: 'agendado' }
        ])
    })

    it('nunca altera etapas em andamento ou concluídas', () => {
        const etapas = [
            { id: 1, status: 'agendado' },
            { id: 2, status: 'em_andamento' },
            { id: 3, status: 'concluido' }
        ]
        const ids = calcularStatusVisita(etapas).map((m) => m.id)
        expect(ids).not.toContain(2)
        expect(ids).not.toContain(3)
    })

    it('não muda nada quando tudo já está certo', () => {
        expect(calcularStatusVisita([{ id: 1, status: 'liberado' }, { id: 2, status: 'agendado' }])).toEqual([])
        expect(calcularStatusVisita([])).toEqual([])
    })
})

describe('fimAoConcluir', () => {
    it('libera o resto do horário quando termina antes do combinado', () => {
        expect(fimAoConcluir(h('10:00'), h('11:00'), h('10:40'))).toEqual(h('10:40'))
    })
    it('não muda nada quando termina no horário ou depois', () => {
        expect(fimAoConcluir(h('10:00'), h('11:00'), h('11:00'))).toBeNull()
        expect(fimAoConcluir(h('10:00'), h('11:00'), h('11:20'))).toBeNull()
    })
    it('nunca deixa o fim antes do início (etapa adiantada)', () => {
        expect(fimAoConcluir(h('10:00'), h('11:00'), h('09:50'))).toEqual(h('10:00'))
    })
})

describe('datas', () => {
    it('lê AAAA-MM-DD no horário local, sem cair no dia anterior', () => {
        const data = lerData('2026-11-10')
        expect(data.getDate()).toBe(10)
        expect(data.getHours()).toBe(0)
    })
    it('inicioEFimDoDia cobre exatamente um dia', () => {
        const { inicio, fim } = inicioEFimDoDia(h('15:30'))
        expect(inicio).toEqual(h('00:00'))
        expect(fim).toEqual(new Date('2026-11-11T00:00:00'))
    })
})

describe('etapaQueBloqueia', () => {
    const e = (id: number, hora: string, status: string) => ({ id, horaInicio: h(hora), status })

    it('aponta a etapa anterior mais próxima que ainda não terminou', () => {
        const manicure = e(1, '14:00', 'concluido')
        const cabelo = e(2, '15:00', 'liberado')
        const maquiagem = e(3, '16:00', 'agendado')
        expect(etapaQueBloqueia(maquiagem, [manicure, cabelo, maquiagem])).toBe(cabelo)
    })
    it('ignora etapas concluídas e etapas depois dela', () => {
        const feita = e(1, '14:00', 'concluido')
        const atual = e(2, '15:00', 'agendado')
        const depois = e(3, '16:00', 'agendado')
        expect(etapaQueBloqueia(atual, [feita, atual, depois])).toBeNull()
    })
    it('não depende da ordem da lista', () => {
        const a = e(1, '09:00', 'liberado'), b = e(2, '10:00', 'agendado'), c = e(3, '11:00', 'agendado')
        expect(etapaQueBloqueia(c, [c, a, b])).toBe(b)
    })
})
