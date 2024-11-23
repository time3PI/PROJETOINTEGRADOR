document.addEventListener('DOMContentLoaded', () => {
    respostaSecao();
    fetchEvents('1', '.populares'); // Eventos mais populares
    fetchEvents('2', '.vencimento');
});

async function  respostaSecao()  {
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
        }

    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        return false;
    }
};

export async function fetchEvents(filtro, containerSelector) {
    try {
        const response = await fetch(`http://localhost:3000/getEvents?pFiltro=${filtro}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar eventos');
        }
        const data = await response.json();
        const events = data.authData.map(event => ({
            id: event[0],
            titulo: event[1],
            desc: event[2],
            data_inicio: event[3],
            data_inicio_apostas: event[4],
            data_fim_apostas: event[5],
        }));
        renderEvents(events, containerSelector);
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
    }
}

function renderEvents(events, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = ''; // Reseta o conteúdo inicial.

    events.forEach(event => {
        const cardHTML = `
            <div class="col-md-4 event-card">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${event.titulo}</h5>
                        <p class="card-text">Data início Apostas: ${new Date(event.data_inicio_apostas).toLocaleString('pt-BR')}</p>
                        <p class="card-text">Data fim: ${new Date(event.data_fim_apostas).toLocaleString('pt-BR')}</p>
                        <p class="card-text">${event.desc}</p>
                        <button class="button" data-bs-toggle="modal" data-bs-target="#apostarModal">Apostar Agora</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}
