// Regras da agenda e da triagem como funções puras (sem banco), para poderem ser testadas isoladamente.

export type StatusAgenda = "agendado" | "liberado" | "em_andamento" | "concluido"

export interface Intervalo {
    inicio: Date
    fim: Date
}

export function horarioInvalido(inicio: Date, fim: Date){
    return isNaN(inicio.getTime()) || isNaN(fim.getTime()) || fim <= inicio
}

// Dois horários se sobrepõem quando um começa antes do outro terminar.
// Horários encostados (um termina 10:00 e o outro começa 10:00) não se sobrepõem.
export function sobrepoe(a: Intervalo, b: Intervalo){
    return a.inicio < b.fim && b.inicio < a.fim
}

// A visita é o conjunto de etapas da mesma cliente no mesmo dia, em ordem de horário.
// Uma etapa fica liberada quando todas as anteriores foram concluídas; senão fica agendada.
// Etapas em andamento ou concluídas não mudam. Devolve só as etapas cujo status precisa mudar.
export function calcularStatusVisita<T extends { id: number, status: string }>(etapasEmOrdem: T[]){
    const mudancas: { id: number, status: StatusAgenda }[] = []
    let anterioresConcluidas = true

    for(const etapa of etapasEmOrdem){
        if(etapa.status === "agendado" || etapa.status === "liberado"){
            const novoStatus: StatusAgenda = anterioresConcluidas ? "liberado" : "agendado"
            if(novoStatus !== etapa.status) mudancas.push({ id: etapa.id, status: novoStatus })
        }
        if(etapa.status !== "concluido") anterioresConcluidas = false
    }
    return mudancas
}

// Ao concluir antes do horário combinado, o resto do horário é liberado na agenda:
// o fim passa a ser o momento da conclusão (nunca antes do início).
// Devolve null quando a etapa terminou no horário ou depois, e então nada muda.
export function fimAoConcluir(horaInicio: Date, horaFim: Date, agora: Date){
    if(agora >= horaFim) return null
    return agora > horaInicio ? agora : horaInicio
}

export function inicioEFimDoDia(data: Date){
    const inicio = new Date(data)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(inicio)
    fim.setDate(fim.getDate() + 1)
    return { inicio, fim }
}

// "AAAA-MM-DD" sem hora é lido como UTC; força horário local para não cair no dia anterior
export function lerData(data?: string | Date){
    if(!data) return new Date()
    const texto = String(data)
    return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? new Date(`${texto}T00:00:00`) : new Date(data)
}

// Para uma etapa "agendado", qual etapa ela está esperando: a etapa anterior mais próxima
// da mesma visita (mesma cliente, mesmo dia) que ainda não foi concluída. null se nenhuma.
type EtapaBasica = { id: number, horaInicio: Date, status: string }

export function etapaQueBloqueia<E extends EtapaBasica>(etapa: EtapaBasica, etapasDaVisita: E[]): E | null {
    const anteriores = etapasDaVisita
        .filter((e) => e.id !== etapa.id && e.status !== "concluido" && e.horaInicio < etapa.horaInicio)
        .sort((a, b) => a.horaInicio.getTime() - b.horaInicio.getTime())
    return anteriores.at(-1) ?? null
}
