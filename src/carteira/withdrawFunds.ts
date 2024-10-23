import {Request, RequestHandler, Response} from "express";

import { conexaoBD } from "../conexaoBD";
import OracleDB from "oracledb";

export namespace withdrawFundsHandler {

    async function tokenParaId(token: string, conn:any):  Promise<number | undefined >{
        

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

    async function registrarTransacao(pIdCarteira: number, valor: number, conn: any): Promise<boolean | undefined >{

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

        }
    }

    async function sacarValorCarteira(token: string, pValor: string): Promise< boolean | undefined >{
       
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {

            const valor = Number(pValor);
            const idUser = await tokenParaId(token, conn);

            const selectSaldo = await conn.execute<any[]>(
                `SELECT valor_total
                FROM carteira
                WHERE id_usuarios_fk = :idUser`,
                {idUser: idUser}
            );

            const pSaldoAtual = selectSaldo.rows?.[0]?.[0];
            const SaldoAtual = Number(pSaldoAtual);

            console.log(SaldoAtual)
            if (SaldoAtual === undefined) {
                console.error("Falha ao obter o saldo da carteira.");
                return false;
            }else if (SaldoAtual <= 0 || SaldoAtual < valor) {
                console.log("Não foi possível sacar, saldo insuficiente!");
                return false;
            }

            const arrayId = await conn.execute<any[]>(
                `SELECT id
                FROM carteira
                WHERE id_usuarios_fk = :idUser`,
                {idUser: idUser}
            )
            
            const idCarteira = arrayId.rows?.[0]?.[0];
            
            console.dir(arrayId.rows, {depth: null});

            let valorDescontado = valor

            if(valor<=100){
                valorDescontado = valor + (valor * 0.04)
            }else if(valor>100 && valor<=1000){
                valorDescontado = valor + (valor * 0.03)
            }else if(valor>1000 && valor <=5000){
                valorDescontado = valor + (valor * 0.02)
            }else if(valor > 5000 && valor <=100000){
                valorDescontado = valor + (valor * 0.01)
            }
            
            const novo_valor:number = SaldoAtual - valorDescontado
            console.log(novo_valor)
            await conn.execute(
                `UPDATE carteira
                SET valor_total = :novo_valor
                WHERE id_usuarios_fk = :idUser`,
                {
                    novo_valor: novo_valor,
                    idUser: idUser
                }
            );

            const transacaoRegistrada = await registrarTransacao(idCarteira, valor, conn);

            if (transacaoRegistrada) {
                await conn.commit();
                return true;
            } else {
                console.error('Erro ao registrar a transação.'); 
                return false; 
            }

        }catch (err) {

            console.error('Erro ao sacar fundos: ', err);
            await conn.rollback();
            return undefined;

        }finally {
            await conn.close();
        }
    }

    export const withdrawFundsHandler: RequestHandler = async (req: Request, res: Response) => {

        const pAgenciaBancaria = req.get('agenciaBancaria');
        const pNumConta = req.get('numeroConta');
        const pTipoConta = req.get('tipoConta');
        const pValor = req.get('valor');
        const token = req.session.token

        if(!token){
            res.status(400).send("Necessario realizar Login para esta ação");
            return
        }

        if(pAgenciaBancaria && pNumConta && pTipoConta && pValor && pValor >="101000"){
            const authData = await sacarValorCarteira(token, pValor);

            if (authData !== undefined || authData !== false) {

                res.status(200).send(`Dinheiro sacado com sucesso!`);
            
            }else{
                
                res.status(500).send("Falha ao inserir dados no sistema");
            }
        }else{
            
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}