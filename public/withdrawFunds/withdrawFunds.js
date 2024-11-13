async function enviarDadosBackend(event) {
    event.preventDefault(); // Evita o recarregamento da página
  
    let agenciaBancaria = document.getElementById("agenciaBancaria").value;
    let numeroConta = document.getElementById("numeroConta").value;
    let tipoConta = document.getElementById("filterDropdown").value;
    let valor = document.getElementById("valor").value;
     
    try {
      const response = await fetch("http://localhost:3000/withdrawFunds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ agenciaBancaria, numeroConta, tipoConta, valor })
      });
  
      if (response.ok) { 
        const message = await response.text();
        alert(message); 
      } else {
        const errorMessage = await response.text();
        alert(errorMessage); // Exibe a mensagem de erro
      }
    } catch (error) {
      console.error("Erro na requisição de login:", error);
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