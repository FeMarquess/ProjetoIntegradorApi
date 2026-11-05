import { z } from "zod";

export const ClienteSchema = z.object({
  id: z.number().nullable().optional(),
  descricao: z.string().trim().min(1, "informe o nome"),
  telefone: z.string().nullable().optional(),
  dataNascimento: z.coerce.date().nullable().optional(),
});

export type Cliente = z.infer<typeof ClienteSchema>;
