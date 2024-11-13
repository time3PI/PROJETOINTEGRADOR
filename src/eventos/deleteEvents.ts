import { Request, RequestHandler, Response } from "express";
import { conexaoBD } from "../conexaoBD";
import { tokenParaId } from "../funcoes";

// Define um namespace para o gerenciador de exclusão de eventos
export namespace deleteEventsHandler {

    // Função assíncrona para alterar o status de um evento para "suspenso"
    async function deletarEvento(token: string, idEvento: string): Promise<boolean | undefined> {
        let conn = await conexaoBD();  // Estabelece uma conexão com o banco

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            // Obtém o ID do usuário associado ao token
            const idUser = await tokenParaId(token, conn);

            // Atualiza o status do evento para 'suspenso' apenas se o evento estiver em "aguarda aprovação" e pertencer ao usuário autenticado
            await conn.execute(
                `UPDATE eventos
                SET status = 'suspenso'
                WHERE id = :idEvento 
                AND id_usuarios_fk = :idUser 
                AND status = 'aguarda aprovação'`,
                {
                    idEvento: idEvento,
                    idUser: idUser,
                }
            );

            await conn.commit();  // Confirma a transação
            return true;

        } catch (err) {
            // Em caso de erro, realiza o rollback para desfazer a alteração
            console.error('Erro ao deletar evento: ', err);
            await conn.rollback();
            return undefined;

        } finally {
            // Fecha a conexão com o banco de dados
            await conn.close();
        }
    }

    // Função que lida com a requisição HTTP para deletar um evento
    export const deleteEventHandler: RequestHandler = async (req: Request, res: Response) => {
        const pIdEvento = req.get('idEvento');  // Obtém o ID do evento a ser deletado a partir do cabeçalho da requisição
        const token = req.session.token;  // Obtém o token do usuário da sessão

        // Verifica se o usuário está autenticado (possui token)
        if (token === undefined || token === null) {
            res.status(400).send("Necessário realizar login para esta ação");
            return;
        }

        // Verifica se o ID do evento foi fornecido
        if (pIdEvento) {
            const authData = await deletarEvento(token, pIdEvento);
            if (authData !== undefined) {
                res.status(200).send('Evento deletado com sucesso!');
            } else {
                res.status(500).send('Erro ao deletar evento');  // Caso ocorra algum erro, responde com status 500
            }
        } else {
            res.status(400).send('Faltando parâmetros');  // Caso o ID do evento não tenha sido fornecido, responde com status 400
        }
    }
}
