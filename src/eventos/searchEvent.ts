import {Request, RequestHandler, Response} from "express";
import { conexaoBD } from "../conexaoBD";

// Define um namespace `searchEventHandler` para encapsular funções de pesquisa de eventos.
export namespace searchEventHandler {

    // Função assíncrona que realiza a pesquisa de um evento baseado em uma palavra-chave fornecida.
    async function pesquisarEvento(pesquisa: string): Promise<any | undefined> {
       
        // Estabelece a conexão com o banco de dados.
        let conn = await conexaoBD();

        // Caso a conexão falhe, exibe um erro e retorna `undefined`.
        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            // Define a palavra-chave para a busca, adicionando '%' para pesquisa com caracteres curinga.
            const palavraChave = '%' + pesquisa + '%';
            
            // Executa a consulta SQL que busca eventos cujo status é "aprovado" e onde o título ou a descrição contêm a palavra-chave.
            const result = await conn.execute(
                `SELECT *
                FROM eventos
                WHERE status = 'aprovado'
                AND (LOWER(titulo) LIKE LOWER(:palavraChave)
                OR LOWER(descricao) LIKE LOWER(:palavraChave))`,
                {
                    palavraChave: palavraChave
                }
            );

            // Extrai as linhas de resultados da pesquisa.
            const linhas: any[] | undefined = result.rows;

            return linhas;

        } catch (err) {
            // Em caso de erro durante a execução da consulta, exibe o erro e retorna `undefined`.
            console.error('Erro ao realizar pesquisa: ', err);
            return undefined;

        } finally {
            // Fecha a conexão com o banco de dados, seja qual for o resultado da execução.
            await conn.close();
        }
    }

    // Define o `RequestHandler` para a rota de pesquisa de eventos, que será exportado.
    export const searchEventHandler: RequestHandler = async (req: Request, res: Response) => {

        // Obtém o parâmetro de pesquisa do cabeçalho da requisição.
        const pPesquisa = req.get('pesquisa');

        // Se o parâmetro de pesquisa estiver presente, realiza a pesquisa chamando `pesquisarEvento`.
        if (pPesquisa) {
            const authData = await pesquisarEvento(pPesquisa);

            // Se a pesquisa for bem-sucedida, envia os dados encontrados com um status 200.
            if (authData !== undefined) {
                res.status(200).send({authData});
            
            } else {
                // Em caso de erro durante a pesquisa, retorna status 500 com mensagem de falha.
                res.status(500).send("Falha ao realizar pesquisa");
            }
        } else {
            // Se o parâmetro de pesquisa estiver ausente, retorna um erro 400.
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}
