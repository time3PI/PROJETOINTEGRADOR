import { respostaSecao } from "../funcoes.js";

document.addEventListener('DOMContentLoaded', () => {
    respostaSecao();
    fetchEvents('1', '.populares'); // Eventos mais populares
    fetchEvents('2', '.vencimento');

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
            categoria: event[7],
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
                        <p class="card-text">Categoria: ${event.categoria}</p>
                        <p class="card-text">${event.desc}</p>
                        <button class="bet-button" data-bs-toggle="modal" data-bs-target="#betModal" data-event-id="${event.id}">Apostar</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

// // Adiciona eventos de clique aos botões "Apostar"
// document.querySelector('.available-events').addEventListener('click', (event) => {
//     if (event.target && event.target.classList.contains('bet-button')) {
//         const eventId = event.target.getAttribute('data-event-id');
//         document.getElementById('eventId').value = eventId;
//         alert(eventId);
//     }
// });

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
