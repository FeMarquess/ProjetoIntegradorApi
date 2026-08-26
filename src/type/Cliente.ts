import { z } from "zod";

const ClienteSchema = z.object({
  id: z.number().nullable(),
  descricao: z.string(),
});

export type Cliente = z.infer<typeof ClienteSchema>;