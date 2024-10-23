import { Request, RequestHandler, Response } from "express";
import { conexaoBD } from "../conexaoBD";

export namespace finishEventHandler {

    async function registrarTransacao(pIdCarteira: number, valor: number, conn:any): Promise<boolean | undefined >{

        try {
            const idCarteira = Number(pIdCarteira);

            await conn.execute(
                `INSERT INTO transacoes (id, valor_total, data_transacao, tipo, id_carteira_fk) 
                VALUES (seq_id_transacoes.NEXTVAL, :valor, TO_DATE(SYSDATE, 'DD/MM/YYYY'), 'dividendo', :idCarteira)`,
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

    async function finalizarEvento(pIdEvento: string, pPalpite: string): Promise<boolean | undefined> {

        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            const palpite = Number(pPalpite);
            const idEvento = Number(pIdEvento);

            const selectPremioTotal = await conn.execute<any[]>(`
                SELECT SUM(quant_cotas)
                FROM apostas
                WHERE id_eventos_fk = :idEvento`,
                { idEvento: idEvento }
            );

            const pPremioTotal = selectPremioTotal.rows?.[0]?.[0];
            const premioTotal = Number(pPremioTotal);

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

            const selectCotacaoPorUsuario = await conn.execute(`
                SELECT id_usuarios_fk, SUM(quant_cotas) AS total_cotas
                FROM apostas
                WHERE id_eventos_fk = :idEvento
                AND palpite = :palpite`,
                {
                    idEvento: idEvento,
                    palpite: palpite
                }
            );

            const resultados = selectCotacaoPorUsuario.rows as Array<[number, number]>;
            const tamanho = resultados.length;
            for(let i=0; i<tamanho; i++){
                
                const idUser = resultados[i][0]; 
                const totalCotas = resultados[i][1];

                const novo_valor = (totalCotas/apostaVencedores)*premioTotal

                const arrayId = await conn.execute<any[]>(
                    `SELECT id
                    FROM carteira
                    WHERE id_usuarios_fk = :idUser`,
                    {idUser: idUser}
                );

                console.dir(arrayId.rows, {depth: null});
                
                const idCarteira = arrayId.rows?.[0]?.[0];
            
                await  conn.execute(
                    `UPDATE carteira
                    SET valor_total =  valor_total + :novo_valor
                    WHERE id_usuarios_fk = :idUser`,
                    {
                        novo_valor: novo_valor,
                        idUser: idUser
                    }
                );

                const transacaoRegistrada = await registrarTransacao(idCarteira, novo_valor, conn);

                if (transacaoRegistrada) {
                    await conn.commit();
                } else {
                    console.error('Erro ao registrar a transação.'); 
                    return false; 
                }
                
            }

            await  conn.execute(
                `UPDATE eventos
                SET status = 'suspenso'
                WHERE id = :idEvento`,
                {idEvento: idEvento}
            );
            return true;
            
            
        } catch (err) {
            console.error('Erro ao finalizar evento: ', err);
            await conn.rollback();
            return undefined;

        } finally {
            await conn.close();
        }
    }

    async function devolverApostas(pIdEvento: string): Promise<boolean | undefined> {
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            const idEvento = Number(pIdEvento);

            const selectCotacaoPorUsuario = await conn.execute(`
                SELECT id_usuarios_fk, SUM(quant_cotas) AS total_cotas
                FROM apostas
                WHERE id_eventos_fk = :idEvento
                GROUP BY id_usuarios_fk`,
                {
                    idEvento: idEvento
                }
            );

            const resultados = selectCotacaoPorUsuario.rows as Array<[number, number]>;
            const tamanho = resultados.length;
            for(let i=0; i<tamanho; i++){
                
                const idUser = resultados[i][0]; 
                const totalCotas = resultados[i][1];

                const novo_valor = totalCotas

                const arrayId = await conn.execute<any[]>(
                    `SELECT id
                    FROM carteira
                    WHERE id_usuarios_fk = :idUser`,
                    {idUser: idUser}
                );

                console.dir(arrayId.rows, {depth: null});
                
                const idCarteira = arrayId.rows?.[0]?.[0];
            
                await  conn.execute(
                    `UPDATE carteira
                    SET valor_total =  valor_total + :novo_valor
                    WHERE id_usuarios_fk = :idUser`,
                    {
                        novo_valor: novo_valor,
                        idUser: idUser
                    }
                );

                const transacaoRegistrada = await registrarTransacao(idCarteira, novo_valor, conn);

                if (transacaoRegistrada) {
                    await conn.commit();
                } else {
                    console.error('Erro ao registrar a transação.'); 
                    return false; 
                }
                
            }

            await  conn.execute(
                `UPDATE eventos
                SET status = 'suspenso'
                WHERE id = :idEvento`,
                {idEvento: idEvento}
            );

            return true;
            
        } catch (err) {
            console.error('Erro ao devolver apostas: ', err);
            await conn.rollback();
            return undefined;

        } finally {
            await conn.close();
        }
    }

    export const finishEventHandler: RequestHandler = async (req: Request, res: Response) => {

        const pIdEvento = req.get('idEvento');
        const pPalpite = req.get('palpiteGanhador');
        const pOcorreu = req.get('ocorreu');
        const isAdmin = req.session.isAdmin;

        if (isAdmin) {
            if (pIdEvento && pOcorreu && pPalpite) {
                if (pOcorreu === 'sim') {
                    const authData = await finalizarEvento(pIdEvento, pPalpite);
                    if (authData !== undefined) {
                        res.status(200).send('Evento finalizado com sucesso!');
                    } else {
                        res.status(500).send('Erro ao aprovar evento');
                    }
                } else if(pOcorreu === 'nao'){
                    const authData = await devolverApostas(pIdEvento);
                    if (authData !== undefined) {
                        res.status(200).send('Apostas devolvidas com sucesso!');
                    } else {
                        res.status(500).send('Erro ao devolver apostas');
                    }
                }else {
                    res.status(400).send('Evento não finalizado!');
                }
            } else {
                res.status(400).send('Faltando parametros');
            }
        } else {
            res.status(400).send('Necessário ser moderador para realizar essa ação!');
        }
    }
}