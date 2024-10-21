import {Request, RequestHandler, Response} from "express";
import OracleDB, { Connection, poolIncrement } from "oracledb"
import dotenv from 'dotenv'; 


import { conexaoBD } from "../conexaoBD";

dotenv.config();

export namespace withdrawFundsHandler {

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
                VALUES (seq_id_transacoes.NEXTVAL, :valor, TO_DATE(SYSDATE, 'DD/MM/YYYY'), 'sacado', :idCarteira)`,
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

    async function sacarValorCarteira(token: string, valor: string): Promise<boolean | undefined >{
       
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {

            const NumberValor = Number(valor);
            const idUser = await tokenParaId(token);

            const result = await conn.execute<{ valor_atual: number }>(
                `UPDATE carteira
                SET valor_total = valor_total - :novo_valor
                WHERE id_usuarios_fk = :idUser`,
                {
                    novo_valor: NumberValor,
                    idUser: idUser,
                    valor_atual: { type: OracleDB.NUMBER, dir: OracleDB.BIND_OUT }
                }
            );

            if (!result.outBinds || !result.outBinds.valor_atual) {
                console.log("Erro ao obter o valor atualizado da carteira.");
                return false;
            }

            const valorAtualizado = result.outBinds.valor_atual;

            if(valorAtualizado < 0){
                console.log("Não foi possivel sacar, você nao possui saque suficiente para o saque!");
                return false;
            }

            await conn.commit()

            const arrayId = await conn.execute<any[]>(
                `SELECT id
                FROM carteira
                WHERE id_usuarios_fk = :idUser`,
                {idUser: idUser}
            )
            
            
            const idCarteira = arrayId.rows?.[0]?.[0];
            
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

    export const withdrawFundsHandler: RequestHandler = async (req: Request, res: Response) => {

        const pAgenciaBancaria = req.get('Agencia bancaria');
        const pNumConta = req.get('numero da conta');
        const pTipoConta = req.get('tipo da conta');
        const pValor = req.get('valor');
        const token = req.session.token

        if(!token){
            res.status(400).send("Necessario realizar Login para esta ação");
            return
        }

        if(pAgenciaBancaria && pNumConta && pTipoConta && pValor){
            const authData = await sacarValorCarteira(token, pValor);

            if (authData !== undefined || authData !== false) {

                res.status(200).send(`Novo fundos adicionados com sucesso!`);
            
            }else{
                
                res.status(500).send("Falha ao inserir dados no sistema");
            }
        }else{
            
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}