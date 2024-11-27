import { Request, RequestHandler, Response } from "express";
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { conexaoBD } from "../conexaoBD";
import { Connection } from "oracledb";

dotenv.config(); // Carrega as variáveis de ambiente do arquivo .env

// Define o namespace para o manipulador de avaliação de eventos
export namespace evalueateEventsHandler {

    // Função para aprovar um evento
    async function aprovarEvento(idEvento: string): Promise<boolean | undefined> {
        let conn = await conexaoBD();  // Abre conexão com o banco de dados

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            // Atualiza o status do evento para 'aprovado'
            await conn.execute(
                `UPDATE evento
                SET status = 'aprovado'
                WHERE id_evento = :idEvento AND status = 'aguarda aprovação'`,
                {
                    idEvento: idEvento,
                }
            );

            await conn.commit();  // Confirma a transação
            return true;

        } catch (err) {
            // Trata erros e realiza o rollback da transação
            console.error('Erro ao aprovar evento: ', err);
            await conn.rollback();
            return undefined;

        } finally {
            await conn.close();  // Fecha a conexão
        }
    }

    // Função para enviar um e-mail de reprovação ao usuário responsável pelo evento
    async function emailReprovacao(idEvento: string, textoReprovacao: string, conn: Connection): Promise<boolean> {

        try {
            // Obtém o título do evento e o ID do usuário criador do evento
            const IdUserTituloEventoResult = await conn.execute<any[]>(
                `SELECT titulo, id_usuario_fk
                FROM evento
                WHERE id_evento = :idEvento`,
                {
                    idEvento: idEvento,
                }
            );

            const rows = IdUserTituloEventoResult.rows as Array<[string, number]>;
            if (!rows || rows.length === 0) {
                console.error('Evento não encontrado.');
                return false;
            }

            const [titulo, idUserEvento] = rows[0];

            // Obtém o e-mail do usuário que criou o evento
            const emailUserResult = await conn.execute<any[]>(
                `SELECT email
                FROM usuario
                WHERE id_usuario = :idUserEvento`,
                {
                    idUserEvento: idUserEvento,
                }
            );

            const linhas = emailUserResult.rows;
            if (!linhas || linhas.length === 0) {
                console.error('Email do usuário não encontrado.');
                return false;
            }

            const emailUser = linhas[0]?.[0];
            // Configura o serviço de envio de e-mail com Nodemailer
            const emissor = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.GMAIL_EMAIL,
                    pass: process.env.SENHA_EMAIL,
                }
            });

            // Define o conteúdo do e-mail de reprovação
            const opEmail = {
                from: process.env.GMAIL_EMAIL,
                to: emailUser,
                subject: `Seu Evento ${titulo} foi Reprovado!`,
                text: textoReprovacao,
            };

            // Envia o e-mail
            await emissor.sendMail(opEmail);

            return true;
        } catch (err) {
            console.error('Erro ao enviar email: ', err);
            return false;
        }
    }

    // Função para reprovar um evento e enviar um e-mail ao usuário
    async function reprovarEvento(idEvento: string, textoReprovacao: string): Promise<boolean | undefined> {
        let conn = await conexaoBD();  // Abre conexão com o banco de dados

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            // Atualiza o status do evento para 'suspenso'
            await conn.execute(
                `UPDATE evento
                SET status = 'suspenso'
                WHERE id_evento = :idEvento AND status = 'aguarda aprovação'`,
                {
                    idEvento: idEvento,
                }
            );

            // Envia o e-mail de reprovação
            const EmailEnviado = await emailReprovacao(idEvento, textoReprovacao, conn);
            if (EmailEnviado) {
                await conn.commit();  // Confirma a transação se o e-mail foi enviado
                return true;
            } else {
                console.error('Falha ao enviar o email de reprovação.');
                await conn.rollback();  // Realiza rollback se o envio do e-mail falhar
                return false;
            }
        } catch (err) {
            console.error('Erro ao reprovar evento: ', err);
            await conn.rollback();
            return undefined;

        } finally {
            await conn.close();  // Fecha a conexão
        }
    }

    // Manipulador de requisição HTTP para aprovação/reprovação de eventos
    export const evalueateEventsHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        try {
            const { opcao, idEvento, textoReprovacao } = req.body;
            const isAdmin = req.session.isAdmin; // Verifica se o usuário é moderador
    
            if (!isAdmin) {
                res.status(403).send('Acesso negado. Apenas moderadores podem avaliar eventos.');
                return;
            }
    
            if (!idEvento || !opcao) {
                res.status(400).send('Faltando parâmetros obrigatórios.');
                return;
            }
    
            if (opcao === 'aprovar') {
                const authData = await aprovarEvento(idEvento);
                if (authData) {
                    res.status(200).send('Evento aprovado com sucesso!');
                } else {
                    console.error(`Erro ao aprovar evento com id ${idEvento}`);
                    res.status(500).send('Erro ao aprovar evento');
                }
            } else if (opcao === 'reprovar') {
                if (!textoReprovacao) {
                    res.status(400).send('Texto de reprovação é obrigatório.');
                    return;
                }
    
                const authData = await reprovarEvento(idEvento, textoReprovacao);
                if (authData) {
                    res.status(200).send('Evento reprovado com sucesso!');
                } else {
                    console.error(`Erro ao reprovar evento com id ${idEvento}`);
                    res.status(500).send('Erro ao reprovar evento');
                }
            } else {
                res.status(400).send('Opção inválida.');
            }
        } catch (err) {
            console.error('Erro inesperado ao avaliar evento:', err);
            res.status(500).send('Erro interno do servidor.');
        }
    }
    
}
