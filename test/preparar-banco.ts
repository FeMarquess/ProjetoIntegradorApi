import { execSync } from 'node:child_process'

// Aplica as migrations no banco de teste antes de rodar a suíte
export default function prepararBanco(){
    const url = process.env.DATABASE_URL_TESTE
    if(!url){
        console.warn('\n[testes] DATABASE_URL_TESTE não definida: testes de integração serão pulados.\n')
        return
    }
    execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: url }
    })
}
