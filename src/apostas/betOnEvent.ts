import {Request, RequestHandler, Response} from "express";
import OracleDB, { Connection, poolIncrement } from "oracledb"
import dotenv from 'dotenv'; 


import { conexaoBD } from "../conexaoBD";
import { eventNames } from "process";

dotenv.config();

export namespace betOnEventHandler {

    async function tokenParaId(token: string):  Promise<number | undefined >{
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            const result = await conn.execute(
                `SELECT id from usuarios
                where token = :token`,
                {
                    token: { val: token },
                }
            );

            const rows = result.rows as Array<[number]>; 

            if (!rows || rows.length === 0) {
                throw new Error('Usuário não encontrado para o token fornecido');
            }

            const idUser = rows[0][0]

            return idUser;
        } catch (err) {
            console.error('Erro ao buscar id por token: ', err);
            return undefined;
        } finally {
            await conn.close();
        }
    }

    async function retiraValorCarteira(idCarteira: number, quant_cotas: number): Promise<boolean | undefined >{
       
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {

            const result = await conn.execute<any[]>(
                `SELECT valor_total
                FROM carteira
                WHERE id = :idCarteira`,
                {
                    idCarteira: idCarteira,
                }
            );

            const rows = result.rows?.[0]?.[0];

            if (rows < quant_cotas) {
                console.log("Você nao possui saldo para apostar.");
                return false;
            }

            await conn.execute(
                `UPDATE carteira
                SET valor_total = valor_total - :quant_cotas
                WHERE id = :idCarteira`,
                {
                    quant_cotas: quant_cotas,
                    idCarteira: idCarteira,
                }
            );

            await conn.commit()
            return true
        }catch (err) {

            console.error('Erro ao remover fundos: ', err);
            await conn.rollback();
            return undefined;

        }finally {
            await conn.close();
        }
    }

    async function realizarAposta(token: string, pQuantCotas: string, pIdEvento: string, pPalpite: string): Promise<boolean | undefined >{
       
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {

            const quantCotas = Number(pQuantCotas);
            const idEvento = Number(pIdEvento);
            const palpite = Number(pPalpite);

            const idUser = await tokenParaId(token);

            const pStatusEvento = await conn.execute<any[]>(
                `SELECT status
                FROM eventos
                WHERE id = :idEvento`,
                {idEvento: idEvento}
            );
            
            const statusEvento = pStatusEvento.rows?.[0]?.[0];

            if (statusEvento !== 'aprovado') {
                console.error("Evento não aprovado!");
                return false;
            }

            await conn.execute(
                `INSERT INTO apostas (id, id_usuarios_fk, id_eventos_fk, quant_cotas, palpite) 
                VALUES (seq_id_apostas.NEXTVAL, :idUser, :idEvento, :quantCotas, :palpite)`,
                {
                    quantCotas: quantCotas,
                    idUser: idUser,
                    idEvento: idEvento,
                    palpite:palpite
                }
            );

            const arrayId = await conn.execute<any[]>(
                `SELECT id
                FROM carteira
                WHERE id_usuarios_fk = :idUser`,
                {idUser: idUser}
            )
            
            
            const idCarteira = arrayId.rows?.[0]?.[0];
            
            console.dir(arrayId.rows, {depth: null});

            if(await retiraValorCarteira(idCarteira, quantCotas)){
                await conn.commit()
                return true;
            }else {
                console.error('Carteira não encontrada ou falha ao registrar a transação.');
                return false; 
            }

        }catch (err) {

            console.error('Erro ao realizar aposta: ', err);
            await conn.rollback();
            return undefined;

        }finally {
            await conn.close();
        }
    }

    export const betOnEventHandler: RequestHandler = async (req: Request, res: Response) => {

        const pQuantCotas = req.get('quantCotas');
        const pIdEvento = req.get('idEvento');
        const pPalpite = req.get('palpite');
        const token = req.session.token

        if(!token){
            res.status(400).send("Necessario realizar Login para esta ação");
            return
        }

        if(pQuantCotas && pIdEvento && pPalpite){
            const authData = await realizarAposta(token, pQuantCotas, pIdEvento, pPalpite);

            if (authData !== undefined || authData !== false) {

                res.status(200).send(`Aposta realizada com sucesso!`);
            
            }else{
                
                res.status(500).send("Falha ao inserir dados no sistema");
            }
        }else{
            
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}