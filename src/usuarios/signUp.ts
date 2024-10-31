import { Request, RequestHandler, Response } from "express";
import { Connection } from "oracledb";
import { conexaoBD } from "../conexaoBD";

// Define um namespace chamado SignUpHandler
export namespace SignUpHandler {
    
    // Função assíncrona para criar uma carteira para o usuário no banco de dados
    async function criarCarteira(email: string, conn: Connection): Promise< boolean | undefined >{

        try {
            // Consulta o ID do usuário com base no email fornecido
            const selectIdUser = await conn.execute<any[]>(
                `SELECT id
                FROM usuarios
                where email = :email`,
                {email}
            );
            
            // Extrai o ID da primeira linha de resultado
            const id = selectIdUser.rows?.[0]?.[0]; 
            
            console.dir(selectIdUser.rows, {depth: null});  // Exibe as linhas retornadas para depuração

            // Verifica se o ID foi encontrado; caso contrário, o email não está vinculado a um usuário
            if (!id) {
                console.error('Este email não possui um usuário vinculado!');
                return false;
            }

            // Insere uma nova carteira para o usuário com o ID encontrado
            await conn.execute(
                `INSERT INTO carteira (id, valor_total, id_usuarios_fk) 
                VALUES (seq_id_carteira.NEXTVAL, :valor_total, :id)`,
                {
                    valor_total: 0,   // Define o saldo inicial da carteira como 0
                    id: id            // Usa o ID do usuário como chave estrangeira
                }
            );
        
            await conn.commit();  // Confirma a transação no banco
            return true;

        } catch (err) {
            // Em caso de erro, faz o rollback das alterações no banco
            console.error('Erro ao cadastrar carteira: ', err);
            await conn.rollback();
            return undefined;
        }
    }

    // Função assíncrona para inserir um novo usuário no banco de dados
    async function InserirUser(nome: string, email: string, senha: string, dataNasc: string): Promise<boolean | undefined> {

        // Estabelece a conexão com o banco de dados
        let conn = await conexaoBD();

        if (!conn) {
            console.error('Falha na conexão com o banco de dados.');
            return undefined;
        }

        try {
            // Verifica se o email já está cadastrado
            const result = await conn.execute(
                `SELECT *
                FROM usuarios
                where email = :email`,
                [email]
            );

            const linhas = result.rows;
            
            // console.dir(result.rows, {depth: null});

            // Se o email já estiver vinculado a um usuário, retorna false
            if (linhas && linhas.length > 0) {
                console.error('Este email já possui um usuário vinculado!');
                return false; 
            } else {
                // Caso contrário, insere o novo usuário no banco de dados
                await conn.execute(
                    `INSERT INTO usuarios (id, email, senha, nome, data_nasc, isAdmin, token) 
                    VALUES (seq_id_user.NEXTVAL, :email, :senha, :nome, TO_DATE(:dataNascimento, 'DD/MM/YYYY'), 0, dbms_random.string('x',10))`,
                    {
                        email: email,
                        senha: senha,
                        nome: nome,
                        dataNascimento: dataNasc
                    }
                );

                // Cria uma carteira para o novo usuário
                const carteiraCriada = await criarCarteira(email, conn);

                if(carteiraCriada) {
                    await conn.commit();  // Confirma a transação caso a carteira seja criada com sucesso
                    return true;
                } else {
                    // Em caso de falha na criação da carteira, faz o rollback das alterações
                    console.error('Erro: usuário não criado.');
                    await conn.rollback();
                    return true;
                }
            }

        } catch (err) {
            // Lida com erros durante o processo de inserção do usuário
            console.error('Erro ao cadastrar usuário: ', err);
            await conn.rollback();  // Faz o rollback em caso de erro
            return undefined;

        } finally {
            // Fecha a conexão com o banco de dados
            await conn.close();
        }
    }

    // Função que lida com a requisição HTTP de registro de um novo usuário
    export const signUpHandler: RequestHandler = async (req: Request, res: Response) => {
        
        // Extrai os parâmetros necessários da requisição
        const pNome = req.get('nome');
        const pEmail = req.get('email');
        const pSenha = req.get('senha');
        const pDataNasc = req.get('dataNasc');

        // Verifica se todos os parâmetros estão presentes
        if (pNome && pEmail && pSenha && pDataNasc) {
            const authData = await InserirUser(pNome, pEmail, pSenha, pDataNasc);

            // Se o usuário foi inserido com sucesso, responde com uma mensagem de sucesso
            if (authData !== undefined && authData !== false) {
                res.status(200).send(`Nova conta adicionada com sucesso!`);
            } else {
                res.status(500).send("Falha ao inserir dados no sistema");  // Em caso de erro interno, retorna status 500
            }
        } else {
            res.status(400).send("Parâmetros inválidos ou faltantes.");  // Retorna erro caso algum parâmetro esteja ausente
        }
    }
}
