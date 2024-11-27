import { respostaSecao } from "../funcoes.js";

document.addEventListener('DOMContentLoaded', () => {
    respostaSecao();
    
    // Função para obter o valor de um parâmetro da URL
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Obtém o parâmetro 'categoria' da URL
    const categoriaInicial = getQueryParam('categoria') || "todos"; // Default para "todos" caso o parâmetro não exista

    // Define o valor inicial do seletor de categorias com base no parâmetro da URL
    const categorySelect = document.getElementById("category-select");
    if (categorySelect) {
        categorySelect.value = categoriaInicial; // Ajusta a seleção
    }

    // Chama fetchEvents com a categoria inicial
    fetchEvents(categoriaInicial, '.grid-table');
    
    // Evento para mudança de categoria (já existente)
    categorySelect.addEventListener("change", (event) => {
        const novoFiltro = event.target.value || "todos";
        fetchEvents(novoFiltro, '.grid-table');
    });

    document.querySelectorAll('.available-events').forEach(container => {
        container.addEventListener('click', (event) => {
            // Verifica se o clique foi em um botão com a classe 'bet-button'
            if (event.target && event.target.classList.contains('bet-button')) {
                const eventId = event.target.getAttribute('data-event-id');
                document.getElementById('eventId').value = eventId;  // Preenche o campo com o id do evento
            }
        });
    });

});

const notification = document.getElementById("notification");
const notificationError = document.getElementById("notification-error");

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

// Seleciona elementos necessários
const filterInput = document.getElementById('filter');
const categorySelect = document.getElementById('category-select');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const gridTable = document.querySelector('.grid-table');
let cardItems = Array.from(gridTable.getElementsByClassName('card-item'));

let filteredItems = []; // Lista dinâmica de itens filtrados
const itemsPerPage = 9; // Limite de itens por página
let currentPage = 1; // Página atual

filterInput.addEventListener('keyup', function () {
    if(filterInput.value){
        const filterValue = filterInput.value.toLowerCase();
        cardItems.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(filterValue) ? 'block' : 'none';
        });
    }else{
        renderPage(currentPage);
    }
});

categorySelect.addEventListener('change', updateFilteredItems);

function renderEvents(events, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = ''; // Limpa os eventos existentes

    events.forEach(event => {
        const deleteButtonHTML = event.status === 'aguarda aprovação' ? 
            `<button class="delete-button" data-event-id="${event.id}">Suspender</button>` : '';

        const cardHTML = `
            <div class="card-item" data-category="${event.categoria}">
                <h5>${event.titulo}</h5>
                <p>Data início Apostas: ${new Date(event.data_inicio_apostas).toLocaleString('pt-BR')}</p>
                <p>Data fim: ${new Date(event.data_fim_apostas).toLocaleString('pt-BR')}</p>
                <p>Categoria: ${event.categoria}</p>
                <p>${event.desc}</p>
                <button class="bet-button" data-bs-toggle="modal" data-bs-target="#betModal" data-event-id="${event.id}">Apostar</button>
                ${deleteButtonHTML}
            </div>
        `;
        container.innerHTML += cardHTML;
    });

    // Atualiza cardItems após renderizar os eventos
    cardItems = Array.from(container.getElementsByClassName('card-item'));

    // Atualiza filteredItems após renderizar os eventos
    filteredItems = cardItems; // Todos os itens são inicialmente filtrados

    renderPage(currentPage); // Chama renderPage para exibir os itens da página
}

function updateFilteredItems() {
    const filterValue = filterInput.value.toLowerCase();
    const selectedCategory = categorySelect.value.toLowerCase();

    // Filtra os itens com base no texto e na categoria selecionada
    filteredItems = cardItems.filter(card => {
        const text = card.textContent.toLowerCase();
        const category = card.getAttribute('data-category').toLowerCase();

        const matchesText = text.includes(filterValue);
        const matchesCategory = selectedCategory === '' || selectedCategory === 'todos' || category === selectedCategory;

        return matchesText && matchesCategory;
    });

    // Reinicia a paginação na página 1 após a filtragem
    currentPage = 1;
    renderPage(currentPage);
}


