import {Request, RequestHandler, Response} from "express";
import dotenv from 'dotenv'; 

import { conexaoBD } from "../conexaoBD";

dotenv.config();

export namespace SignUpHandler {
    
    async function criarCarteira(email: string): Promise<boolean | undefined >{

        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            const selectIdUser = await conn.execute<any[]>(
                `SELECT id
                FROM usuarios
                where email = :email`,
                {email}
            )
            
            const id = selectIdUser.rows?.[0]?.[0]; 
            
            console.dir(selectIdUser.rows, {depth: null});


            if (!id) {
                console.error('Este email não possui um usuário vinculado!');
                return false;
            }

            await conn.execute(
                `INSERT INTO carteira (id, valor_total, id_usuarios_fk) 
                VALUES (seq_id_carteira.NEXTVAL, :valor_total, :id)`,
                {
                    valor_total: 0,
                    id: id
                }
            );
            await conn.commit(); 
            return true;
        } catch (err) {

            console.error('Erro ao cadastrar carteira: ', err);
            await conn.rollback();
            return undefined;

        }finally {
            
            await conn.close();
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
                    `INSERT INTO usuarios (id, email, senha, nome, data_nasc, isAdmin, token) 
                    VALUES (seq_id_user.NEXTVAL, :email, :senha, :nome, TO_DATE(:dataNascimento, 'DD/MM/YYYY'), 0, dbms_random.string('x',10))`,
                    {
                        email: email,
                        senha: senha,
                        nome: nome,
                        dataNascimento: dataNasc
                    }
                );

                await conn.commit();

                if(await criarCarteira(email)){
                    return true;
                }
            }

        } catch (err) {

            console.error('Erro ao cadastrar usuario: ', err);
            await conn.rollback();
            return undefined;

        }finally {
            await conn.close();
        }
    }

    export const signUpHandler: RequestHandler = async (req: Request, res: Response) => {
        
        const pNome = req.get('nome');
        const pEmail = req.get('email');
        const pSenha = req.get('senha');
        const pDataNasc = req.get('dataNasc');

        if(pNome && pEmail && pSenha && pDataNasc){
            const authData = await InserirUser(pNome, pEmail, pSenha, pDataNasc);

            if ( authData !== undefined && authData !== false) {

                res.status(200).send(`Nova conta adicionada com sucesso!`);
            
            }else{
                
                res.status(500).send("Falha ao inserir dados no sistema");
            }
        }else{
            
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}