async function enviarDadosBackend(event) {
    event.preventDefault(); // Evita o recarregamento da página
  
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const nome = document.getElementById("nome").value;
    const dataNasc = document.getElementById("nascimento").value;
  
    try {
      const response = await fetch("http://localhost:3000/signUp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nome, email, senha, dataNasc })
      });
  
      if (response.ok) { 
        const errorMessage = await response.text();
        alert(errorMessage);
        window.location.href = "/login/login.html"; // Redireciona para a página inicial do usuário
      } else {

        const errorMessage = await response.text();
        alert(errorMessage); // Exibe a mensagem de erro

      }
    } catch (error) {
      console.error("Erro na requisição de cadastro:", error);
    }
  }
  
  // Adiciona o evento de envio ao formulário para chamar a função
  document.getElementById("logonForm").addEventListener("submit", enviarDadosBackend);
  