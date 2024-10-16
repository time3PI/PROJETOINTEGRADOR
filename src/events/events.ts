import {Request, RequestHandler, Response} from "express";
import OracleDB, { poolIncrement } from "oracledb"
import dotenv from 'dotenv'; 
dotenv.config();

async function conexaoBD(){
    try {
        let conn = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });
        return conn;
    } catch (err) {
        console.error('Erro ao conectar:', err);
        return undefined;
    }
}

export namespace EventsHandler {

    export type Eventos = {
        id:any;
        titulo:any;
        descricao:any;
        data_inicio:any;
        data_hora_inicio_apostas:any;
        data_hora_fim_apostas:any;
        valor_apostas_totais:any;
        isActive:any;
        isApproved: any;
        id_usuarios_fk: any;
    };
    
    let eventosFiltrados: Eventos[] = [];

    async function InserirEvento(titulo: string, desc: string, data_inicio:string, data_hora_inicio_apostas:string, data_hora_fim_apostas: string): Promise<boolean | undefined >{

        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            await conn.execute(
                `INSERT INTO eventos (id, titulo, descricao, data_inicio, data_hora_inicio_apostas, data_hora_fim_apostas, valor_apostas_totais, isActive, isApproved, id_usuarios_fk) 
                VALUES (seq_id_eventos.NEXTVAL, :titulo, :descricao, TO_TIMESTAMP(:data_inicio, 'DD/MM/YYYY HH24:MI:SS'), 
                TO_TIMESTAMP(:data_hora_inicio_apostas, 'DD/MM/YYYY HH24:MI:SS'), TO_TIMESTAMP(:data_hora_fim_apostas, 'DD/MM/YYYY HH24:MI:SS'), 0, null, 0, null)`,
                {
                    titulo: titulo,
                    descricao: desc,  
                    data_inicio: data_inicio,
                    data_hora_inicio_apostas: data_hora_inicio_apostas,
                    data_hora_fim_apostas: data_hora_fim_apostas
                }
            );

            await conn.commit()
            return true;

        }catch (err) {

            console.error('Erro ao cadastrar evento: ', err);
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
        
        if(pTitulo && pDesc && pDataInicio && pDataHoraInicioApostas && pDataHoraFimApostas){
            const authData = await InserirEvento(pTitulo, pDesc, pDataInicio, pDataHoraInicioApostas, pDataHoraFimApostas);

            if ( authData !== undefined && authData !== false) {

                res.status(200).send(`Novo evento adicionado com sucesso!`);
            
            }else{
                
                res.status(500).send("Falha ao inserir dados no sistema");
            }
        }else{
            
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }

    //FUNÇÕES DE FILTRAGEM E /GETEVENTS
    function salvaViewEvent(linhas: any[] | undefined): Eventos[] | undefined {

        if (linhas && linhas.length > 0) {
            linhas.forEach(linha => {
                const viewEvent: Eventos = {
                    id: linha[0],
                    titulo: linha[1],
                    descricao: linha[2],
                    data_inicio: linha[3],
                    data_hora_inicio_apostas: linha[4],
                    data_hora_fim_apostas: linha[5],
                    valor_apostas_totais: linha[6],
                    isActive: linha[7],
                    isApproved: linha[8],
                    id_usuarios_fk: linha[9]
                };
                eventosFiltrados.push(viewEvent);
            });

            return eventosFiltrados;

        }else {

            return [];
        }
    }

    async function filtrarEventos(filtro: string): Promise<Eventos[] | undefined> {
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
                WHERE isActive = 1`
            );

            const linhas: any[] | undefined = result.rows;

            return await salvaViewEvent(linhas);

        }else if(filtro === '2'){
            const result = await conn.execute(
                `SELECT *
                FROM eventos
                WHERE isActive = 0`
            );

            const linhas: any[] | undefined = result.rows;

            return await salvaViewEvent(linhas);
            
    
        }else if(filtro === '3'){
            const result = await conn.execute(
                `SELECT *
                FROM eventos
                WHERE SYSDATE < data_hora_inicio_apostas`
            );

            const linhas: any[] | undefined = result.rows;

            return await salvaViewEvent(linhas);

        }else if(filtro === '4'){
            const result = await conn.execute(
                `SELECT *
                FROM eventos
                WHERE SYSDATE > data_hora_inicio_apostas`
            );

            const linhas: any[] | undefined = result.rows;

            return await salvaViewEvent(linhas);

        }else if(filtro === '5'){
            const result = await conn.execute(
                `SELECT *
                FROM eventos`
            );

            const linhas: any[] | undefined = result.rows;

            return await salvaViewEvent(linhas);
            
        } else {
            
            console.error("Filtro inválido.");
            return [];
        }
    } catch (err) {
        console.error('Erro ao buscar eventos: ', err);
        return undefined;
    } finally {
        eventosFiltrados = []; 
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
                res.status(200).send(`Eventos Filtrados: \n ${authData}`);
            } else {
                res.status(400).send('Erro ao Filtrar Eventos');
            }
        }else {
            res.status(400).send('Faltando parametros')
        }
    }
    
}


