import { Request, RequestHandler, Response } from "express";
import { conexaoBD } from "../conexaoBD";
import { registrarTransacao } from "../carteira/transacoes";

// Define um namespace `finishEventHandler` para encapsular as funções relacionadas ao término de um evento.
export namespace finishEventHandler {

    // Função que finaliza um evento baseado no ID do evento e na aposta vencedora.
    async function finalizarEvento(pIdEvento: string, pPalpite: string): Promise<boolean | undefined> {

        // Estabelece a conexão com o banco de dados.
        let conn = await conexaoBD();

        // Retorna `undefined` se houver falha na conexão.
        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            // Converte `pPalpite` e `pIdEvento` em números.
            const palpite = Number(pPalpite);
            const idEvento = Number(pIdEvento);

            // Calcula o prêmio total com base na soma das cotas de apostas.
            const selectPremioTotal = await conn.execute<any[]>(`
                SELECT SUM(quant_cotas)
                FROM apostas
                WHERE id_eventos_fk = :idEvento`,
                { idEvento: idEvento }
            );

            const pPremioTotal = selectPremioTotal.rows?.[0]?.[0];
            const premioTotal = Number(pPremioTotal);

            // Calcula o total de cotas dos vencedores.
            const selectApostaVencedores = await conn.execute<any[]>(`
                SELECT SUM(quant_cotas)
                FROM apostas
                WHERE id_eventos_fk = :idEvento
                AND palpite = :palpite`,
                {
                    idEvento: idEvento,
                    palpite: palpite
                }
            );

            const pApostaVencedores = selectApostaVencedores.rows?.[0]?.[0];
            const apostaVencedores = Number(pApostaVencedores);

            // Consulta as cotas por usuário vencedor e armazena os resultados.
            const selectCotacaoPorUsuario = await conn.execute(`
                SELECT id_usuarios_fk, SUM(quant_cotas)
                FROM apostas
                WHERE id_eventos_fk = :idEvento
                AND palpite = :palpite
                GROUP BY id_usuarios_fk`,
                {
                    idEvento: idEvento,
                    palpite: palpite
                }
            );

            const resultados = selectCotacaoPorUsuario.rows as Array<[number, number]>;
        
            // Itera sobre cada vencedor para calcular e atualizar o prêmio em suas carteiras.
            for(const [idUser, totalCotas] of resultados){
                
                // Calcula o valor a ser distribuído para cada vencedor.
                const novo_valor = (totalCotas / apostaVencedores) * premioTotal;

                // Consulta o ID da carteira do usuário.
                const arrayId = await conn.execute<any[]>(`
                    SELECT id
                    FROM carteira
                    WHERE id_usuarios_fk = :idUser`,
                    { idUser: idUser }
                );

                console.dir(arrayId.rows, { depth: null });
                
                const idCarteira = arrayId.rows?.[0]?.[0];
            
                // Atualiza o saldo total da carteira do usuário vencedor.
                await conn.execute(`
                    UPDATE carteira
                    SET valor_total = valor_total + :novo_valor
                    WHERE id_usuarios_fk = :idUser`,
                    {
                        novo_valor: novo_valor,
                        idUser: idUser
                    }
                );

                // Registra a transação como um "lucro" para cada vencedor.
                const tipo = 'lucro';
                const transacaoRegistrada = await registrarTransacao(idCarteira, novo_valor, conn, tipo);

                // Em caso de falha ao registrar a transação, exibe erro e retorna `false`.
                if (!transacaoRegistrada) { 
                    console.error('Erro ao registrar a transação.'); 
                    return false; 
                }
            }
        
            // Atualiza o status do evento para "finalizado".
            await conn.execute(`
                UPDATE eventos
                SET status = 'finalizado'
                WHERE id = :idEvento`,
                { idEvento: idEvento }
            );

            // Confirma todas as transações realizadas.
            await conn.commit();
            return true;
            
        } catch (err) {
            // Em caso de erro, realiza rollback e exibe a mensagem de erro.
            console.error('Erro ao finalizar evento: ', err);
            await conn.rollback();
            return undefined;

        } finally {
            // Fecha a conexão com o banco de dados.
            await conn.close();
        }
    }

    // Define um `RequestHandler` para lidar com a requisição de finalização de um evento.
    export const finishEventHandler: RequestHandler = async (req: Request, res: Response) => {

        // Obtém o ID do evento e o palpite vencedor dos cabeçalhos da requisição.
        const pIdEvento = req.get('idEvento');
        const pPalpite = req.get('palpiteGanhador');
        const isAdmin = req.session.isAdmin; // Verifica se o usuário é administrador.

        // Verifica se o usuário é administrador e os parâmetros estão corretos.
        if (isAdmin) {
            if (pIdEvento && pPalpite) {
                // Tenta finalizar o evento.
                const authData = await finalizarEvento(pIdEvento, pPalpite);
                
                // Se a operação for bem-sucedida, envia status 200 com mensagem de sucesso.
                if (authData !== undefined) {
                    res.status(200).send('Evento finalizado com sucesso!');
                } else {
                    res.status(500).send('Erro ao aprovar evento');
                }
            } else {
                // Retorna status 400 se faltar algum parâmetro.
                res.status(400).send('Faltando parâmetros');
            }
        } else {
            // Retorna status 400 se o usuário não for administrador.
            res.status(400).send('Necessário ser moderador para realizar essa ação!');
        }
    }
}
