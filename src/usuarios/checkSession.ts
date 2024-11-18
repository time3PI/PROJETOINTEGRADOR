import { Request, RequestHandler, Response } from "express";
import { conexaoBD } from "../conexaoBD";

export namespace checkSessionHandler {
    async function getUser(token:string) {
        let conn = await conexaoBD();  // Estabelece conexão com o banco de dados

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
        
            const result = await conn.execute(
                `SELECT 
                    u.*,
                    c.valor_total
                FROM 
                    usuarios u
                LEFT JOIN 
                    carteira c 
                ON 
                    u.id = c.id_usuarios_fk
                WHERE 
                    u.token = :token`,
                {
                    token: token,
                }
            );
            // console.dir(result.rows, {depth: null});
            const linhas: any[] | undefined = result.rows;
            return linhas;

        }catch (err) {
            // Captura e exibe um erro caso a consulta falhe
            console.error('Erro ao buscar eventos: ', err);
            return undefined;
        } finally {
            await conn.close();  // Fecha a conexão com o banco de dados
        }
    }
    export const checkSessionHandler: RequestHandler = async (req: Request, res: Response) => {
        const token = req.session.token;
        

        if (token) {
            const authData = await getUser(token);
            if(!authData){
                res.status(500).send("Erro ao pegar informações");
            }
            res.status(200).send({ authData });
        } else {
            res.status(400).send("Usuario sem login");
        }
    };
}
