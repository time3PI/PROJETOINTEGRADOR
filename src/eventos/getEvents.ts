import { Request, RequestHandler, Response } from "express";
import { conexaoBD } from "../conexaoBD";
import { tokenParaId } from "../funcoes";


// Define um namespace para o manipulador de eventos
export namespace getEventsHandler {

    // Função assíncrona que filtra eventos com base no parâmetro 'filtro' fornecido pelo usuário
    async function filtrarEventos(filtro: string, token: string): Promise<any | undefined> {
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
                    `SELECT a.id_evento_fk, COUNT(*) AS quantidade
                    FROM aposta a
                    JOIN evento e ON a.id_evento_fk = e.id_evento
                    WHERE e.status = 'aprovado'
                    GROUP BY a.id_evento_fk
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
                    FROM evento
                    WHERE id_evento IN (${placeholders})
                `, params);
                
                // console.dir(eventosResult.rows, {depth: null});
                return eventosResult.rows;

            } else if (filtro === '2') {
                // Eventos mais proximo de finalizar
                const result = await conn.execute(
                    `SELECT *
                    FROM evento
                    WHERE data_hora_fim_apostas > SYSDATE
                    AND status = 'aprovado'
                    ORDER BY data_hora_fim_apostas ASC
                    FETCH FIRST 3 ROWS ONLY`
                );
                
                // console.dir(result.rows, {depth: null});
                const linhas: any[] | undefined = result.rows;
                return linhas;

            //AQUI COMEÇA OS FILTROS DE EVENTOS

            } else if (filtro === '3') {
                const result = await conn.execute(
                    `SELECT *
                    FROM evento
                    WHERE categoria = 'olimpíada'
                    AND status = 'aprovado'`
                    
                );
                const linhas: any[] | undefined = result.rows;
                return linhas;

            } else if (filtro === '4') {
                const result = await conn.execute(
                    `SELECT *
                    FROM evento
                    WHERE categoria = 'catástrofes'
                    AND status = 'aprovado'`
                    
                );
                const linhas: any[] | undefined = result.rows;
                return linhas;

            } else if (filtro === '5') {
                const result = await conn.execute(
                    `SELECT *
                    FROM evento
                    WHERE categoria = 'eleições'
                    AND status = 'aprovado'`
                    
                );
                const linhas: any[] | undefined = result.rows;
                return linhas;

            }  else if (filtro === '6') {
                // Eventos com status 'aprovado' e cuja data de apostas não foi atingida
                const result = await conn.execute(
                    `SELECT *
                    FROM evento
                    WHERE categoria = 'bolsa de valores'
                    AND status = 'aprovado'`
                    
                );
                const linhas: any[] | undefined = result.rows;
                return linhas;

            }  else if (filtro === '7') {
                // Eventos com status 'aprovado' e cuja data de apostas não foi atingida
                const result = await conn.execute(
                    `SELECT *
                    FROM evento
                    WHERE categoria = 'futebol'
                    AND status = 'aprovado'`
                    
                );
                const linhas: any[] | undefined = result.rows;
                return linhas;

            }  else if (filtro === '8') {
                // Eventos com status 'aprovado' e cuja data de apostas não foi atingida
                const result = await conn.execute(
                    `SELECT *
                    FROM evento
                    WHERE categoria = 'clima'
                    AND status = 'aprovado'`
                    
                );
                const linhas: any[] | undefined = result.rows;
                return linhas;

            } else if (filtro === '9') {
                // Eventos com status 'aprovado' e cuja data de apostas não foi atingida
                const result = await conn.execute(
                    `SELECT *
                    FROM evento
                    WHERE categoria = 'outros'
                    AND status = 'aprovado'`
                    
                );
                const linhas: any[] | undefined = result.rows;
                return linhas;

            } else if (filtro === '10') {

                const idUser = tokenParaId(token, conn);

                const result = await conn.execute<any>(
                    `SELECT *
                    FROM evento
                    WHERE id_usuario_fk = :idUser
                    AND (status = 'aguarda aprovação' OR status = 'aprovado')
                    order by id_evento`,
                    { idUser: { val: idUser } }
                );
                // console.dir(result.rows, {depth: null});
                const linhas: any[] | undefined = result.rows;
                return linhas;

            } else if (filtro === '11') {

                const result = await conn.execute<any>(
                    `SELECT *
                    FROM evento
                    WHERE status = 'aprovado'
                    order by id_evento` 
                );
                // console.dir(result.rows, {depth: null});
                const linhas: any[] | undefined = result.rows;
                return linhas;
                

            } else if (filtro === '12') {

                const result = await conn.execute<any>(
                    `SELECT *
                    FROM evento
                    WHERE status = 'aguarda aprovação'
                    order by data_inicio DESC` 
                );
                // console.dir(result.rows, {depth: null});
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
        const token = req.session.token;
        if (filtro && token) {
            const authData = await filtrarEventos(filtro, token);  // Filtra eventos com base no filtro fornecido
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
