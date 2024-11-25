import {Request, RequestHandler, Response} from "express";
import { conexaoBD } from "../conexaoBD";
import { registrarTransacao } from "./transacoes";
import { tokenParaId } from "../funcoes";
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

            if(!idUser){
                console.log('Erro ao encontrar ususario')
                return false;
            }

            const selectSaldo = await conn.execute<any[]>(
                `SELECT valor_total
                FROM carteira
                WHERE id_usuario_fk = :idUser`,
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
                WHERE id_usuario_fk = :idUser`,
                {
                    novo_valor: novo_valor,
                    idUser: idUser
                }
            );

            const tipo = 'saque' 
            const transacaoRegistrada = await registrarTransacao(idUser, valor, conn, tipo);

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

        const { agenciaBancaria, numeroConta, tipoConta, valor } = req.body;
        const token = req.session.token

        if(!token){
            res.status(400).send("Necessario realizar Login para esta ação");
            return
        }

        if(agenciaBancaria && numeroConta && tipoConta && valor){
            const authData = await sacarValorCarteira(token, valor);

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