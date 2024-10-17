import OracleDB, { Connection, poolIncrement } from "oracledb"
import dotenv from 'dotenv'; 

dotenv.config();

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