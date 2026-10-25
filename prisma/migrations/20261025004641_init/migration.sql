-- CreateTable
CREATE TABLE "agendas" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "clienteId" INTEGER,
    "tipoAgendaId" INTEGER NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaFim" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionario" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "funcao" INTEGER NOT NULL,

    CONSTRAINT "funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipoAgenda" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "tipoAgenda_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_tipoAgendaId_fkey" FOREIGN KEY ("tipoAgendaId") REFERENCES "tipoAgenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
