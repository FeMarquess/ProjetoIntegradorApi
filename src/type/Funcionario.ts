import { z } from "zod";

// A profissional atende uma ou mais especialidades (ids de tipoAgenda).
// "funcao" (uma especialidade só) ainda é aceito para não quebrar clientes antigos da API.
export const FuncionarioSchema = z.object({
  id: z.number().nullable().optional(),
  descricao: z.string().trim().min(1, "informe o nome"),
  especialidades: z.array(z.coerce.number().int().positive()).optional(),
  funcao: z.coerce.number().int().positive().optional(),
}).transform(({ funcao, especialidades, ...resto }) => ({
  ...resto,
  especialidades: [...new Set(especialidades ?? (funcao ? [funcao] : []))],
})).refine((f) => f.especialidades.length > 0, {
  message: "escolha ao menos uma especialidade",
  path: ["especialidades"],
});

export type Funcionario = z.infer<typeof FuncionarioSchema>;
