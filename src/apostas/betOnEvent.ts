import { Request, RequestHandler, Response } from "express";
import { conexaoBD} from "../conexaoBD";
import { tokenParaId } from "../funcoes";
import { Connection } from "oracledb";
import { registrarTransacao } from "../carteira/transacoes";

// Define um namespace para o manipulador de apostas em eventos
export namespace betOnEventHandler {

    // Função responsável por retirar um valor específico da carteira do usuário
    async function retiraValorCarteira(idCarteira: number, quant_cotas: number, conn: Connection): Promise<boolean | undefined> {

        try {
            
            // Seleciona o valor total da carteira com base no ID fornecido
            const result = await conn.execute<any[]>(
                `SELECT valor_total
                FROM carteira
                WHERE id_usuario_fk = :idCarteira`,
                { idCarteira: idCarteira }
            );

            const rows = result.rows?.[0]?.[0]; // Obtém o valor total da carteira
            console.log(result) 
            // Verifica se a carteira possui saldo suficiente para a aposta
            if (rows < quant_cotas) {
                console.log("Você nao possui saldo para apostar.");
                return false;
            }

            // Atualiza o valor total da carteira subtraindo a quantidade apostada
            await conn.execute(
                `UPDATE carteira
                SET valor_total = valor_total - :quant_cotas
                WHERE id_usuario_fk = :idCarteira`,
                {
                    quant_cotas: quant_cotas,
                    idCarteira: idCarteira
                }
            );
            

            await conn.commit(); // Confirma a transação
            return true;

        } catch (err) {
            // Em caso de erro, realiza rollback para desfazer as alterações e exibe a mensagem de erro
            console.error('Erro ao remover fundos: ', err);
            await conn.rollback();
            return undefined;
        }
    }

    // Função responsável por realizar a aposta
    async function realizarAposta(token: string, pQuantCotas: string, pIdEvento: string, pPalpite: string): Promise<boolean | undefined> {

        let conn = await conexaoBD(); // Estabelece a conexão com o banco de dados

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            const quantCotas = Number(pQuantCotas); // Converte o valor da aposta para número
            const idEvento = Number(pIdEvento);     // Converte o ID do evento para número
            const palpite = Number(pPalpite);       // Converte o palpite para número
            const idUser = await tokenParaId(token, conn); // Obtém o ID do usuário usando o token
            
            if(!idUser){
                console.log('Erro ao encontrar ususario')
                return false;
            }

            // Insere a nova aposta na tabela `apostas`
            await conn.execute(
                `INSERT INTO aposta (id_usuario_fk, id_evento_fk, quant_cotas, palpite) 
                VALUES (:idUser, :idEvento, :quantCotas, :palpite)`,
                {
                    quantCotas: quantCotas,
                    idUser: idUser,
                    idEvento: idEvento,
                    palpite: palpite
                }
            );

            // Chama a função `retiraValorCarteira` para descontar a quantia apostada da carteira
            const valorApostado = await retiraValorCarteira(idUser, quantCotas, conn);

            if (valorApostado === true) {
                const tipo = 'apostado';
                const transacaoRegistrada = await registrarTransacao(idUser, quantCotas, conn, tipo);
                // Se a transação foi registrada com sucesso, confirma as alterações
                if (transacaoRegistrada) {
                    await conn.commit();
                    return true;
                } else if(transacaoRegistrada === false){
                    console.error('Sem saldo suficiente');
                    return false;
                }else{
                    console.error('Carteira não encontrada ou falha ao registrar a transação.');
                    return undefined;
                }

            } else {
                console.error('Carteira não encontrada ou falha ao registrar a transação.');
                return false;
            }

        } catch (err) {
            // Em caso de erro, realiza rollback e exibe mensagem de erro
            console.error('Erro ao realizar aposta: ', err);
            await conn.rollback();
            return undefined;

        } finally {
            await conn.close(); // Fecha a conexão com o banco de dados
        }
    }

    // Exporta o manipulador de requisição para apostas em eventos
    export const betOnEventHandler: RequestHandler = async (req: Request, res: Response) => {

        // Obtém os parâmetros da requisição HTTP
        const { quantCotas, idEvento, palpite } = req.body;
        const token = req.session.token; // Obtém o token da sessão do usuário
        const isAdmin = req.session.isAdmin;
        
        // Verifica se o usuário está autenticado
        if (!token) {
            res.status(400).send("Necessário realizar Login para esta ação");
            return;
        }

        if (isAdmin) {
            res.status(400).send("Um administrador não pode realizar esta ação");
            return;
        }

        // Verifica se todos os parâmetros necessários estão presentes
        if (quantCotas && idEvento && palpite) {
            const authData = await realizarAposta(token, quantCotas, idEvento, palpite);

            if(authData === false){
               res.status(400).send(`Sem saldo para realizar a aposta!`);
               return;
            }

            // Se a aposta for bem-sucedida, envia uma resposta de sucesso
            if (authData) {
                res.status(200).send(`Aposta realizada com sucesso!`);
                return;

            } else {
                // Caso contrário, envia uma resposta de erro
                res.status(500).send("Você já realizou uma aposta nesse evento!");
                return;
            }
        } else {
            // Se algum parâmetro estiver faltando ou for inválido, envia uma resposta de erro
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}