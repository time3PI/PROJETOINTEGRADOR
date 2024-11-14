async function enviarDadosBackend(event) {
  event.preventDefault(); // Evita o recarregamento da página

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, senha })
    });

    if (response.ok) { 
      const message = await response.text();
      window.location.href = "/home/index.html"; // Redireciona para a página inicial do usuário
    } else {
      const errorMessage = await response.text();
      alert(errorMessage); // Exibe a mensagem de erro
    }
  } catch (error) {
    console.error("Erro na requisição de login:", error);
  }
}

// Adiciona o evento de envio ao formulário para chamar a função
document.getElementById("loginForm").addEventListener("submit", enviarDadosBackend);
