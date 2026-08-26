import { z } from "zod";

const FuncionarioSchema = z.object({
  id: z.number().nullable(),
  descricao: z.string(),
  funcao: z.number()
});

export type Funcionario = z.infer<typeof FuncionarioSchema>;
