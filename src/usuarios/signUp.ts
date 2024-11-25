import { Request, RequestHandler, Response } from "express";
import { Connection } from "oracledb";
import { conexaoBD } from "../conexaoBD";
import { formatarData } from "../funcoes";

// Define um namespace chamado SignUpHandler
export namespace SignUpHandler {
    
    // Função assíncrona para inserir um novo usuário no banco de dados
    async function InserirUser(nome: string, email: string, senha: string, dataNasc: string): Promise<boolean | undefined | string> {

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
                return false; 
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
                return true;
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

    function verificarMaioridade(dataNascimento: string): boolean {
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        
        return idade >= 18;
    }

    // Função que lida com a requisição HTTP de registro de um novo usuário
    export const signUpHandler: RequestHandler = async (req: Request, res: Response) => {
        
        // Extrai os parâmetros necessários da requisição

        const { nome, email, senha,  dataNasc } = req.body;

        // Everifica se o usuario é maior de 18 anos
        if(!verificarMaioridade(dataNasc)){
            res.status(400).send("É necesario ser maior de 18 anos para realizar essa ação!");
        }

        // Verifica se todos os parâmetros estão presentes
        if (nome && email && senha && dataNasc) {


            const authData = await InserirUser(nome, email, senha, dataNasc);

            // Se o usuário foi inserido com sucesso, responde com uma mensagem de sucesso
            if(authData === false){
                res.status(400).send("Esse email ja possui um usuario vinculado!");
            }

            if (authData) {
                res.status(200).send(`Nova conta adicionada com sucesso!`);
            } else {
                res.status(500).send("Falha ao inserir novo ususario no sistema");  // Em caso de erro interno, retorna status 500
            }
        } else {
            res.status(400).send("Parâmetros inválidos ou faltantes.");  // Retorna erro caso algum parâmetro esteja ausente
        }
    }
}
