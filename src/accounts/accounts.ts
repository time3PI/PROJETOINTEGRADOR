import { pseudoRandomBytes } from "crypto";
import {Request, RequestHandler, Response} from "express";
import OracleDB, { poolIncrement } from "oracledb"
import { ppid } from "process";
import { PassThrough } from "stream";

/*
    Nampespace que contém tudo sobre "contas de usuários"
*/
async function conexaoBD(){
    try {
        let conn = await OracleDB.getConnection({
            user: "BD130824216",
            password: "Wqczx3",
            connectString: "172.16.12.14/xe"
        });
        return conn;
    } catch (err) {
        console.error('Erro ao conectar:', err);
        return undefined;
    }
}

export namespace AccountsHandler {
    
    /**
     * Tipo UserAccount
     */
    export type UserAccount = {
        id:number|undefined;
        name:string;
        email:string;
        senha:string;
        dataNasc:string;
        
    };
    //estudar dot env

    async function VerificaLogin(email:string, senha:string): Promise<boolean | undefined >{
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
                `SELECT *
                FROM usuarios
                where email = :email and senha = :senha`,
                [email, senha]
            )
            
            const linhas = result.rows;
            
            console.dir(linhas, {depth: null});

            if (linhas && linhas.length > 0) {

                return true;
            } else {

                return undefined; 
            }

        } catch (err) {

            console.error('Erro ao executar login:', err);
            return undefined;

        } finally {
            await conn.close();
        }

    }

    export const loginHandler: RequestHandler = async (req:Request, res:Response) =>{
        const pEmail = req.get('email');
        const pSenha = req.get('senha');
        if(pEmail && pSenha){
            const authData = await VerificaLogin(pEmail, pSenha);

            if (authData !== undefined) {
                res.status(200).send("Login realizado com sucesso!");
            } else {
                res.status(400).send('Credenciais inválidas');
            }
            
        }else {
            res.status(400).send('Faltando parametros')
        }
    }

    async function InserirUser(nome: string, email:string, senha:string, dataNasc: string): Promise<boolean | undefined >{

        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            const result = await conn.execute(
                `SELECT *
                FROM usuarios
                where email = :email`,
                [email]
            )
            
            const linhas = result.rows;
            
            console.dir(result.rows, {depth: null});

            if (linhas && linhas.length > 0) {
                console.error('Este email ja possui um usuario vinculado!');
                return false; 
            } else {
                await conn.execute(
                    `INSERT INTO usuarios (id, email, senha, nome, data_nasc) 
                    VALUES (SEQUSERID.NEXTVAL, :email, :senha, :nome, TO_DATE(:dataNascimento, 'DD/MM/YYYY'))`,
                    {
                        email: email,
                        senha: senha,
                        nome: nome,
                        dataNascimento: dataNasc
                    }
                );
                await conn.commit()
                return true;
            }

        } catch (err) {

            console.error('Erro ao cadastrar usuario: ', err);
            return undefined;

        }finally {
            await conn.close();
        }
    }

    export const signUpHandler: RequestHandler = async (req: Request, res: Response) => {
        // Passo 1 - Receber os parametros para criar a conta
        const pNome = req.get('nome');
        const pEmail = req.get('email');
        const pSenha = req.get('senha');
        const pDataNasc = req.get('dataNasc');
        
        

        if(pNome && pEmail && pSenha && pDataNasc ){
            const authData = await InserirUser(pNome, pEmail, pSenha, pDataNasc);

            if ( authData !== undefined || false){

                res.status(200).send(`Nova conta adicionada com sucesso!`);
            
            }else{
                
                res.status(400).send("Falha ao inserir dados no sistema");
            }
        }else{
            
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}