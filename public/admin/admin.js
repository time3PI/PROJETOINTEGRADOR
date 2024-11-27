import { respostaSecao } from "../funcoes.js";
document.addEventListener('DOMContentLoaded', () => {
    respostaSecao();
    categorySelect.dispatchEvent(new Event('change'));
});

const gridTable = document.getElementById("grid-table");
const notification = document.getElementById("notification");
const notificationError = document.getElementById("notification-error");
const rejectModal = new bootstrap.Modal(document.getElementById("rejectModal"));
const finishModal = new bootstrap.Modal(document.getElementById("finishModal"));
let currentCard = null; // Variável global para armazenar o cartão atual

// Aprovar evento
gridTable.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-approve")) {
        const card = e.target.closest(".card-item");
        card.remove();
        showNotification("Evento aprovado!");
    }
});

gridTable.addEventListener('click', async (event) => {
    if (event.target.classList.contains("btn-approve")) {
        const eventId = event.target.getAttribute('data-event-id');
        document.getElementById('eventId').value = eventId;

        if (confirm('Você tem certeza de que deseja aprovar este evento?')) {
            try {
                const opcao = 'aprovar';
                const response = await fetch(`http://localhost:3000/evaluateNewEvent`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        opcao,
                        idEvento: eventId
                    })
                });

                if (response.ok) {
                    showNotification("Evento aprovado!");
                    window.location.reload();
                } else {
                    const errorMessage = await response.text();
                    showNotificationError(errorMessage);
                }
            } catch (error) {
                console.error("Erro ao aprovar evento:", error);
            }
        }
    }
});


gridTable.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-reject")) {
        currentCard = e.target.closest(".card-item"); // Atualiza o cartão atual

        // Pegando os textos dos parágrafos específicos
        const paragraphs = currentCard.querySelectorAll("p");
        const eventText = paragraphs[0].textContent.replace("Evento:", "").trim();
        const descriptionText = paragraphs[1].textContent.replace("Descrição:", "").trim();

        rejectModal.show();
    }
    if (e.target.classList.contains("btn-finalize")) {
        currentCard = e.target.closest(".card-item"); // Atualiza o cartão atual

        // Pegando os textos dos parágrafos específicos
        const paragraphs = currentCard.querySelectorAll("p");
        const eventText = paragraphs[0].textContent.replace("Evento:", "").trim();
        const descriptionText = paragraphs[1].textContent.replace("Descrição:", "").trim();

        finishModal.show();
    }
});

// Confirmar reprovação
document.getElementById("confirm-reject").addEventListener("click", async () => {
    const textoReprovacao = document.getElementById("rejection-reason").value;
    if (textoReprovacao.trim()) {
        const eventId = currentCard?.querySelector(".btn-reject")?.getAttribute("data-event-id");
        document.getElementById('eventId').value = eventId;
        try {
                const response = await fetch(`http://localhost:3000/evaluateNewEvent`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        opcao: "reprovar",
                        idEvento: eventId,
                        textoReprovacao: textoReprovacao
                    })
                });

                if (response.ok) {
                    finishModal.hide(); // Fecha o modal
                    showNotification("Evento Finalizado!");
                    window.location.reload();
                } else {
                    const errorMessage = await response.text();
                    showNotificationError(errorMessage); 
                }
        } catch (error) {
            console.error("Erro ao reprovar evento:", error);
        }
        

    } else {
        alert("Por favor, informe o motivo da reprovação.");
    }
});


document.getElementById("confirm-finish").addEventListener("click", async () => {
    const betChoice = document.getElementById("betChoice").value;
    if (betChoice) {
        const eventId = currentCard?.querySelector(".btn-finalize")?.getAttribute("data-event-id");
        document.getElementById('eventId').value = eventId;
        try {
                const response = await fetch(`http://localhost:3000/finishEvent`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        opcao: "reprovar",
                        idEvento: eventId,
                        palpite: betChoice,
                    })
                });

                if (response.ok) {
                    finishModal.hide(); // Fecha o modal
                    showNotification("Evento Finalizado!");
                    window.location.reload();
                } else {
                    const errorMessage = await response.text();
                    showNotificationError(errorMessage); 
                }

        } catch (error) {
            showNotificationError(error); 
        }
        

    } else {
        showNotificationError("Por favor, informe o palpite ganhador.");
    }   
});



// Exibir notificação
function showNotification(message) {
    notification.textContent = message;
    notification.style.display = "block";
    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}   

function showNotificationError(message) {
    notificationError.textContent = message;
    notificationError.style.display = "block";
    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}

let cards = []; // Agora esta variável vai armazenar os cards
let filteredItems = []; // Cards filtrados
const cardsPerPage = 9; // Número de cards por página
let currentPage = 1; // Página atual

