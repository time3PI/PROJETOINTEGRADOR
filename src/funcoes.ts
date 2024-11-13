import OracleDB, { Connection } from "oracledb"


export function formatarData(pData: string): string {
    const data = new Date(pData);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

export async function tokenParaId(token: string, conn: Connection):  Promise<number | undefined >{

    try {
        const result = await conn.execute(
            `SELECT id from usuarios
            where token = :token`,
            {
                token: { val: token },
            }
        );

        const rows = result.rows as Array<[number]>; 

        if (!rows || rows.length === 0) {
            throw new Error('Usuário não encontrado para o token fornecido');
        }

        const idUser = rows[0][0]

        return idUser;
    } catch (err) {
        console.error('Erro ao buscar id por token: ', err);
        return undefined;
    }
}