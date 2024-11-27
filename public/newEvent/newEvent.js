document.addEventListener('DOMContentLoaded', () => {
  respostaSecao();});
  
const notification = document.getElementById("notification");
const notificationError = document.getElementById("notification-error");
async function enviarDadosBackend() {
    const titulo = document.getElementById("titulo").value;
    const desc = document.getElementById("desc").value;
    const dataInicio = document.getElementById("dataInicio").value;
    const dataInicioApostas = document.getElementById("dataInicioApostas").value;
    const horaInicioApostas = document.getElementById("horaInicioApostas").value;
    const dataFimApostas = document.getElementById("dataFimApostas").value;
    const horaFimApostas = document.getElementById("horaFimApostas").value;
    const categoria = document.getElementById("filterDropdown").value;

    const hoje = new Date().toISOString().split("T")[0]; // Data atual no formato YYYY-MM-DD

    if (!titulo || !desc || !dataInicio || !dataInicioApostas || !horaInicioApostas || !dataFimApostas || !horaFimApostas || !categoria) {
      showNotificationError("Por favor, preencha todos os campos antes de continuar.");
      return;
    }

    // Verifica se a data de início é válida
    if (dataInicio < hoje) {
        showNotificationError("A data de início do evento não pode ser anterior à data atual.");
        return;
    }

    // Verifica se a data de início das apostas é válida
    if (dataInicioApostas < hoje) {
        showNotificationError("A data de início das apostas não pode ser anterior à data atual.");
        return;
    }

    if (dataInicioApostas > dataInicio) {
        showNotificationError("A data de início das apostas deve ser menor ou igual à data de início do evento.");
        return;
    }

    if (dataFimApostas < dataInicioApostas || dataFimApostas > dataInicio) {
      showNotificationError("A data de fim das apostas deve estar entre a data de início das apostas e a data de início do evento.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/addNewEvent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ titulo, desc, dataInicio, dataInicioApostas, horaInicioApostas, dataFimApostas, horaFimApostas, categoria })

      });
  
      if (response.ok) {
        showNotification("Evento criado com susceeso!");

      } else {
        const errorMessage = await response.text();
        showNotificationError(errorMessage);

      }
    } catch (error) {
      showNotificationError(error);
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