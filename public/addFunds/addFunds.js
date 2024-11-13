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
        const errorMessage = await response.text();
        alert(errorMessage);
        window.location.href = "/home/home.html"; // Re-direciona para a página inicial do usuário
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
  