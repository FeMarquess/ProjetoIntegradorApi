import { defineConfig } from 'vitest/config'

// Os testes de integração usam um banco PRÓPRIO de teste (DATABASE_URL_TESTE), que é apagado
// antes de cada teste. Nunca aponte DATABASE_URL_TESTE para o banco de produção.
// Sem DATABASE_URL_TESTE, os testes de integração são pulados e só os unitários rodam.
const bancoTeste = process.env.DATABASE_URL_TESTE

export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        globalSetup: ['test/preparar-banco.ts'],
        // os testes de integração dividem o mesmo banco: um arquivo por vez
        fileParallelism: false,
        env: {
            // o Prisma do app lê DATABASE_URL; nos testes ela aponta para o banco de teste
            DATABASE_URL: bancoTeste ?? 'postgresql://sem-banco-de-teste/invalido',
            TZ: 'America/Sao_Paulo'
        }
    }
})
