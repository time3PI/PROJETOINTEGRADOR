import { Request, RequestHandler, Response } from "express";
import { registrarTransacao } from "./transacoes";
import { conexaoBD } from "../conexaoBD";
import { tokenParaId, formatarData } from "../funcoes"; 

// Define um namespace para o manipulador de adição de fundos
export namespace addFundsHandler {

    // Função responsável por adicionar fundos à carteira de um usuário a partir de um token e valor especificados
    async function inserirValorCarteira(token: string, valor: string): Promise<boolean | undefined> {

        // Obtém uma conexão com o banco de dados
        let conn = await conexaoBD();

        // Verifica se a conexão foi bem-sucedida
        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            const tipo = 'adicionado';         // Tipo de transação
            const NumberValor = Number(valor); // Converte o valor para número
            const idUser = await tokenParaId(token, conn); // Obtém o ID do usuário a partir do token

            if(!idUser){
                console.log('Erro ao encontrar ususario')
                return false;
            }

            // Atualiza o valor total da carteira com o novo valor
            await conn.execute(
                `UPDATE carteira
                SET valor_total = valor_total + :novo_valor
                WHERE id_usuario_fk = :idUser`,
                {
                    novo_valor: NumberValor, // Valor a ser adicionado
                    idUser: idUser           // ID do usuário dono da carteira
                }
            );

            // Registra a transação utilizando a função `registrarTransacao`
            const transacaoRegistrada = await registrarTransacao(idUser, NumberValor, conn, tipo);

            // Se a transação foi registrada com sucesso, confirma as alterações
            if (transacaoRegistrada) {
                await conn.commit();
                return true;
            } else {
                console.error('Carteira não encontrada ou falha ao registrar a transação.');
                return false;
            }

        } catch (err) {
            // Em caso de erro, exibe a mensagem no console e realiza rollback para desfazer as operações
            console.error('Erro ao adicionar fundos: ', err);
            await conn.rollback();
            return undefined;

        } finally {
            // Fecha a conexão com o banco de dados
            await conn.close();
        }
    }

    // Exporta o manipulador de requisição para adicionar fundos
    export const addFundsHandler: RequestHandler = async (req: Request, res: Response) => {
 
        // Obtém os parâmetros do cartão e valor do corpo da requisição
        const {  nomeCartao, numCartao, dataValidade, valor, cvv } = req.body;
        const token = req.session.token; // Obtém o token do usuário da sessão

        // Verifica se o usuário está autenticado
        if (token === undefined || token === null) {
            res.status(400).send("Necessário realizar Login para esta ação");
            return;
        }

        // Verifica se todos os parâmetros necessários estão presentes
        if ( numCartao && nomeCartao && dataValidade && cvv && valor) {
            // Chama a função `inserirValorCarteira` para adicionar o valor à carteira
            const authData = await inserirValorCarteira(token, valor);

            // Se a operação foi bem-sucedida, envia uma resposta de sucesso
            if (authData !== undefined && authData !== false) {
                res.status(200).send(`Fundos adicionados com sucesso!`);
            } else {
                // Caso contrário, envia uma resposta de erro
                res.status(500).send("Falha ao inserir dados no sistema");
            }
        } else {
            // Se algum parâmetro estiver faltando ou inválido, envia uma resposta de erro
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}
