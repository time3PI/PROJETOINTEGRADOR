import { Request, RequestHandler, Response } from "express";
import { Connection } from "oracledb";
import { conexaoBD } from "../conexaoBD";
import { formatarData } from "../funcoes";

// Define um namespace chamado SignUpHandler
export namespace SignUpHandler {
    
    // Define um tipo contaUsuario para representar a conta do usuário
    export type contaUsuario = {
        token : string | undefined;     // O token de autenticação do usuário
        isAdmin : boolean | undefined;  // Indica se o usuário é administrador
    };

    // Função assíncrona para inserir um novo usuário no banco de dados
    async function InserirUser(nome: string, email: string, senha: string, dataNasc: string): Promise< contaUsuario[] | undefined > {

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
                FROM usuario
                where email = :email`,
                [email]
            );

            const linhas = result.rows;
            
            // console.dir(result.rows, {depth: null});

            // Se o email já estiver vinculado a um usuário, retorna false
            if (linhas && linhas.length > 0) {
                console.error('Este email já possui um usuário vinculado!');
                    return [{
                        token: '404',            
                        isAdmin:  false,    
                    }];

            } else {

                // Formata a data de nascimento do usuario para o banco de dados
                dataNasc = formatarData(dataNasc);

                // Caso contrário, insere o novo usuário no banco de dados
                await conn.execute(
                    `INSERT INTO usuario (id_usuario, email, senha, nome, data_nasc, isAdmin, token) 
                    VALUES (seq_id_user.NEXTVAL, :email, :senha, :nome, TO_DATE(:dataNascimento, 'DD/MM/YYYY'), 0, dbms_random.string('x',10))`,
                    {
                        email: email,
                        senha: senha,
                        nome: nome,
                        dataNascimento: dataNasc
                    }
                );

               
                await conn.commit();  // Confirma a transação caso a carteira seja criada com sucesso

                const result = await conn.execute(
                    `SELECT token, isAdmin
                    FROM usuario
                    where email = :email and senha = :senha`,
                    [email, senha]
                );
    
                // console.dir(result, {depth: null});
    
                // Converte o resultado em uma lista de arrays contendo token e isAdmin
                const rows = result.rows as Array<[string, number]>; 
    
                // Se houver resultados, cria e retorna um objeto contaUsuario
                if (rows && rows.length > 0) {
                    let tokenIsAdmin = rows[0];
                    return [{
                        token: tokenIsAdmin[0],            // Token do usuário
                        isAdmin: tokenIsAdmin[1] === 1     // Converte 1 para true (usuário admin)
                    }];
                } else {
                    return undefined;  // Retorna indefinido se o usuário não for encontrado
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

        const { nome, email, senha,  dataNasc } = req.body;
        
        // Verifica se todos os parâmetros estão presentes
        if (nome && email && senha && dataNasc) {

            let authData : contaUsuario[] | undefined = [] ;
            authData = await InserirUser(nome, email, senha, dataNasc);
            

            if (authData) {

                // Se o usuário foi inserido com sucesso, responde com uma mensagem de sucesso
                if(authData[0].token === '404'){
                    res.status(400).send("Esse email ja possui um usuario vinculado!");
                }
            
                req.session.token = authData[0].token;
                req.session.isAdmin = authData[0].isAdmin;
                res.status(200).send(`Nova conta adicionada com sucesso!`);
            } else {
                res.status(500).send("Falha ao inserir novo ususario no sistema");  // Em caso de erro interno, retorna status 500
            }
        } else {
            res.status(400).send("Parâmetros inválidos ou faltantes.");  // Retorna erro caso algum parâmetro esteja ausente
        }
    }
}
