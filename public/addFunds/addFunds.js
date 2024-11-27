async function enviarDadosBackend(event) {
    event.preventDefault(); // Evita o recarregamento da página
  
    const nomeCartao = document.getElementById("nome").value;
    const numCartao = document.getElementById("cartao").value;
    const dataValidade = document.getElementById("validade").value;
    const valor = document.getElementById("valor").value;
    const cvv = document.getElementById("cvv").value;
  
    const [anoValidade, mesValidade] = dataValidade.split("-").map(Number); // Extrai o ano e mês da validade
    const dataAtual = new Date(); // Data atual
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth() + 1; // Mês atual, 0-11, então somamos 1
  
    if (anoValidade < anoAtual || (anoValidade === anoAtual && mesValidade < mesAtual)) {
        showNotificationError("A data de validade do cartão é inválida. O cartão expirou.");
        return; // Impede o envio dos dados
    }
  
    try {
      const response = await fetch("http://localhost:3000/addFunds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nomeCartao, numCartao, dataValidade, valor, cvv })
      });
  
      if (response.ok) { 
        showNotification("Saldo Adicionado!");
      } else {

        const errorMessage = await response.text();
        showNotificationError(errorMessage);

      }
    } catch (error) {
      showNotificationError(error);
    }
}
  
// Adiciona o evento de envio ao formulário para chamar a função
document.getElementById("addFundsForm").addEventListener("submit", enviarDadosBackend);

document.addEventListener("DOMContentLoaded", () => {
  const cartaoInput = document.getElementById("cartao");
  const cvvInput = document.getElementById("cvv");

  cvvInput.addEventListener("input", function() {
    this.value = this.value.replace(/\D/g, '');
  });

  // Mascara para formatação automática no estilo 0000-0000-0000-0000
  cartaoInput.addEventListener("input", (event) => {
    let value = event.target.value.replace(/\D/g, ""); // Remove todos os caracteres não numéricos
    if (value.length > 16) value = value.slice(0, 16); // Limita o valor a 16 dígitos

    // Aplica a formatação com traços
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, "$1-");
    event.target.value = formattedValue;
  });

  // Validação adicional no envio do formulário
  document.getElementById("addFundsForm").addEventListener("submit", (event) => {
    const rawValue = cartaoInput.value.replace(/\D/g, ""); // Obtém o valor sem os traços

    // Verifica se o número possui exatamente 16 dígitos
    if (rawValue.length !== 16) {
      showNotificationError("O número do cartão deve ter exatamente 16 dígitos.");
      event.preventDefault(); // Impede o envio do formulário se a condição não for atendida
    }
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
  