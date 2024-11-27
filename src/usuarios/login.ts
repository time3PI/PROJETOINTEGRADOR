import {Request, RequestHandler, Response} from "express";
import { conexaoBD } from "../conexaoBD";

// Define um namespace chamado LoginHandler
export namespace LoginHandler {

    // Define um tipo contaUsuario para representar a conta do usuário
    export type contaUsuario = {
        token : string | undefined;     // O token de autenticação do usuário
        isAdmin : boolean | undefined;  // Indica se o usuário é administrador
    };

    // Função assíncrona para verificar as credenciais de login do usuário no banco de dados
    async function VerificaLogin(email:string, senha:string): Promise< contaUsuario[] | undefined >{

        // Faz a conexão com o banco de dados
        let conn = await conexaoBD();

        // Verifica se a conexão foi estabelecida corretamente
        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;  // Retorna indefinido se a conexão falhar
        }

        try {
            // Executa a consulta SQL para verificar o email e senha do usuário
            const result = await conn.execute(
                `SELECT token, isAdmin
                FROM usuario
                where email = :email and senha = :senha`,
                [email, senha]
            );

            // console.dir(result, {depth: null});

            // Converte o resultado em uma lista de arrays contendo token e isAdmin
            const rows = result.rows as Array<[string, number]>; 

            // Se houver resultados, cria e retorna um objeto contaUsuario
            if (rows && rows.length > 0) {
                let tokenIsAdmin = rows[0];
                return [{
                    token: tokenIsAdmin[0],            // Token do usuário
                    isAdmin: tokenIsAdmin[1] === 1     // Converte 1 para true (usuário admin)
                }];
            } else {
                return undefined;  // Retorna indefinido se o usuário não for encontrado
            }

        } catch (err) {
            // Lida com erros de execução da consulta SQL
            console.error('Erro ao executar login:', err);
            return undefined;

        } finally {
            // Fecha a conexão com o banco de dados
            await conn.close();
        }
    }
    
    // Função de login que trata a requisição HTTP do usuário
    export const loginHandler: RequestHandler = async (req:Request, res:Response) =>{

        const { email, senha } = req.body;

        // Verifica se ambos os parâmetros estão presentes
        if(email && senha){
            let dados : contaUsuario[] | undefined = [];
            dados = await VerificaLogin(email, senha);

            // Se os dados do usuário são válidos, armazena na sessão e envia resposta de sucesso
            if (dados !== undefined && dados !== null)  {
                req.session.token = dados[0].token;        // Armazena o token na sessão
                req.session.isAdmin = dados[0].isAdmin;    // Armazena o status de admin na sessão
                res.status(200).send("Login realizado com sucesso!");
            } else {
                res.status(400).send('Email ou Senha incorretos!');  // Envia resposta de erro para credenciais inválidas
            }
            
        } else {
            res.status(400).send('Faltando parametros');  // Envia erro se parâmetros estiverem faltando
        }
    }
}
