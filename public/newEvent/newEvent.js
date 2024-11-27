document.addEventListener('DOMContentLoaded', () => {respostaSecao();});
async function enviarDadosBackend() {
    const titulo = document.getElementById("titulo").value;
    const desc = document.getElementById("desc").value;
    const dataInicio = document.getElementById("dataInicio").value;
    const dataInicioApostas = document.getElementById("dataInicioApostas").value;
    const horaInicioApostas = document.getElementById("horaInicioApostas").value;
    const dataFimApostas = document.getElementById("dataFimApostas").value;
    const horaFimApostas = document.getElementById("horaFimApostas").value;
    const categoria = document.getElementById("filterDropdown").value;

    try {
      const response = await fetch("http://localhost:3000/addNewEvent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ titulo, desc, dataInicio, dataInicioApostas, horaInicioApostas, dataFimApostas, horaFimApostas, categoria })

      });
  
      if (response.ok) {
        const successMessage  = await response.text();
        alert(successMessage);
        alert(successMessage);
        // Redireciona para a página inicial do usuário
      } else {

        const errorMessage = await response.text();
        alert(errorMessage); // Exibe a mensagem de erro

      }
    } catch (error) {
      console.error("Erro na requisição de cadastro:", error);
    }
  }
  
// Adiciona o evento de envio ao formulário para chamar a função
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  const dataInicio = document.getElementById("dataInicio");
  const dataInicioApostas = document.getElementById("dataInicioApostas");
  const dataFimApostas = document.getElementById("dataFimApostas");
  const horaInicioApostas = document.getElementById("horaInicioApostas");
  const horaFimApostas = document.getElementById("horaFimApostas");

  dataInicio.setAttribute("min", today);

  dataInicioApostas.disabled = true;
  dataFimApostas.disabled = true;
  horaInicioApostas.disabled = true;
  horaFimApostas.disabled = true;

  dataInicio.addEventListener("change", () => {
    const inicioEvento = dataInicio.value;

    if (inicioEvento) {
      dataInicioApostas.disabled = false;
      dataFimApostas.disabled = false;
      horaInicioApostas.disabled = false;
      horaFimApostas.disabled = false;

      dataInicioApostas.setAttribute("max", inicioEvento);
      dataInicioApostas.setAttribute("min", today);

      dataInicioApostas.addEventListener("change", () => {
        const inicioApostas = dataInicioApostas.value;

        if (inicioApostas) {
          dataFimApostas.setAttribute("max", inicioEvento);
          dataFimApostas.setAttribute("min", inicioApostas);
        }
      });
    }
    respostaSecao();
  });

  // Verifica se a hora de fim das apostas é maior que a hora de início se as datas forem iguais
  dataFimApostas.addEventListener("change", () => {
    if (dataFimApostas.value === dataInicioApostas.value) {
      horaFimApostas.addEventListener("change", () => {
        const inicioHora = horaInicioApostas.value;
        const fimHora = horaFimApostas.value;

        if (inicioHora && fimHora && fimHora <= inicioHora) {
          alert("A hora de fim das apostas deve ser maior que a hora de início das apostas.");
          horaFimApostas.value = ""; // Limpa o valor para forçar uma nova seleção
        }
      });
    } else {
      horaFimApostas.removeEventListener("change", checkHoraValida);
    }
  });
});

async function respostaSecao() {
  try {
      const response = await fetch("/checkSession", { method: "GET", credentials: "include" });
      console.log("Resposta do servidor:", response); // Adicione esse log

      if (!response.ok) {
          window.location.assign("http://localhost:3000/home/index.html")
          return;
      }
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      return false;
  }
}