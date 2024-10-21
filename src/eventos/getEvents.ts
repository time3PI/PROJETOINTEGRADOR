import {Request, RequestHandler, Response} from "express";
import dotenv from 'dotenv'; 
import nodemailer from 'nodemailer';

import { conexaoBD } from "../conexaoBD";

dotenv.config();
export namespace getEventsHandler {

    async function filtrarEventos(filtro: string): Promise<any | undefined> {
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {

            if (filtro === '1') {
                const result = await conn.execute(
                    `SELECT *
                    FROM eventos
                    WHERE status = 'aprovado'`
                );

                const linhas: any[] | undefined = result.rows;

                return linhas;

            }else if(filtro === '2'){
                const result = await conn.execute(
                    `SELECT *
                    FROM eventos
                    WHERE status = 'aguarda aprovação'`
                );

                const linhas: any[] | undefined = result.rows;

                return linhas;
                
        
            }else if(filtro === '3'){
                const result = await conn.execute(
                    `SELECT *
                    FROM eventos
                    WHERE SYSDATE < data_hora_inicio_apostas`
                );

                const linhas: any[] | undefined = result.rows;

                return linhas;

            }else if(filtro === '4'){
                const result = await conn.execute(
                    `SELECT *
                    FROM eventos
                    WHERE SYSDATE > data_hora_inicio_apostas`
                );

                const linhas: any[] | undefined = result.rows;

                return linhas;

            }else if(filtro === '5'){
                const result = await conn.execute(
                    `SELECT *
                    FROM eventos`
                );

                const linhas: any[] | undefined = result.rows;

                return linhas;
                
            } else {
                
                console.error("Filtro inválido.");
                return [];
            }
        } catch (err) {
            console.error('Erro ao buscar eventos: ', err);
            return undefined;
        } finally {
            await conn.close();
        }
    }
    

    export const getEventsHandler: RequestHandler = async (req: Request, res: Response) => {

        const pFiltro = req.get('filtro');
        /*  1 - evento Ativo
            2- Evento Não aceitos
            3-Evento futuro
            4-Evento passado
            5-todos Eventos
        */
        if(pFiltro){
            const authData = await filtrarEventos(pFiltro);
            if (authData !== undefined){
                res.status(200).send({authData});
            } else {
                res.status(400).send('Erro ao Filtrar Eventos');
            }
        }else {
            res.status(400).send('Faltando parametros')
        }
    }
}