import OracleDB, { Connection, poolIncrement } from "oracledb"
import dotenv from 'dotenv'; 

dotenv.config();

//realiza a conexao com o banco de dados
export async function conexaoBD(){
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

export async function tokenParaId(token: string, conn: Connection):  Promise<number | undefined >{

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
    }
}