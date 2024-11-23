import { Request, RequestHandler, Response } from "express";
import { conexaoBD } from "../conexaoBD";

// Define um namespace para o manipulador de eventos
export namespace getEventsHandler {

    // Função assíncrona que filtra eventos com base no parâmetro 'filtro' fornecido pelo usuário
    async function filtrarEventos(filtro: string): Promise<any | undefined> {
        let conn = await conexaoBD();  // Estabelece conexão com o banco de dados

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            // Executa uma consulta SQL diferente com base no valor de 'filtro'
            if (filtro === '1') {
                // Eventos com mias populares com status 'aprovado'
                const topEventosResult  = await conn.execute(
                    `SELECT a.id_eventos_fk, COUNT(*) AS quantidade
                    FROM apostas a
                    JOIN eventos e ON a.id_eventos_fk = e.id
                    WHERE e.status = 'aprovado'
                    GROUP BY a.id_eventos_fk
                    ORDER BY quantidade DESC
                    FETCH FIRST 3 ROWS ONLY`
                );
                
                const topEventosIds = topEventosResult.rows?.map((row) => (row as [number, number])[0]);
                
                if (!topEventosIds || topEventosIds.length === 0) {
                    throw new Error("Nenhum evento encontrado nas apostas.");
                }

                const placeholders = topEventosIds.map((_, idx) => `:id${idx}`).join(", ");

                const params: { [key: string]: number } = topEventosIds.reduce((acc, id, idx) => {
                    acc[`id${idx}`] = id; 
                    return acc;
                }, {} as { [key: string]: number }); 

                const eventosResult   = await conn.execute(`
                    SELECT *
                    FROM eventos
                    WHERE id IN (${placeholders})
                `, params);
                
                // console.dir(eventosResult.rows, {depth: null});
                return eventosResult.rows;

            } else if (filtro === '2') {
                // Eventos mais proximo de finalizar
                const result = await conn.execute(
                    `SELECT *
                    FROM eventos
                    WHERE data_hora_fim_apostas > SYSDATE
                    AND status = 'aprovado'
                    ORDER BY data_hora_fim_apostas ASC
                    FETCH FIRST 3 ROWS ONLY`
                );
                
                // console.dir(result.rows, {depth: null});
                const linhas: any[] | undefined = result.rows;
                return linhas;

            } else if (filtro === '3') {
                // Eventos com status 'aprovado' e cuja data de apostas não foi atingida
                const result = await conn.execute(
                    `SELECT *
                    FROM eventos
                    WHERE SYSDATE < data_hora_inicio_apostas
                    AND status = 'aprovado'`
                    
                );
                const linhas: any[] | undefined = result.rows;
                return linhas;

            } else if (filtro === '4') {
                // Eventos com status 'finalizado'
                const result = await conn.execute(
                    `SELECT *
                    FROM eventos
                    WHERE status = 'finalizado'`
                );
                const linhas: any[] | undefined = result.rows;
                return linhas;

            } else if (filtro === '5') {
                // Todos os eventos, independentemente do status
                const result = await conn.execute(
                    `SELECT *
                    FROM eventos`
                );
                const linhas: any[] | undefined = result.rows;
                return linhas;

            } else {
                // Caso o filtro seja inválido
                console.error("Filtro inválido.");
                return [];
            }
        } catch (err) {
            // Captura e exibe um erro caso a consulta falhe
            console.error('Erro ao buscar eventos: ', err);
            return undefined;
        } finally {
            await conn.close();  // Fecha a conexão com o banco de dados
        }
    }

    // Função que trata a requisição para obter eventos com base no filtro fornecido
    export const getEventsHandler: RequestHandler = async (req: Request, res: Response) => {
        const { pFiltro }  = req.query;  // Obtém o filtro da requisição

        const filtro = pFiltro as string;


        /*  Opções de filtro:
            1 - evento populares
            2 - Evento proximos do vencimento
            3 - Evento futuro
            4 - Evento finalizado
            5 - todos Eventos
        */

        if (filtro) {
            const authData = await filtrarEventos(filtro);  // Filtra eventos com base no filtro fornecido
            if (authData !== undefined) {
                res.status(200).send({ authData });  // Retorna os eventos filtrados em formato JSON
            } else {
                res.status(400).send('Erro ao Filtrar Eventos');  // Retorna erro 400 caso ocorra algum problema
            }
        } else {
            res.status(400).send('Faltando parâmetros');  // Retorna erro 400 caso o filtro não tenha sido fornecido
        }
    }
}
