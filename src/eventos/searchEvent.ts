import {Request, RequestHandler, Response} from "express";
import { conexaoBD } from "../conexaoBD";

export namespace searchEventHandler {

    async function realizarAposta(pesquisa: string): Promise<any | undefined >{
       
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            const palavraChave = '%'+pesquisa+'%';
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

            const linhas: any[] | undefined = result.rows;

            return linhas;

        }catch (err) {

            console.error('Erro ao realizar pesquisa: ', err);
            return undefined;

        }finally {
            await conn.close();
        }
    }

    export const searchEventHandler: RequestHandler = async (req: Request, res: Response) => {

        const pPesquisa = req.get('pesquisa');

        if(pPesquisa){
            const authData = await realizarAposta(pPesquisa);

            if (authData !== undefined) {

                res.status(200).send({authData});
            
            }else{
                
                res.status(500).send("Falha ao realizar pequisa");
            }
        }else{
            
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}