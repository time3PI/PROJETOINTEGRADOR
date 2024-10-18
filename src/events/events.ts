import {Request, RequestHandler, Response} from "express";
import OracleDB, { poolIncrement } from "oracledb"
import session from 'express-session';
import dotenv from 'dotenv'; 

import { conexaoBD } from "../conexaoBD";

dotenv.config();

export namespace EventsHandler {

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


    async function InserirEvento(titulo: string, desc: string, data_inicio:string, data_hora_inicio_apostas:string, data_hora_fim_apostas: string, token:string): Promise<boolean | undefined >{

        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {

            const idUser = await tokenParaId(token);

            await conn.execute(
                `INSERT INTO eventos (id, titulo, descricao, data_inicio, data_hora_inicio_apostas, data_hora_fim_apostas, id_usuarios_fk, status) 
                VALUES (seq_id_eventos.NEXTVAL, :titulo, :descricao, TO_TIMESTAMP(:data_inicio, 'DD/MM/YYYY HH24:MI:SS'), 
                TO_TIMESTAMP(:data_hora_inicio_apostas, 'DD/MM/YYYY HH24:MI:SS'), TO_TIMESTAMP(:data_hora_fim_apostas, 'DD/MM/YYYY HH24:MI:SS'), :idUser, 'aguarda aprovação')`,
                {
                    titulo: titulo,
                    descricao: desc,  
                    data_inicio: data_inicio,
                    data_hora_inicio_apostas: data_hora_inicio_apostas,
                    data_hora_fim_apostas: data_hora_fim_apostas,
                    idUser: idUser
                }
            );
            await conn.commit()
            return true;

        }catch (err) {

            console.error('Erro ao cadastrar evento: ', err);
            await conn.rollback();
            return undefined;

        }finally {
            await conn.close();
        }
    }

    export const addNewEventHandler: RequestHandler = async (req: Request, res: Response) => {

        const pTitulo = req.get('titulo');
        const pDesc = req.get('desc');
        const pDataInicio = req.get('data_inicio');
        const pDataHoraInicioApostas = req.get('data_hora_inicio_apostas');
        const pDataHoraFimApostas = req.get('data_hora_fim_apostas');
        const token = req.session.token

        if(token === undefined || token === null){
            res.status(400).send("Necessario realizar Login para esta ação");
            return
        }

        if(pTitulo && pDesc && pDataInicio && pDataHoraInicioApostas && pDataHoraFimApostas){
            const authData = await InserirEvento(pTitulo, pDesc, pDataInicio, pDataHoraInicioApostas, pDataHoraFimApostas, token);

            if ( authData !== undefined && authData !== false) {

                res.status(200).send(`Novo evento adicionado com sucesso!`);
            
            }else{
                
                res.status(500).send("Falha ao inserir dados no sistema");
            }
        }else{
            
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }

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

    async function reprovarEvento(idEvento: string, textoReprovacao: string): Promise<boolean | undefined> {
        let conn = await conexaoBD();
    
        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }
    
        try {
            const IdUserEventoResult = await conn.execute<any[]>(
                `select id_usuarios_fk
                from eventos
                WHERE id = :idEvento`,
                {
                    idEvento: idEvento,
                }
            );
            
            const IdUserEvento = IdUserEventoResult.rows?.[0]?.[0];
            
            if (!IdUserEvento) {
                throw new Error('Usuário não encontrado para o evento fornecido.');
            }
            
            const emailUserResult = await conn.execute<any[]>(
                `select email
                from usuarios
                WHERE id = :idUserEvento`,
                {
                    idUserEvento: IdUserEvento,
                }
            );

            const emailUser = emailUserResult.rows?.[0]?.[0];
            
            if (!emailUser) {
                throw new Error('Email do usuário não encontrado.');
            }

            await conn.execute(
                `UPDATE eventos
                SET status = 'suspenso'
                WHERE id = :idEvento AND status = 'aguarda aprovação'`,
                {
                    idEvento: idEvento,
                }
            );

            await conn.commit()
            return true;

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
                        res.status(200).send('Tabela aprovada com sucesso!');
                    } else {
                        res.status(500).send('Erro ao aprovar tabela');
                    }
                }else{
                    const authData = await reprovarEvento(pIdEvento, pTextoReprovacao);
                    if (authData !== undefined){
                        res.status(200).send('Tabela reprovada com sucesso!');
                    } else {
                        res.status(500).send('Erro ao aprovar tabela');
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