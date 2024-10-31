import {Request, RequestHandler, Response} from "express";
import { conexaoBD, tokenParaId } from "../conexaoBD";
import { registrarTransacao } from "./transacoes";

export namespace withdrawFundsHandler {

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
            let taxa = 0
            if(valor<=100){
                taxa = (valor * 0.04)
                valorDescontado = valor - taxa
            }else if(valor>100 && valor<=1000){
                taxa = (valor * 0.03)
                valorDescontado = valor - taxa
            }else if(valor>1000 && valor <=5000){
                taxa = (valor * 0.02)
                valorDescontado = valor - taxa
            }else if(valor > 5000 && valor <=100000){
                taxa = (valor * 0.01)
                valorDescontado = valor - taxa
            }
            
            const novo_valor:number = SaldoAtual - valor

            await conn.execute(
                `UPDATE carteira
                SET valor_total =  :novo_valor
                WHERE id_usuarios_fk = :idUser`,
                {
                    novo_valor: novo_valor,
                    idUser: idUser
                }
            );

            const tipo = 'saque' 
            const transacaoRegistrada = await registrarTransacao(idCarteira, valor, conn, tipo);

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

        if(pAgenciaBancaria && pNumConta && pTipoConta && pValor){
            const authData = await sacarValorCarteira(token, pValor);

            if (authData !== undefined && authData !== false) {

                res.status(200).send(`Dinheiro sacado com sucesso!`);
            
            }else{
                
                res.status(500).send("Falha ao inserir dados no sistema");
            }
        }else{
            
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}