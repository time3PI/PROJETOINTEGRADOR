async function enviarDadosBackend(event) {
    event.preventDefault(); // Evita o recarregamento da página
  
    const nomeCartao = document.getElementById("nome").value;
    const numCartao = document.getElementById("cartao").value;
    const dataValidade = document.getElementById("validade").value;
    const valor = document.getElementById("valor").value;
    const cvv = document.getElementById("cvv").value;
  
    try {
      const response = await fetch("http://localhost:3000/addFunds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nomeCartao, numCartao, dataValidade, valor, cvv })
      });
  
      if (response.ok) { 
        const message = await response.text();
        alert(message);
      } else {

        const errorMessage = await response.text();
        alert(errorMessage); // Exibe a mensagem de erro

      }
    } catch (error) {
      console.error("Erro na requisição de cadastro:", error);
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
      alert("O número do cartão deve ter exatamente 16 dígitos.");
      event.preventDefault(); // Impede o envio do formulário se a condição não for atendida
    }
  });
});


  