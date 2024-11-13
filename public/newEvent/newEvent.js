async function enviarDadosBackend(event) {
    event.preventDefault(); // Evita o recarregamento da página
  
    const titulo = document.getElementById("titulo").value;
    const desc = document.getElementById("desc").value;
    const dataInicio = document.getElementById("dataInicio").value;
    const dataInicioApostas = document.getElementById("dataInicioApostas").value;
    const horaInicioApostas = document.getElementById("horaInicioApostas").value;
    const dataFimApostas = document.getElementById("dataFimApostas").value;
    const horaFimApostas = document.getElementById("horaFimApostas").value;

    try {
      const response = await fetch("http://localhost:3000/addNewEvent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ titulo, desc, dataInicio, dataInicioApostas, horaInicioApostas, dataFimApostas, horaFimApostas })

      });
  
      if (response.ok) { 
        const successMessage  = await response.text();
        alert(successMessage );
        window.location.href = "/home/home.html"; // Redireciona para a página inicial do usuário
      } else {

        const errorMessage = await response.text();
        alert(errorMessage); // Exibe a mensagem de erro

      }
    } catch (error) {
      console.error("Erro na requisição de cadastro:", error);
    }
  }
  
// Adiciona o evento de envio ao formulário para chamar a função
document.getElementById("newEventForm").addEventListener("submit", enviarDadosBackend);

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  const dataInicio = document.getElementById("dataInicio");
  const dataInicioApostas = document.getElementById("dataInicioApostas");
  const dataFimApostas = document.getElementById("dataFimApostas");

  // Define a data mínima para a data de início do evento como hoje
  dataInicio.setAttribute("min", today);

  // Atualiza a data de início das apostas com base na data de início do evento
  dataInicio.addEventListener("change", () => {
    const inicioEvento = dataInicio.value;
    
    // Se a data de início do evento for válida, ajusta os limites de data
    if (inicioEvento) {
      dataInicioApostas.setAttribute("max", inicioEvento);  // Aposta não pode começar antes do início do evento
      dataInicioApostas.setAttribute("min", today);          // Aposta deve começar até o dia atual

      dataFimApostas.setAttribute("max", inicioEvento);  // Aposta não pode começar antes do início do evento
      dataFimApostas.setAttribute("min", dataInicio); 
    }
  });

  // Define uma data mínima para o fim das apostas (após o início das apostas)
  dataInicioApostas.addEventListener("change", () => {
    const inicioApostas = dataInicioApostas.value;
    
    if (inicioApostas) {
      dataFimApostas.setAttribute("min", inicioApostas); // O fim das apostas não pode ser antes do início das apostas
    }
  });
});
