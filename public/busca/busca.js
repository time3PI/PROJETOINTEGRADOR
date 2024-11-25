import { respostaSecao } from "../funcoes.js";

document.addEventListener('DOMContentLoaded', () => {
    respostaSecao();
});

// Seleciona elementos necessários
const filterInput = document.getElementById('filter');
const gridTable = document.getElementById('grid-table');
const cardItems = Array.from(gridTable.getElementsByClassName('card-item'));
const categorySelect = document.getElementById('category-select');

filterInput.addEventListener('keyup', function () {
    const filterValue = filterInput.value.toLowerCase();
    cardItems.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(filterValue) ? 'block' : 'none';
    });
});


let filteredItems = [...cardItems]; // Itens filtrados, inicialmente todos os itens
const itemsPerPage = 9;
let currentPage = 1;

// Função para renderizar a página atual
function renderPage(page) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    // Exibe somente os itens da página atual
    filteredItems.forEach((card, index) => {
        card.style.display = index >= start && index < end ? 'block' : 'none';
    });

    // Atualiza os botões de navegação
    document.getElementById('prev-page').disabled = page === 1;
    document.getElementById('next-page').disabled = end >= filteredItems.length;

    // Atualiza o indicador de página
    document.getElementById('page-info').textContent = `Página ${page}`;
}

// Atualiza os itens exibidos com base no filtro e na categoria
function updateFilteredItems() {
    const filterValue = filterInput.value.toLowerCase();
    const selectedCategory = categorySelect.value.toLowerCase();

    // Filtra itens por texto e categoria
    filteredItems = cardItems.filter(card => {
        const text = card.textContent.toLowerCase();
        const category = card.getAttribute('data-category').toLowerCase();

        const matchesText = text.includes(filterValue);
        const matchesCategory = selectedCategory === '' || category === selectedCategory;

        return matchesText && matchesCategory;
    });

    // Reinicia para a página 1 e renderiza
    currentPage = 1;
    renderPage(currentPage);
}

// Adiciona evento de busca dinâmica
filterInput.addEventListener('keyup', updateFilteredItems);

// Adiciona evento de filtragem por categoria
categorySelect.addEventListener('change', updateFilteredItems);

// Controles de paginação
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage * itemsPerPage < filteredItems.length) {
        currentPage++;
        renderPage(currentPage);
    }
});

// Renderiza a primeira página ao carregar
updateFilteredItems();
