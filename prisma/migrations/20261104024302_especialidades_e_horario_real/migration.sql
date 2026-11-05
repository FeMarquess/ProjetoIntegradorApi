-- Profissional passa a ter várias especialidades (tabela N:N "_Especialidades")
-- e a agenda passa a guardar os horários reais de início e conclusão.

-- AlterTable
ALTER TABLE "agendas" ADD COLUMN     "fimReal" TIMESTAMP(3),
ADD COLUMN     "horaFimPrevista" TIMESTAMP(3),
ADD COLUMN     "inicioReal" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "_Especialidades" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Especialidades_AB_pkey" PRIMARY KEY ("A","B")
);

-- Copia a especialidade única de cada profissional para a nova tabela antes de apagar a coluna.
-- "funcao" não era chave estrangeira, então ignora valores que não existem em "tipoAgenda".
INSERT INTO "_Especialidades" ("A", "B")
SELECT f."id", f."funcao"
FROM "funcionario" f
JOIN "tipoAgenda" t ON t."id" = f."funcao";

-- AlterTable
ALTER TABLE "funcionario" DROP COLUMN "funcao";

-- CreateIndex
CREATE INDEX "_Especialidades_B_index" ON "_Especialidades"("B");

-- CreateIndex
CREATE INDEX "agendas_funcionarioId_horaInicio_idx" ON "agendas"("funcionarioId", "horaInicio");

-- CreateIndex
CREATE INDEX "agendas_clienteId_horaInicio_idx" ON "agendas"("clienteId", "horaInicio");

-- AddForeignKey
ALTER TABLE "_Especialidades" ADD CONSTRAINT "_Especialidades_A_fkey" FOREIGN KEY ("A") REFERENCES "funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Especialidades" ADD CONSTRAINT "_Especialidades_B_fkey" FOREIGN KEY ("B") REFERENCES "tipoAgenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
