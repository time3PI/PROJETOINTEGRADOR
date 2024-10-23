import {Request, RequestHandler, Response} from "express";

import { conexaoBD } from "../conexaoBD";

export namespace LoginHandler {
    
    export type UserAccount = {
        token : string|undefined;
        isAdmin : boolean | undefined;   
    };

    async function VerificaLogin(email:string, senha:string): Promise< UserAccount[] | undefined >{
        //passo a passo
        //conectar nobanco
        //fazer select pra verifiar a conta
        //se existe preencher o objeto da conta
        //se nao devolver undefined

        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            const result = await conn.execute(
                `SELECT token, isAdmin
                FROM usuarios
                where email = :email and senha = :senha`,
                [email, senha]
            )
            
            console.dir(result, {depth: null});

            const rows = result.rows as Array<[string, number]>; 

            if (rows && rows.length > 0) {
                let tokenIsAdmin = rows[0];
                return [{
                    token: tokenIsAdmin[0], 
                    isAdmin: tokenIsAdmin[1] === 1
                }];
            } else {
                return undefined;
            }

        } catch (err) {

            console.error('Erro ao executar login:', err);
            await conn.rollback();
            return undefined;

        } finally {
            await conn.close();
        }

    }
    
    export const loginHandler: RequestHandler = async (req:Request, res:Response) =>{
        const pEmail = req.get('email');
        const pSenha = req.get('senha');
        if(pEmail && pSenha){
            let authData : UserAccount[] | undefined = []
            authData = await VerificaLogin(pEmail, pSenha);

            if (authData !== undefined && authData !== null)  {
                req.session.token = authData[0].token
                req.session.isAdmin = authData[0].isAdmin
                res.status(200).send("Login realizado com sucesso!");
            } else {
                res.status(400).send('Credenciais inválidas');
            }
            
        }else {
            res.status(400).send('Faltando parametros')
        }
    }

}