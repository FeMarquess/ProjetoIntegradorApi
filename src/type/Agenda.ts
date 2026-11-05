import { z } from "zod";

// Corpo de criação/alteração de agenda. Datas chegam como texto ISO no JSON.
export const AgendaSchema = z.object({
  id: z.number().nullable().optional(),
  descricao: z.string(),
  funcionarioId: z.coerce.number().int().positive(),
  clienteId: z.coerce.number().int().positive().nullable().optional(),
  tipoAgendaId: z.coerce.number().int().positive(),
  horaInicio: z.coerce.date(),
  horaFim: z.coerce.date(),
});

export type Agenda = z.infer<typeof AgendaSchema>;
