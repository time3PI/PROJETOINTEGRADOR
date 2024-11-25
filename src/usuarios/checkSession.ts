import { Request, RequestHandler, Response } from "express";
import { conexaoBD } from "../conexaoBD";
import { Connection } from "oracledb";

// Interface para os dados do usuário
interface UserAuthData {
    ID: number;
    NOME: string;
    EMAIL: string;
    VALOR_TOTAL: number;
    ID_CARTEIRA: number;
}

export namespace checkSessionHandler {

    // Função para buscar informações do usuário e carteira
    async function getUser(token: string, conn: Connection): Promise<UserAuthData | undefined> {
        try {
            const result = await conn.execute(
                `SELECT 
                    u.ID_USUARIO, 
                    u.NOME, 
                    u.EMAIL, 
                    c.VALOR_TOTAL, 
                FROM 
                    usuarios u
                LEFT JOIN 
                    carteira c 
                ON 
                    u.ID_USUARIO = c.ID_USUARIOS_FK
                WHERE 
                    u.TOKEN = :token`,
                { token }
            );

            // Verifica se as linhas existem e converte para o tipo esperado
            const rows = result.rows;
            if (rows && rows.length > 0) {
                const [id, nome, email, valor_total] = rows[0] as [
                    number,
                    string,
                    string,
                    number,
                    number
                ];
                return { ID: id, NOME: nome, EMAIL: email, VALOR_TOTAL: valor_total, ID_CARTEIRA: id };
            }

            return undefined;
        } catch (err) {
            console.error("Erro ao buscar informações do usuário: ", err);
            throw err;
        }
    }

    // Função para buscar transações dos últimos 60 dias
    async function getTransacoes(idCarteira: number, conn: Connection) {
        try {
            const result = await conn.execute(
                `SELECT 
                    ID_TRANSACAO,
                    VALOR_TOTAL,
                    DATA_TRANSACAO, 
                    TIPO,
                    ID_CARTEIRA_FK
                FROM transacao
                WHERE ID_CARTEIRA_FK = :idCarteira
                AND DATA_TRANSACAO BETWEEN TO_DATE(SYSDATE - INTERVAL '60' DAY, 'DD/MM/YYYY') AND TO_DATE(SYSDATE, 'DD/MM/YYYY')
                ORDER BY DATA_TRANSACAO DESC`,
                { idCarteira }
            );

            if(!result.rows){
                return undefined
            }

            const transacoesAjustadas = result.rows.map((transacao: any) => {
                const [id, valor, dataTransacao, tipo, idCarteiraFk] = transacao;
                const data = new Date(dataTransacao);
    
                // Verifica se o ano está incorreto e ajusta
                if (data.getFullYear() < 2000) {
                    data.setFullYear(2000 + data.getFullYear() % 100); // Adiciona 20 ao ano
                }
    
                return { id, valor, dataTransacao: data.toISOString(), tipo, idCarteiraFk };
            });
    
            // console.dir(transacoesAjustadas, { depth: null });
            return transacoesAjustadas || [];
        } catch (err) {
            console.error("Erro ao buscar transações: ", err);
            throw err;
        }
    }

    // Manipulador de verificação de sessão
    export const checkSessionHandler: RequestHandler = async (req: Request, res: Response) => {
        const token = req.session.token;

        if (!token) {
            res.status(400).send("Usuário sem login");
            return;
        }

        let conn: Connection | undefined;

        try {
            conn = await conexaoBD(); // Estabelece conexão com o banco de dados

            if (!conn) {
                res.status(500).send("Erro ao conectar ao banco de dados");
                return;
            }

            // Busca informações do usuário e da carteira
            const authData = await getUser(token, conn);

            if (!authData) {
                res.status(404).send("Usuário não encontrado");
                return;
            }

            const { ID_CARTEIRA } = authData;

            // Busca transações da carteira
            const transactions = await getTransacoes(ID_CARTEIRA, conn);

            // Retorna informações do usuário e transações
            res.status(200).send({ authData, transactions });
        } catch (err) {
            console.error("Erro no checkSessionHandler: ", err);
            res.status(500).send("Erro interno do servidor");
        } finally {
            if (conn) {
                try {
                    await conn.close();
                } catch (err) {
                    console.error("Erro ao fechar a conexão: ", err);
                }
            }
        }
    };
}
