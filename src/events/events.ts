import { pseudoRandomBytes } from "crypto";
import {Request, RequestHandler, Response} from "express";
import OracleDB, { poolIncrement } from "oracledb"
import { ppid } from "process";
import { PassThrough } from "stream";

async function conexaoBD(){
    try {
        let conn = await OracleDB.getConnection({
            user: "BD130824216",
            password: "Wqczx3",
            connectString: "172.16.12.14/xe"
        });
        return conn;
    } catch (err) {
        console.error('Erro ao conectar:', err);
        return undefined;
    }
}

export namespace EventsHandler {

    async function InserirEvento(titulo: string, desc: string, data_inicio:string, data_hora_inicio_apostas:string, data_hora_fim_apostas: string): Promise<boolean | undefined >{

        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            await conn.execute(
                `INSERT INTO eventos (id, titulo, descricao, data_inicio, data_hora_inicio_apostas, data_hora_fim_apostas, valor_apostas_totais, isActive, isAproved, id_usuarios_fk) 
                VALUES (seq_id_eventos.NEXTVAL, :titulo, :descricao, TO_DATE(:data_inicio, 'DD/MM/YYYY'), 
                TO_DATE(:data_hora_inicio_apostas, 'DD/MM/YYYY'), TO_DATE(:data_hora_fim_apostas, 'DD/MM/YYYY'), 0, 0, 0, null)`,
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
    
}

function InserirEvento(pTitulo: string, pDesc: string, pDataInicio: string, pDataHoraInicioApostas: string, pDataHoraFimApostas: string) {
    throw new Error("Function not implemented.");
}
