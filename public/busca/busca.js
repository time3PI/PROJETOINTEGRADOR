import { respostaSecao } from "../funcoes";

document.addEventListener('DOMContentLoaded', () => {
    respostaSecao();
});

// Filtragem Dinâmica dos "Quadradinhos"
const filterInput = document.getElementById('filter');
const gridTable = document.getElementById('grid-table');
const cardItems = Array.from(gridTable.getElementsByClassName('card-item'));

filterInput.addEventListener('keyup', function () {
    const filterValue = filterInput.value.toLowerCase();
    cardItems.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(filterValue) ? 'block' : 'none';
    });
});

// Variáveis para paginação
const itemsPerPage = 9;
let currentPage = 1;

// Atualizar a exibição dos itens
function renderPage(page) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    cardItems.forEach((card, index) => {
        card.style.display = index >= start && index < end ? 'block' : 'none';
    });

    // Atualizar estado dos botões de navegação
    document.getElementById('prev-page').disabled = page === 1;
    document.getElementById('next-page').disabled = end >= cardItems.length;

    // Atualizar o indicador de página
    document.getElementById('page-info').textContent = `Página ${page}`;
}

// Controles de paginação
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage * itemsPerPage < cardItems.length) {
        currentPage++;
        renderPage(currentPage);
    }
});

// Renderizar a primeira página ao carregar
renderPage(currentPage);


//selecao por categoria
const categorySelect = document.getElementById('category-select');
categorySelect.addEventListener('change', function () {
    const selectedCategory = categorySelect.value.toLowerCase();
    cardItems.forEach(card => {
        if (selectedCategory === '') {
        // Mostrar todos os itens
            card.style.display = 'block';
        } else {
            // Mostrar apenas os itens da categoria selecionada
            const category = card.getAttribute('data-category').toLowerCase();
        card.style.display = category === selectedCategory ? 'block' : 'none';
        }
});
});