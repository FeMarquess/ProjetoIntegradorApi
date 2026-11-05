import prismaClient from "../prisma/index.js";
import type { TipoAgenda } from "../type/TipoAgenda.js";
import { codigoPrisma, conflito, lerId, naoEncontrado, requisicaoInvalida } from "../erros.js";

interface id{
    id: string
}

function lerDescricao(TipoAgenda: TipoAgenda){
    const descricao = TipoAgenda?.descricao?.trim()
    if(!descricao) throw requisicaoInvalida("Informe o nome da especialidade")
    return descricao
}

class CriarTipoAgendaService{
    async execute(TipoAgenda: TipoAgenda){
        return prismaClient.tipoAgenda.create({
            data:{
                descricao: lerDescricao(TipoAgenda)
            }
        })
    }
}

class BuscarTipoAgendaService{
    async execute(){
        return prismaClient.tipoAgenda.findMany({ orderBy: { descricao: 'asc' } })
    }
}

class BuscarTipoAgendaIdService{
    async execute({id}: id){
        const tipoAgenda = await prismaClient.tipoAgenda.findUnique({
            where:{
                id: lerId(id)
            }
        })
        if(!tipoAgenda) throw naoEncontrado("Especialidade não encontrada")
        return tipoAgenda
    }
}

class BuscarTipoAgendaNomeService{
    async execute(TipoAgenda: TipoAgenda){
        return prismaClient.tipoAgenda.findMany({
            where:{
                descricao: {
                    contains: TipoAgenda?.descricao ?? '',
                    mode: 'insensitive'
                }
            }
        })
    }
}

class EditarTipoAgendaService{
    async execute(TipoAgenda: TipoAgenda, id: string){
        return prismaClient.tipoAgenda.update({
            where:{
                id: lerId(id)
            },
            data:{
                descricao: lerDescricao(TipoAgenda)
            }
        })
    }
}

class DeletarTipoAgendaIdService{
    async execute({id}: id){
        const idDeletar = lerId(id)
        // a tabela de especialidades apagaria o vínculo em cascata; avisa antes para não sumir em silêncio
        const emUso = await prismaClient.funcionario.findMany({
            where:{
                especialidades: { some: { id: idDeletar } }
            }
        })
        if(emUso.length > 0){
            const nomes = emUso.map((f) => `#${f.id} ${f.descricao}`).join(", ")
            throw conflito(`Especialidade em uso por: ${nomes}. Troque a especialidade dessas profissionais antes de excluir`)
        }

        try {
            return await prismaClient.tipoAgenda.delete({
                where:{
                    id: idDeletar
                }
            })
        } catch (error) {
            if(codigoPrisma(error) === 'P2003'){
                throw conflito("Esta especialidade já foi usada em agendamentos e não pode ser excluída")
            }
            throw error
        }
    }
}

export { CriarTipoAgendaService, BuscarTipoAgendaService, BuscarTipoAgendaIdService, BuscarTipoAgendaNomeService, EditarTipoAgendaService, DeletarTipoAgendaIdService }
