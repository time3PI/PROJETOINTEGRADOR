document.addEventListener("DOMContentLoaded", respostaSecao);

async function  respostaSecao()  {
    try {
        const response = await fetch("/checkSession", { method: "GET", credentials: "include" });
        console.log("Resposta do servidor:", response); // Adicione esse log
        if (response.ok) {
            window.location.assign("http://localhost:3000/home/indexlog.html")
        }
    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        return false;
    }
};