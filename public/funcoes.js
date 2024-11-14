export async function checkUserSession() {
    try {
        const response = await fetch("/checkSession", { method: "GET", credentials: "include" });
        console.log("Resposta do servidor:", response); // Adicione esse log
        if (response.ok) {
            const data = await response.json();
            console.log("Dados da sessão:", data); // Verifique os dados recebidos
            return true;
        } else {
            console.log("Erro ao verificar a sessão: resposta não OK");
            return false;
        }
    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        return false;
    }
}
