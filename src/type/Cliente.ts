import { z } from "zod";

const ClienteSchema = z.object({
  id: z.number().nullable(),
  descricao: z.string(),
  telefone: z.string().nullable().optional(),
  dataNascimento: z.coerce.date().nullable().optional(),
});

export type Cliente = z.infer<typeof ClienteSchema>;