// Atualiza a exibição dos cards
function showCards(page) {
    const startIndex = (page - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;

    // Exibe apenas os cards da página atual
    filteredItems.forEach((card, index) => {
        if (index >= startIndex && index < endIndex) {
            card.style.display = 'block'; // Exibe o card
        } else {
            card.style.display = 'none'; // Oculta o card
        }
    });

    updatePagination(page); // Atualiza a paginação
}

// Atualiza a paginação
function updatePagination(page) {
    const totalPages = Math.ceil(filteredItems.length / cardsPerPage);

    // Limpa os números de páginas existentes
    const pagination = document.getElementById('pagination');
    pagination.querySelectorAll('.page-number').forEach((el) => el.remove());

    // Gerar números de página
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.classList.add('page-item', 'page-number');
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;

        // Adiciona evento de navegação para cada número de página
        pageItem.addEventListener('click', () => {
            currentPage = i;
            showCards(currentPage);
        });

        pagination.insertBefore(pageItem, document.getElementById('next-page'));
    }

    // Ativar/desativar os botões de "Anterior" e "Próximo"
    document.getElementById('prev-page').classList.toggle('disabled', page === 1);
    document.getElementById('next-page').classList.toggle('disabled', page === totalPages);
}

// Adicionar eventos aos botões de navegação
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        showCards(currentPage);
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredItems.length / cardsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        showCards(currentPage);
    }
});

// Função de renderização de eventos
function renderEvents(events, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const selectedCategory = categorySelect.value.toLowerCase(); // Obtém a categoria selecionada no dropdown

    container.innerHTML = ''; // Limpa os eventos existentes
    cards = []; // Reinicia a lista de cards
    filteredItems = []; // Reinicia os cards filtrados

    events.forEach(event => {
        // Define os botões com base na categoria selecionada
        let buttonsHTML = '';
        if (selectedCategory === 'avaliar') {
            buttonsHTML = `
                <button class="btn btn-gradient btn-approve" data-event-id="${event.id}">Aprovar</button>
                <button class="btn btn-gradient btn-reject" data-event-id="${event.id}">Reprovar</button>
            `;
        } else if (selectedCategory === 'finalizar') {
            buttonsHTML = `
                <button class="btn btn-gradient btn-finalize" data-event-id="${event.id}">Finalizar</button>
            `;
        }

        const cardHTML = `
            <div class="card-item" data-category="${event.categoria}">
                <h5>${event.titulo}</h5>
                <p>Data início Apostas: ${new Date(event.data_inicio_apostas).toLocaleString('pt-BR')}</p>
                <p>Data fim: ${new Date(event.data_fim_apostas).toLocaleString('pt-BR')}</p>
                <p>Categoria: ${event.categoria}</p>
                <p>Descrição: ${event.desc}</p>
                ${buttonsHTML} <!-- Botões dinâmicos -->
            </div>
        `;
        container.innerHTML += cardHTML;
    });

    // Atualiza as variáveis de cards
    cards = Array.from(container.getElementsByClassName('card-item'));
    filteredItems = cards; // Inicialmente, todos os cards são filtrados

    showCards(currentPage); // Chama showCards para exibir a primeira página
}


// Função de filtragem
const filterInput = document.getElementById('filter');
const categorySelect = document.getElementById('category-select');

filterInput.addEventListener('keyup', function () {
    const filterValue = filterInput.value.toLowerCase(); // Texto do input
    filteredItems = cards.filter(card => {
        const cardText = card.textContent.toLowerCase(); // Conteúdo textual do card
        return cardText.includes(filterValue); // Filtrar pelo texto
    });

    // Verificação de resultado vazio
    if (filteredItems.length === 0) {
        console.warn('Nenhum card encontrado para o filtro:', filterValue);
    }

    currentPage = 1; // Reiniciar para a primeira página
    showCards(currentPage); // Atualizar exibição
});

categorySelect.addEventListener('change', function () {
    const selectedCategory = categorySelect.value.toLowerCase();
    filteredItems = cards.filter(card => {
        const category = card.getAttribute('data-category').toLowerCase();
        return selectedCategory === '' || category === selectedCategory; // Filtra cards pela categoria
    });
    currentPage = 1; // Reinicia para a primeira página
    showCards(currentPage); // Atualiza a exibição com a nova filtragem
});

// Chamada para buscar e renderizar eventos
async function fetchEvents(filtro, containerSelector) {
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
            status: event[6],
            categoria: event[7],
        }));

        renderEvents(events, containerSelector); // Renderiza os eventos após o fetch

    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
    }
}

categorySelect.addEventListener('change', function () {
    const selectedCategory = categorySelect.value.toLowerCase();

    if (selectedCategory === 'avaliar') {
        // Realiza o fetch com o filtro 12
        fetchEvents('12', '.grid-table');
    } else if (selectedCategory === 'finalizar') {
        // Realiza o fetch com o filtro 11
        fetchEvents('11', '.grid-table');
    } else if (selectedCategory === '') {
        // Mensagem informando que é necessário selecionar uma opção
        alert('Por favor, selecione uma função.');
    } else {
        // Caso o valor selecionado não seja 'avaliar' nem 'finalizar'
        alert('Selecione uma das opções válidas: Avaliar ou Finalizar.');
    }
});