import { describe, it, expect } from 'vitest'
import { FAIXAS, chaveDia, idadeNaData, indiceFaixa, mediaArredondada, minutosEntre } from '../../src/regras/indicadores.js'

// a data de nascimento vem do banco como meia-noite UTC
const nascimento = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

describe('idadeNaData', () => {
    it('conta o aniversário no próprio dia', () => {
        expect(idadeNaData(nascimento('2000-11-10'), new Date('2026-11-10T09:00:00'))).toBe(26)
    })
    it('ainda não fez aniversário na véspera', () => {
        expect(idadeNaData(nascimento('2000-11-10'), new Date('2026-11-09T23:00:00'))).toBe(25)
    })
    it('mês anterior ao aniversário', () => {
        expect(idadeNaData(nascimento('2000-12-01'), new Date('2026-11-30T10:00:00'))).toBe(25)
    })
})

describe('indiceFaixa', () => {
    it('coloca cada idade na faixa certa, inclusive nos limites', () => {
        expect(FAIXAS[indiceFaixa(17)]!.faixa).toBe('Até 17')
        expect(FAIXAS[indiceFaixa(18)]!.faixa).toBe('18 a 24')
        expect(FAIXAS[indiceFaixa(24)]!.faixa).toBe('18 a 24')
        expect(FAIXAS[indiceFaixa(25)]!.faixa).toBe('25 a 34')
        expect(FAIXAS[indiceFaixa(59)]!.faixa).toBe('45 a 59')
        expect(FAIXAS[indiceFaixa(60)]!.faixa).toBe('60 ou mais')
    })
    it('idade negativa (nascimento no futuro) fica fora das faixas', () => {
        expect(indiceFaixa(-1)).toBe(-1)
    })
})

describe('auxiliares', () => {
    it('minutosEntre', () => {
        expect(minutosEntre(new Date('2026-11-10T10:00:00'), new Date('2026-11-10T11:30:00'))).toBe(90)
    })
    it('mediaArredondada', () => {
        expect(mediaArredondada([30, 45, 50])).toBe(42)
        expect(mediaArredondada([])).toBeNull()
    })
    it('chaveDia usa o dia local', () => {
        expect(chaveDia(new Date('2026-01-05T23:30:00'))).toBe('2026-01-05')
    })
})
