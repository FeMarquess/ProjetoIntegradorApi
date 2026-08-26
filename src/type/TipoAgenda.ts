import { z } from "zod";

const TipoAgendaSchema = z.object({
  id: z.number().nullable(),
  descricao: z.string(),
});

export type TipoAgenda = z.infer<typeof TipoAgendaSchema>;