function renderPage(page) {
    const start = (page - 1) * itemsPerPage;  // Índice inicial
    const end = start + itemsPerPage;        // Índice final
    
    // Exibe apenas os itens da página atual
    filteredItems.forEach((card, index) => {
        card.style.display = index >= start && index < end ? 'block' : 'none';
    });

    // Atualiza os botões de navegação
    prevPageButton.disabled = page === 1; // Desabilita botão de "Página Anterior" se estiver na primeira página
    nextPageButton.disabled = end >= filteredItems.length; // Desabilita botão de "Próxima Página" se não houver mais itens

    // Atualiza o texto de informações da página
    pageInfo.textContent = `Página ${page} de ${Math.ceil(filteredItems.length / itemsPerPage)}`;
}



// Controles de paginação
prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
});

nextPageButton.addEventListener('click', () => {
    if (currentPage * itemsPerPage < filteredItems.length) {
        currentPage++;
        renderPage(currentPage);
    }
});

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

        // Verifica se é admin e exibe elementos específicos para admins
        if (data.isAdmin === 1) {
            const adminElements = document.querySelectorAll('.admin');
            adminElements.forEach((element) => {
                element.style.display = 'block';
            });
        }

        // Converte os dados para o formato necessário
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

        // Renderiza os eventos na interface
        renderEvents(events, containerSelector);

        // Atualiza as listas de itens
        cardItems = Array.from(document.querySelector(containerSelector).getElementsByClassName('card-item'));
        filteredItems = cardItems; // Inicialmente, todos os itens são considerados filtrados

        // Reinicia a paginação na página 1
        currentPage = 1;
        renderPage(currentPage);

    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
    }
}


// Adiciona eventos de clique aos botões "Apostar"
document.querySelector('.grid-table').addEventListener('click', async  (event) => {
    if (event.target && event.target.classList.contains('bet-button')) {
        const eventId = event.target.getAttribute('data-event-id');
        document.getElementById('eventId').value = eventId;
    }else if (event.target && event.target.classList.contains('delete-button')) {
        const eventId = event.target.getAttribute('data-event-id');
        
        // Solicita confirmação antes de deletar o evento
        if (confirm('Você tem certeza de que deseja deletar este evento?')) {
            try {
                const response = await fetch(`http://localhost:3000/deleteEvent?pIdEvento=${eventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const message = await response.text();
                    alert(message); // Exibe a mensagem de sucesso
                    window.location.reload(); // Recarrega a página para atualizar a lista de eventos
                } else {
                    const errorMessage = await response.text();
                    alert(errorMessage); // Exibe a mensagem de erro
                }
            } catch (error) {
                console.error("Erro ao deletar evento:", error);
            }
        }
    }
    
});

document.getElementById('confirmBet').addEventListener('click', async () => {
    let quantCotas = document.getElementById('betValue').value;
    const palpite = document.getElementById('betChoice').value;
    const idEvento = document.getElementById('eventId').value;

    if (!quantCotas || !palpite || !idEvento) {
        showNotificationError('Preencha todos os campos antes de confirmar a aposta.');
        return;
    }   

    quantCotas = parseFloat(quantCotas);

    // Certificando que os valores estão corretos
    if (isNaN(quantCotas) || quantCotas <= 0) {
        showNotificationError('Valor da aposta inválido.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/betOnEvent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quantCotas: String(quantCotas),  // Enviar como string
                idEvento: String(idEvento),      // Enviar como string
                palpite: String(palpite)         // Enviar como string
            })
        });

        if (response.ok) {
            showNotification("Aposta Realizada!");
            document.getElementById('betForm').reset(); // Reseta o formulário
            const modal = bootstrap.Modal.getInstance(document.getElementById('betModal'));
            modal.hide(); // Fecha o modal
        } else {
            const errorMessage = await response.text();
            showNotificationError(errorMessage);
        }

    } catch (error) {
        showNotificationError("Erro ao realizar a aposta: " + error);
    }
});