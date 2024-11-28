import OracleDB, { Connection } from "oracledb"

export function formatarData(pData: string): string {
    if (!pData) {
        console.error("Data inválida:", pData);
        return "";
    }

    const data = new Date(pData);
    if (isNaN(data.getTime())) {
        console.error("Erro ao interpretar a data:", pData);
        return "";
    }

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(pData: string, pHora: string): string {
    const data = new Date(`${pData}T${pHora}`);
    
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano} ${horas}:${minutos}:00`;
}

export async function tokenParaId(token: string, conn: Connection):  Promise<number | undefined >{

    try {
        const result = await conn.execute(
            `SELECT id_usuario
            from usuario
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
