import {Request, RequestHandler, Response} from "express";
import dotenv from 'dotenv'; 
import nodemailer from 'nodemailer';

import { conexaoBD } from "../conexaoBD";

dotenv.config();
export namespace deleteEventsHandler {

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


    async function deletarEvento(token: string, idEvento: string): Promise<boolean | undefined> {
        let conn = await conexaoBD();
    
        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }
    
        try {
            const idUser = await tokenParaId(token);

            await conn.execute(
                `UPDATE eventos
                SET status = 'suspenso'
                WHERE id = :idEvento AND id_usuarios_fk = :idUser AND status = 'aguarda aprovação'`,
                {
                    idEvento: idEvento,
                    idUser: idUser,
                }
            );

            await conn.commit()
            return true;

        }catch (err) {

            console.error('Erro ao deletar evento: ', err);
            await conn.rollback();
            return undefined;

        }finally {
            await conn.close();
        }
    }

    export const deleteEventHandler: RequestHandler = async (req: Request, res: Response) => {
        const pIdEvento = req.get('idEvento');
        const token = req.session.token;

        if(token === undefined || token === null){
            res.status(400).send("Necessario realizar Login para esta ação");
            return
        }

        if(pIdEvento){
            const authData = await deletarEvento(token, pIdEvento);
            if (authData !== undefined){
                res.status(200).send('Tabela deletada com sucesso!');
            } else {
                res.status(500).send('Erro ao deletar tabela');
            }
        }else {
            res.status(400).send('Faltando parametros')
        }
    }
    
}