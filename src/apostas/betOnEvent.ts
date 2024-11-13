import { Request, RequestHandler, Response } from "express";
import { conexaoBD} from "../conexaoBD";
import { tokenParaId } from "../funcoes";
import { Connection } from "oracledb";

// Define um namespace para o manipulador de apostas em eventos
export namespace betOnEventHandler {

    // Função responsável por retirar um valor específico da carteira do usuário
    async function retiraValorCarteira(idCarteira: number, quant_cotas: number, conn: Connection): Promise<boolean | undefined> {

        try {
            // Seleciona o valor total da carteira com base no ID fornecido
            const result = await conn.execute<any[]>(
                `SELECT valor_total
                FROM carteira
                WHERE id = :idCarteira`,
                { idCarteira: idCarteira }
            );

            const rows = result.rows?.[0]?.[0]; // Obtém o valor total da carteira

            // Verifica se a carteira possui saldo suficiente para a aposta
            if (rows < quant_cotas) {
                console.log("Você nao possui saldo para apostar.");
                return false;
            }

            // Atualiza o valor total da carteira subtraindo a quantidade apostada
            await conn.execute(
                `UPDATE carteira
                SET valor_total = valor_total - :quant_cotas
                WHERE id = :idCarteira`,
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

            // Verifica o status do evento para garantir que ele está "aprovado" antes de permitir apostas
            const pStatusEvento = await conn.execute<any[]>(
                `SELECT status
                FROM eventos
                WHERE id = :idEvento`,
                { idEvento: idEvento }
            );

            const statusEvento = pStatusEvento.rows?.[0]?.[0]; // Obtém o status do evento

            // Verifica se o evento está aprovado; caso contrário, a aposta não é permitida
            if (statusEvento !== 'aprovado') {
                console.error("Evento não aprovado!");
                return false;
            }

            // Insere a nova aposta na tabela `apostas`
            await conn.execute(
                `INSERT INTO apostas (id, id_usuarios_fk, id_eventos_fk, quant_cotas, palpite) 
                VALUES (seq_id_apostas.NEXTVAL, :idUser, :idEvento, :quantCotas, :palpite)`,
                {
                    quantCotas: quantCotas,
                    idUser: idUser,
                    idEvento: idEvento,
                    palpite: palpite
                }
            );

            // Seleciona o ID da carteira do usuário
            const arrayId = await conn.execute<any[]>(
                `SELECT id
                FROM carteira
                WHERE id_usuarios_fk = :idUser`,
                { idUser: idUser }
            );

            const idCarteira = arrayId.rows?.[0]?.[0]; // Extrai o ID da carteira
            console.dir(arrayId.rows, { depth: null }); // Exibe o ID da carteira para depuração

            // Chama a função `retiraValorCarteira` para descontar a quantia apostada da carteira
            const valorApostado = await retiraValorCarteira(idCarteira, quantCotas, conn);

            if (valorApostado === true) {
                await conn.commit(); // Confirma a transação se tudo ocorrer bem
                return true;
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
        const pQuantCotas = req.get('quantCotas');
        const pIdEvento = req.get('idEvento');
        const pPalpite = req.get('palpite');
        const token = req.session.token; // Obtém o token da sessão do usuário

        // Verifica se o usuário está autenticado
        if (!token) {
            res.status(400).send("Necessário realizar Login para esta ação");
            return;
        }

        // Verifica se todos os parâmetros necessários estão presentes
        if (pQuantCotas && pIdEvento && pPalpite) {
            const authData = await realizarAposta(token, pQuantCotas, pIdEvento, pPalpite);

            // Se a aposta for bem-sucedida, envia uma resposta de sucesso
            if (authData !== undefined && authData !== false) {
                res.status(200).send(`Aposta realizada com sucesso!`);
            } else {
                // Caso contrário, envia uma resposta de erro
                res.status(500).send("Falha ao inserir dados no sistema");
            }
        } else {
            // Se algum parâmetro estiver faltando ou for inválido, envia uma resposta de erro
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}