// Erro de regra de negócio com o código HTTP que a API deve devolver.
// O tratador de erros do app (src/app.ts) transforma em { mensagem } com esse status.
export class ErroApi extends Error {
    constructor(public status: number, mensagem: string){
        super(mensagem)
        this.name = "ErroApi"
    }
}

export const requisicaoInvalida = (mensagem: string) => new ErroApi(400, mensagem)
export const naoEncontrado = (mensagem: string) => new ErroApi(404, mensagem)
export const conflito = (mensagem: string) => new ErroApi(409, mensagem)

// Códigos do Prisma: P2025 = registro não encontrado, P2003 = chave estrangeira em uso
export function codigoPrisma(error: unknown): string | undefined {
    return typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : undefined
}

// id vindo da query string ("12") como número inteiro positivo, ou erro 400
export function lerId(id: unknown){
    const numero = Number(id)
    if(!Number.isInteger(numero) || numero <= 0) throw requisicaoInvalida("Informe um id válido")
    return numero
}
