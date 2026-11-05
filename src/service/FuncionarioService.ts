import prismaClient from "../prisma/index.js";
import { FuncionarioSchema } from "../type/Funcionario.js";
import { codigoPrisma, conflito, lerId, naoEncontrado, requisicaoInvalida } from "../erros.js";

interface id {
    id: string
}

// sempre devolve a profissional com a lista de especialidades que ela atende
const incluirEspecialidades = {
    especialidades: { orderBy: { descricao: 'asc' as const } }
}

async function validarEspecialidades(ids: number[]){
    const existentes = await prismaClient.tipoAgenda.count({ where: { id: { in: ids } } })
    if(existentes !== ids.length) throw requisicaoInvalida("Especialidade não encontrada")
}

class CriarFuncionarioService{
    async execute(corpo: unknown){
        const funcionario = FuncionarioSchema.parse(corpo)
        await validarEspecialidades(funcionario.especialidades)

        return prismaClient.funcionario.create({
            data:{
                descricao: funcionario.descricao,
                especialidades: { connect: funcionario.especialidades.map((id) => ({ id })) }
            },
            include: incluirEspecialidades
        })
    }
}

class BuscarFuncionarioService{
    async execute(){
        return prismaClient.funcionario.findMany({
            include: incluirEspecialidades,
            orderBy: { descricao: 'asc' }
        })
    }
}

class BuscarFuncionarioIdService{
    async execute({id}: id){
        const funcionario = await prismaClient.funcionario.findUnique({
            where:{
                id: lerId(id)
            },
            include: incluirEspecialidades
        })
        if(!funcionario) throw naoEncontrado("Profissional não encontrada")
        return funcionario
    }
}

class BuscarFuncionarioNomeService{
    async execute({descricao}: {descricao?: string}){
        return prismaClient.funcionario.findMany({
            where:{
                descricao: {
                    contains: descricao ?? '',
                    mode: 'insensitive'
                }
            },
            include: incluirEspecialidades,
            orderBy: { descricao: 'asc' }
        })
    }
}

// Busca para o agendamento: uma linha por par (profissional, especialidade).
// Se o termo for o nome de um serviço (ex.: "manicure"), traz só esse serviço de cada profissional;
// se for o nome da profissional, traz todos os serviços que ela atende.
class BuscarFuncionarioEspecialidadeService{
    async execute({descricao}: {descricao?: string}){
        const termo = (descricao ?? '').trim().toLowerCase()
        const funcionarios = await prismaClient.funcionario.findMany({
            include: incluirEspecialidades,
            orderBy: { descricao: 'asc' }
        })

        return funcionarios.flatMap((f) => {
            const nomeBate = f.descricao.toLowerCase().includes(termo)
            return f.especialidades
                .filter((e) => nomeBate || e.descricao.toLowerCase().includes(termo))
                .map((e) => ({
                    ...f,
                    tipoAgendaId: e.id,
                    especialidade: e.descricao
                }))
        })
    }
}

class EditarFuncionarioService{
    async execute(corpo: unknown, id: string){
        const idAlterar = lerId(id)
        const funcionario = FuncionarioSchema.parse(corpo)
        await validarEspecialidades(funcionario.especialidades)

        return prismaClient.funcionario.update({
            where:{
                id: idAlterar
            },
            data:{
                descricao: funcionario.descricao,
                // troca a lista inteira pela enviada
                especialidades: { set: funcionario.especialidades.map((id) => ({ id })) }
            },
            include: incluirEspecialidades
        })
    }
}

class DeletarFuncionarioIdService{
    async execute({id}: id){
        try {
            return await prismaClient.funcionario.delete({
                where:{
                    id: lerId(id)
                }
            })
        } catch (error) {
            if(codigoPrisma(error) === 'P2003'){
                throw conflito("A profissional tem agendamentos. Exclua ou transfira os agendamentos antes de excluir")
            }
            throw error
        }
    }
}

export { CriarFuncionarioService, BuscarFuncionarioService, BuscarFuncionarioIdService, BuscarFuncionarioNomeService, BuscarFuncionarioEspecialidadeService, EditarFuncionarioService, DeletarFuncionarioIdService }
