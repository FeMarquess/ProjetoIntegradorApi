# API — Gestão de tempo e serviços do salão

API em Node.js (Fastify + Prisma + PostgreSQL) do Projeto Integrador.

## Rodando

```bash
cp .env.example .env          # ajuste DATABASE_URL
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev                   # http://localhost:3333
```

## Testes

```bash
npm run test:unit             # só as regras de negócio, sem banco
npm test                      # unitários + integração (precisa de DATABASE_URL_TESTE)
```

`DATABASE_URL_TESTE` deve apontar para um banco **separado**, que é apagado a cada teste.
Um jeito rápido de ter um:

```bash
docker run -d --name salao-teste -e POSTGRES_PASSWORD=pi -e POSTGRES_DB=salao_teste -p 5433:5432 postgres:16
export DATABASE_URL_TESTE=postgresql://postgres:pi@localhost:5433/salao_teste
npm test
```

O GitHub Actions (`.github/workflows/ci.yml`) roda type-check e todos os testes a cada push.

| Arquivo | O que testa |
|---|---|
| `test/unit/agenda.test.ts` | sobreposição de horários, liberação encadeada das etapas, liberação do horário ao concluir |
| `test/unit/indicadores.test.ts` | idade na data do atendimento, faixas etárias, médias |
| `test/integracao/agenda.test.ts` | conflitos de horário (profissional e cliente), 10 reservas simultâneas, códigos HTTP |
| `test/integracao/triagem.test.ts` | iniciar/concluir, liberação da próxima etapa, horário liberado, indicadores |
| `test/integracao/cadastros.test.ts` | várias especialidades por profissional, histórico da cliente, exclusões bloqueadas |
| `test/integracao/eventos.test.ts` | notificação em tempo real (SSE) |

## Regras principais

- **Sem sobreposição de horários.** A mesma profissional ou a mesma cliente não pode ter dois
  atendimentos ao mesmo tempo. Criar e alterar agendas roda numa transação com
  `pg_advisory_xact_lock` (exclusão mútua por profissional e por cliente), então reservas
  simultâneas são processadas uma de cada vez. Conflito responde **409**.
- **Triagem encadeada.** As etapas da mesma cliente no mesmo dia formam uma visita; cada etapa
  só é liberada quando as anteriores foram concluídas.
- **Concluir libera o horário.** Se a etapa termina antes do combinado, `horaFim` passa a ser o
  horário real de conclusão (o original fica em `horaFimPrevista`) e o tempo restante fica livre.
  `inicioReal` e `fimReal` alimentam o indicador de tempo previsto × real.
- **Tempo real.** `GET /eventos` (Server-Sent Events) avisa os navegadores conectados quando a
  agenda muda (`agenda_alterada`) e quando uma etapa é liberada (`etapa_liberada`).
- **Erros** respondem com o código HTTP adequado (400, 404, 409) e corpo `{ "mensagem": "..." }`.

## Rotas novas

| Rota | Descrição |
|---|---|
| `GET /agendaBuscarCliente?clienteId=` | histórico de procedimentos da cliente |
| `GET /eventos` | fluxo SSE de notificações |

`POST /funcionario` e `PUT /alterarFuncionario` recebem `{ "descricao", "especialidades": [ids] }`
(o formato antigo `{ "funcao": id }` continua aceito). As respostas trazem `especialidades: [{ id, descricao }]`.

## Hospedagem

O servidor lê `PORT` e `HOST` do ambiente. Em serviços como Render ou Railway:
build `npm install && npx prisma generate && npx prisma migrate deploy`, start `npm start`.
O SSE precisa de um servidor sempre ligado (não funciona em funções serverless).
