export async function  respostaSecao()  {
    try {
        const response = await fetch("/checkSession", { method: "GET", credentials: "include" });
        console.log("Resposta do servidor:", response); // Adicione esse log
        if (!response.ok) {
            window.location.assign("http://localhost:3000/home/index.html")
            return;
        }
        const data = await response.json(); // Obtém os dados do servidor

        const user = data.authData; // Obtem o objeto do usuário diretamente

        if (user) {
            const nome = user.NOME.split(' ')[0]; // Extrai o primeiro nome
            const saldo = user.VALOR_TOTAL; // Obtém o saldo da conta

            // Atualiza o saldo no HTML
            const saldoContaElement = document.querySelector('.valor-conta');
            if (saldoContaElement) {
                saldoContaElement.textContent = `R$ ${saldo.toFixed(2)}`; // Formata o saldo como valor monetário
            }

            // Atualiza o nome no HTML
            const nomeUserElement = document.querySelector('.nome-user');
            if (nomeUserElement) {
                nomeUserElement.textContent = `Olá, ${nome}`;
            }

            if (user.ISADMIN === 1) {
                const adminElements = document.querySelectorAll('.admin');
                adminElements.forEach((element) => {
                    element.style.display = 'block';
                });
            }
        }

    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        return false;
    }
};