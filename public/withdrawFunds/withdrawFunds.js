import { respostaSecao } from "../funcoes.js";

document.addEventListener('DOMContentLoaded', () => {respostaSecao();});

async function enviarDadosBackend(event) {
  event.preventDefault(); // Evita o recarregamento da página

  let agenciaBancaria = document.getElementById("agenciaBancaria").value;
  let numeroConta = document.getElementById("numeroConta").value;
  let tipoConta = document.getElementById("filterDropdown").value;
  let valor = parseFloat(document.getElementById("valor").value); // Converte para número
  
  try {
      let valorDescontado = valor;
      let taxa = 0;

      // Calcula a taxa com base no valor
      if (valor <= 100) {
          taxa = valor * 0.04;
      } else if (valor > 100 && valor <= 1000) {
          taxa = valor * 0.03;
      } else if (valor > 1000 && valor <= 5000) {
          taxa = valor * 0.02;
      } else if (valor > 5000 && valor <= 100000) {
          taxa = valor * 0.01;
      }
      
      valorDescontado = valor - taxa; // Valor final após desconto da taxa
      
      // Exibe o modal com as informações calculadas
      document.getElementById("valorDescontadoModal").textContent = valorDescontado.toFixed(2);
      document.getElementById("taxaModal").textContent = taxa.toFixed(2);

      // Exibe o modal
      const betModal = new bootstrap.Modal(document.getElementById("betModal"));
      betModal.show();

      // Aguardar o usuário confirmar ou cancelar
      document.getElementById("confirmButton").onclick = async () => {
          // Faz a requisição para o backend se o usuário confirmar
          const response = await fetch("http://localhost:3000/withdrawFunds", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({ agenciaBancaria, numeroConta, tipoConta, valor })
          });

          if (response.ok) {
              const message = await response.text();
              showNotification(message);
          } else {
              const errorMessage = await response.text();
              showNotificationError(errorMessage);
          }

          // Fecha o modal após a confirmação
          betModal.hide();
      };
      betModal.hide();

  } catch (error) {
      showNotificationError(error.message || "Ocorreu um erro ao processar sua solicitação.");
  }
}
  
// Adiciona o evento de envio ao formulário para chamar a função
document.getElementById("withdrawFundsForm").addEventListener("submit", enviarDadosBackend);

document.addEventListener("DOMContentLoaded", () => {
    
    const agenciaBancaria = document.getElementById("agenciaBancaria");
    const numeroConta = document.getElementById("numeroConta");
    const valor = document.getElementById("valor");

    agenciaBancaria.addEventListener("input", (event) => {
        let value = event.target.value.replace(/\D/g, ""); // Remove todos os caracteres não numéricos
        if (value.length > 5) value = value.slice(0, 5); // Limita o valor a 5 caracteres
    
        // Aplica a formatação com traço
        const formattedValue = value.replace(/(\d{4})(?=\d)/g, "$1-");
        event.target.value = formattedValue;
    });

    numeroConta.addEventListener("input", (event) => {
        let value = event.target.value.replace(/\D/g, ""); // Remove todos os caracteres não numéricos
        if (value.length > 8) value = value.slice(0, 8); // Limita o valor a 8 caracteres
    
        // Aplica a formatação com traço
        const formattedValue = value.replace(/(\d{7})(?=\d)/g, "$1-");
        event.target.value = formattedValue;
    });

    valor.addEventListener("input", (event) => {
        let value = event.target.value.replace(/\D/g, ""); // Remove todos os caracteres não numéricos
        event.target.value = value;  // Atualiza o valor sem formatação
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