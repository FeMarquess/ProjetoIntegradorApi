import prismaClient from "../prisma/index.js";
import type { Funcionario } from "../type/Funcionario.js";

interface id {
    id: string
}

class CriarFuncionarioService{
    async execute(Funcionario: Funcionario){

        const funcionario = await prismaClient.funcionario.create({
            data:{
                descricao: Funcionario.descricao,
                funcao: Funcionario.funcao
            }
        })

        return funcionario
    }
}

class BuscarFuncionarioService{
    async execute(){
        try{
        const funcionario = await prismaClient.funcionario.findMany()

        return funcionario
    }catch(error){
        return ("Não foi possível retornar agenda nessa busca")
    }
}
}

class BuscarFuncionarioIdService{
    async execute({id}: id){

        console.log("service")
        if(id)
        {
            console.log(id)
            const funcionarioBusca = await prismaClient.funcionario.findFirst({
                where:{
                    id: Number(id)
                }
            })

            return funcionarioBusca
        } else{
            return("Não existe retorno para essa pesquisa")
        }
    }
}

class BuscarFuncionarioNomeService{
    async execute(Funcionario: Funcionario){

        if(Funcionario.descricao){
            console.log(Funcionario.descricao)
            const funcionario = await prismaClient.funcionario.findMany({
                where:{
                    descricao: {
                        contains: Funcionario.descricao,
                        mode: 'insensitive'
                    }
                }
            })

            return funcionario
        }else{
            return("Não existe retorno para essa pesquisa")
        }        
    }
}

class EditarFuncionarioService{
    async execute(Funcionario: Funcionario, id: string){

        if(id){
            const idAlterar = Number(id)
            const funcionario = await prismaClient.funcionario.update({
                where:{
                    id: idAlterar
                },
                data:{
                    descricao: Funcionario.descricao
                }
            })

            return Funcionario
        }else{
            return("Não existe retorno para essa pesquisa")
        }        
    }
}

class DeletarFuncionarioIdService{
    async execute({id}: id){
        try {
            console.log(Number(id))
            const Funcionario = await prismaClient.funcionario.delete({
            where:{
                id: Number(id)
            }
        })

        return Funcionario
        } catch (error) {
            return ("Não foi possível deletar esse funcionario")
        }     
    }
}

export { CriarFuncionarioService, BuscarFuncionarioService, BuscarFuncionarioIdService, BuscarFuncionarioNomeService, EditarFuncionarioService, DeletarFuncionarioIdService }