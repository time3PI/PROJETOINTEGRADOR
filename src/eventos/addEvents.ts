import { Request, RequestHandler, Response } from "express";
import { conexaoBD } from "../conexaoBD";
import { formatarData, formatarDataHora, tokenParaId } from "../funcoes";

// Define um namespace para o gerenciador de eventos
export namespace addEventsHandler {

    // Função assíncrona para inserir um novo evento no banco de dados
    async function InserirEvento(titulo: string, desc: string, data_inicio: string, data_hora_inicio_apostas: string, data_hora_fim_apostas: string, token: string): Promise<boolean | undefined> {

        let conn = await conexaoBD();  // Estabelece uma conexão com o banco

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            // Obtém o ID do usuário a partir do token fornecido
            const idUser = await tokenParaId(token, conn);
            data_inicio = formatarData(data_inicio);

            // Insere o evento com os dados fornecidos e o ID do usuário como chave estrangeira
            await conn.execute(
                `INSERT INTO eventos (id, titulo, descricao, data_inicio, data_hora_inicio_apostas, data_hora_fim_apostas, id_usuarios_fk, status) 
                VALUES (seq_id_eventos.NEXTVAL, :titulo, :descricao, TO_TIMESTAMP(:data_inicio, 'DD/MM/YYYY HH24:MI:SS'), 
                TO_TIMESTAMP(:data_hora_inicio_apostas, 'DD/MM/YYYY HH24:MI:SS'), TO_TIMESTAMP(:data_hora_fim_apostas, 'DD/MM/YYYY HH24:MI:SS'), :idUser, 'aguarda aprovação')`,
                {
                    titulo: titulo,
                    descricao: desc,  
                    data_inicio: data_inicio,
                    data_hora_inicio_apostas: data_hora_inicio_apostas,
                    data_hora_fim_apostas: data_hora_fim_apostas,
                    idUser: idUser
                }
            );
            
            await conn.commit();  // Confirma a transação
            return true;

        } catch (err) {
            // Em caso de erro, faz o rollback para desfazer as alterações
            console.error('Erro ao cadastrar evento: ', err);
            await conn.rollback();
            return undefined;

        } finally {
            // Fecha a conexão com o banco de dados
            await conn.close();
        }
    }

    // Função que lida com a requisição HTTP para criar um novo evento
    export const addNewEventHandler: RequestHandler = async (req: Request, res: Response) => {
        console.log("chegou aki")
        // Extrai os parâmetros da requisição HTTP
        const { titulo, desc, dataInicio, dataInicioApostas, horaInicioApostas, dataFimApostas, horaFimApostas } = req.body;
    
        const token = req.session.token;  // Obtém o token do usuário da sessão

        // Verifica se o usuário está autenticado (possui token)
        if (token === undefined || token === null) {
            res.status(400).send("Necessário realizar login para esta ação");
            return;
        }

        const dataHoraInicioApostas = formatarDataHora(dataInicioApostas, horaInicioApostas);
        const dataHoraFimApostas = formatarDataHora(dataFimApostas, horaFimApostas);     

        // Verifica se todos os parâmetros obrigatórios estão presentes
        if (titulo && desc && dataInicio && dataHoraInicioApostas && dataHoraFimApostas) {
            const authData = await InserirEvento(titulo, desc, dataInicio, dataHoraInicioApostas, dataHoraFimApostas, token);

            // Caso o evento tenha sido inserido com sucesso, envia uma resposta de sucesso
            if (authData !== undefined && authData !== false) {
                res.status(200).send(`Novo evento adicionado com sucesso!`);
            } else {
                res.status(500).send("Falha ao inserir dados no sistema");  // Em caso de erro, responde com status 500
            }
        } else {
            res.status(400).send("Parâmetros inválidos ou faltantes.");  // Caso algum parâmetro esteja ausente, responde com status 400
        }
    }
}
