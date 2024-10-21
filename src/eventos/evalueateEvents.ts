import {Request, RequestHandler, Response} from "express";
import dotenv from 'dotenv'; 
import nodemailer from 'nodemailer';


import { conexaoBD } from "../conexaoBD";

dotenv.config();

export namespace evalueateEventsHandler {

    async function aprovarEvento(idEvento: string): Promise<boolean | undefined> {
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            await conn.execute(
                `UPDATE eventos
                SET status = 'aprovado'
                WHERE id = :idEvento AND status = 'aguarda aprovação'`,
                {
                    idEvento: idEvento,
                }
            );

            await conn.commit()
            return true;

        }catch (err) {

            console.error('Erro ao aprovar evento: ', err);
            await conn.rollback();
            return undefined;

        }finally {
            await conn.close();
        }
    }

    async function emailReprovacao(idEvento: string, textoReprovacao: string): Promise<boolean> {
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return false;
        }

        try {
            const IdUserTituloEventoResult = await conn.execute<any[]>(
                `SELECT titulo, id_usuarios_fk
                FROM eventos
                WHERE id = :idEvento`,
                {
                    idEvento: idEvento,
                }
            );

            const rows = IdUserTituloEventoResult.rows as Array<[string, number]>;
            if (!rows || rows.length === 0) {
                console.error('Evento não encontrado.');
                return false;
            }

            const [titulo, idUserEvento] = rows[0];

            const emailUserResult = await conn.execute<any[]>(
                `SELECT email
                FROM usuarios
                WHERE id = :idUserEvento`,
                {
                    idUserEvento: idUserEvento,
                }
            );
            
            console.dir(emailUserResult, { depth: null });
            const linhas = emailUserResult.rows;
            if (!linhas || linhas.length === 0) {
                console.error('Email do usuário não encontrado.');
                return false;
            }

            const emailUser = linhas[0]?.[0];

            const emissor = nodemailer.createTransport({
                host: 'smtp.umbler.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'process.env.EMAIL_AVISO',
                    pass: 'process.env.SENHA_EMAIL',
                }
            });

            const opEmail = {
                from: 'process.env.EMAIL_AVISO',
                to: emailUser,
                subject: `Seu Evento ${titulo} foi Reprovado!`,
                text: textoReprovacao,
            };

            await emissor.sendMail(opEmail);

            return true;
        } catch (err) {
            console.error('Erro ao enviar email: ', err);
            return false;
        } finally {
            await conn.close();
        }
    }



    async function reprovarEvento(idEvento: string, textoReprovacao: string): Promise<boolean | undefined> {
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            await conn.execute(
                `UPDATE eventos
                SET status = 'suspenso'
                WHERE id = :idEvento AND status = 'aguarda aprovação'`,
                {
                    idEvento: idEvento,
                }
            );
            if (await emailReprovacao(idEvento, textoReprovacao)) {
                await conn.commit();
                return true;
            } else {
                console.error('Falha ao enviar o email de reprovação.');
                await conn.rollback();
                return false;
            }
        }catch (err) {

            console.error('Erro ao reprovar evento: ', err);
            await conn.rollback();
            return undefined;

        }finally {
            await conn.close();
        }
    }

    export const evaluateNewEventHandler: RequestHandler = async (req: Request, res: Response) => {
        const pIdEvento = req.get('idEvento');
        const pTextoReprovacao = req.get('textoReprovacao');
        const pOpcao = req.get('opcao');
        const isAdmin = req.session.isAdmin;

        if(isAdmin){
            if(pIdEvento && pTextoReprovacao){
                if(pOpcao === 'aprovar'){
                    const authData = await aprovarEvento(pIdEvento);
                    if (authData !== undefined){
                        res.status(200).send('Evento aprovado com sucesso!');
                    } else {
                        res.status(500).send('Erro ao aprovar evento');
                    }
                }else{
                    const authData = await reprovarEvento(pIdEvento, pTextoReprovacao);
                    if (authData === true){
                        res.status(200).send('Evento reprovado com sucesso!');
                    } else {
                        res.status(500).send('Erro ao reprovar evento');
                    }
                }
            }else {
                res.status(400).send('Faltando parametros')
            }
        }else{
            res.status(400).send('Necessario ser moderador para realizar essa ação!')
        }
    }
}