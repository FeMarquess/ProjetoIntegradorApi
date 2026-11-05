// Cálculos do módulo de indicadores (BI) como funções puras.

export const FAIXAS = [
    { faixa: "Até 17", min: 0, max: 17 },
    { faixa: "18 a 24", min: 18, max: 24 },
    { faixa: "25 a 34", min: 25, max: 34 },
    { faixa: "35 a 44", min: 35, max: 44 },
    { faixa: "45 a 59", min: 45, max: 59 },
    { faixa: "60 ou mais", min: 60, max: 200 }
]

// Idade da cliente no dia do atendimento.
// A data de nascimento é gravada como meia-noite UTC, por isso é lida em UTC.
export function idadeNaData(nascimento: Date, data: Date){
    let idade = data.getFullYear() - nascimento.getUTCFullYear()
    const fezAniversario = data.getMonth() > nascimento.getUTCMonth()
        || (data.getMonth() === nascimento.getUTCMonth() && data.getDate() >= nascimento.getUTCDate())
    if(!fezAniversario) idade--
    return idade
}

// Índice da faixa em FAIXAS, ou -1 se a idade for inválida
export function indiceFaixa(idade: number){
    return FAIXAS.findIndex((f) => idade >= f.min && idade <= f.max)
}

export function minutosEntre(inicio: Date, fim: Date){
    return (fim.getTime() - inicio.getTime()) / 60000
}

export function mediaArredondada(valores: number[]){
    return valores.length
        ? Math.round(valores.reduce((soma, v) => soma + v, 0) / valores.length)
        : null
}

export const chaveDia = (data: Date) =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
