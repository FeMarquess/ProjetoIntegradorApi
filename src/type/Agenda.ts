import { z } from "zod";

const AgendaSchema = z.object({
  id: z.number().nullable(),
  descricao: z.string(),
  funcionarioId: z.number(),
  clienteId: z.number(),
  tipoAgendaId: z.number(),
  horaInicio: z.date(),
  horaFim: z.date(),
});

export type Agenda = z.infer<typeof AgendaSchema>;