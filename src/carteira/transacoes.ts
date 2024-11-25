import { Connection } from "oracledb";

// Função responsável por registrar uma transação na tabela de transações associada a uma carteira específica.
export async function registrarTransacao(pIdCarteira: number, valor: number, conn: Connection, tipo: string): Promise<boolean | undefined> {

    try {
        // Converte o ID da carteira para número.
        const idCarteira = Number(pIdCarteira);

        // Insere uma nova transação na tabela `transacoes` com um ID gerado automaticamente,
        // valor da transação, data atual como `data_transacao`, tipo da transação e referência ao ID da carteira.
        await conn.execute(
            `INSERT INTO transacao (id_transacao, valor_total, data_transacao, tipo, id_carteira_fk) 
            VALUES (seq_id_transacao.NEXTVAL, :valor, TO_DATE(SYSDATE, 'DD/MM/YYYY'), :tipo, :idCarteira)`,
            {
                valor: valor,            // Valor da transação
                idCarteira: idCarteira,   // ID da carteira associada
                tipo: tipo                // Tipo de transação (por exemplo, "lucro")
            }
        );

        // Confirma a transação no banco de dados.
        await conn.commit();
        return true;
        
    } catch (err) {
        // Em caso de erro, exibe a mensagem no console e realiza rollback para desfazer as operações.
        console.error('Erro ao registrar transação: ', err);
        await conn.rollback();
        return undefined;
    }
}
