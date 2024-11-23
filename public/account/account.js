    document.addEventListener('DOMContentLoaded', () => {
        respostaSecao();
    });

    async function respostaSecao() {
        try {
            const response = await fetch("/checkSession", { method: "GET", credentials: "include" });
            console.log("Resposta do servidor:", response); // Adicione esse log

            if (!response.ok) {
                window.location.assign("http://localhost:3000/home/index.html")
                return;
            }

            const data = await response.json(); 

            const user = data.authData; 

            if (user) {
                const nome = user.NOME.split(' ')[0]; 
                const saldo = user.VALOR_TOTAL; 
                const email = user.EMAIL; 
                const transacoes = data.transactions || []; // Assumindo que transações estão em `data.transactions`

                // Atualiza todos os elementos com a classe 'valor-conta'
                const saldoContaElements = document.querySelectorAll('.valor-conta');
                saldoContaElements.forEach(element => {
                    element.textContent = `R$ ${saldo.toFixed(2)}`; // Formata o saldo como valor monetário
                });

                // Atualiza todos os elementos com a classe 'nome-user'
                const nomeUserElements = document.querySelectorAll('.nome-user');
                nomeUserElements.forEach(element => {
                    element.textContent = `Olá, ${nome}`;
                });

                // Atualiza todos os elementos com a classe 'email-user'
                const emailUserElements = document.querySelectorAll('.email-user');
                emailUserElements.forEach(element => {
                    element.textContent = `${email}`; 
                });

                const transactionHistoryElement = document.querySelector('.transaction-history .scrollable');

                if (transactionHistoryElement) {
                    transactionHistoryElement.innerHTML = ""; // Limpa as transações antigas

                    if (transacoes.length > 0) {
                        transacoes.forEach(transacao => {
                            const dataTransacao = new Date(transacao.dataTransacao).toLocaleDateString(); // Corrige o campo de data
                            const tipoTransacao = transacao.tipo.toUpperCase(); // Usa o campo `tipo`
                            const valorTransacao = transacao.valor.toFixed(2); // Usa o campo `valor`

                            // Cria um novo elemento para exibir a transação
                            const transacaoElement = document.createElement('p');
                            transacaoElement.textContent = `${tipoTransacao} (${dataTransacao}): R$ ${valorTransacao}`;
                            transactionHistoryElement.appendChild(transacaoElement);
                        });
                    } else {
                        const emptyMessage = document.createElement('p');
                        emptyMessage.textContent = "Nenhuma transação nos últimos 60 dias.";
                        transactionHistoryElement.appendChild(emptyMessage);
                    }
                }

            }
        } catch (error) {
            console.error("Erro ao verificar sessão:", error);
            return false;
        }
    }
