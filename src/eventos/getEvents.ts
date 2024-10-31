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
                // Eventos com status 'aprovado'
                const result = await conn.execute(
                    `SELECT *
                    FROM eventos
                    WHERE status = 'aprovado'`
                );
                const linhas: any[] | undefined = result.rows;
                return linhas;

            } else if (filtro === '2') {
                // Eventos com status 'aguarda aprovação'
                const result = await conn.execute(
                    `SELECT *
                    FROM eventos
                    WHERE status = 'aguarda aprovação'`
                );
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
        const pFiltro = req.get('filtro');  // Obtém o filtro da requisição

        /*  Opções de filtro:
            1 - evento Aprovado
            2 - Evento suspenso
            3 - Evento futuro
            4 - Evento finalizado
            5 - todos Eventos
        */

        if (pFiltro) {
            const authData = await filtrarEventos(pFiltro);  // Filtra eventos com base no filtro fornecido
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
