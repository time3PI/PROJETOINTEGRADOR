import {Request, RequestHandler, Response} from "express";
import dotenv from 'dotenv'; 

import { conexaoBD } from "../conexaoBD";

dotenv.config();

export namespace addFundsHandler {

    async function tokenParaId(token: string):  Promise<number | undefined >{
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

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
        } finally {
            await conn.close();
        }
    }

    async function registrarTransacao(pIdCarteira: number, valor: number): Promise<boolean | undefined >{
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            
            const idCarteira = Number(pIdCarteira);
            await conn.execute(
                `INSERT INTO transacoes (id, valor_total, data_transacao, tipo, id_carteira_fk) 
                VALUES (seq_id_transacoes.NEXTVAL, :valor, TO_DATE(SYSDATE, 'DD/MM/YYYY'), 'adicionado', :idCarteira)`,
                {
                    valor: valor,
                    idCarteira: idCarteira
                }
            );

            await conn.commit()
            return true;
        }catch (err) {

            console.error('Erro ao registrar transação: ', err);
            await conn.rollback();
            return undefined;

        }finally {
            await conn.close();
        }
    }

    async function inserirValorCarteira(token: string, valor: string): Promise<boolean | undefined >{
       
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {

            const NumberValor = Number(valor);
            const idUser = await tokenParaId(token);

            await conn.execute(
                `UPDATE carteira
                SET valor_total = valor_total + :novo_valor
                WHERE id_usuarios_fk = :idUser`,
                {
                    novo_valor: NumberValor,
                    idUser: idUser
                }
            );
            
            await conn.commit();

            const result = await conn.execute<any[]>(
                `SELECT id
                FROM carteira
                WHERE id_usuarios_fk = :idUser`,
                {idUser: idUser}
            )
            
            
            const idCarteira = result.rows?.[0]?.[0];
            
            console.dir(result.rows, {depth: null});

            if(await registrarTransacao(idCarteira, NumberValor)){
                return true;
            }else {
                console.error('Carteira não encontrada ou falha ao registrar a transação.');
                return false; 
            }

        }catch (err) {

            console.error('Erro ao adicionar fundos: ', err);
            await conn.rollback();
            return undefined;

        }finally {
            await conn.close();
        }
    }


    export const addFundsHandler: RequestHandler = async (req: Request, res: Response) => {

        const pNumCartao = req.get('numCartao');
        const pNomeCartao = req.get('nomeCartao');
        const pDataVencimento = req.get('dataVencimento');
        const pCodSeguranca = req.get('codSeguranca');
        const pValor = req.get('valor');
        const token = req.session.token

        if(token === undefined || token === null){
            res.status(400).send("Necessario realizar Login para esta ação");
            return
        }

        if(pNumCartao && pNomeCartao && pDataVencimento && pCodSeguranca && pValor){
            const authData = await inserirValorCarteira(token, pValor);

            if ( authData !== undefined && authData !== false) {

                res.status(200).send(`Novo fundos adicionados com sucesso!`);
            
            }else{
                
                res.status(500).send("Falha ao inserir dados no sistema");
            }
        }else{
            
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}