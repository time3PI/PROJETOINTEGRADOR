
async function enviarDadosBackend(event) {
    event.preventDefault(); // Evita o recarregamento da página
  
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const senha2 = document.getElementById("confirmaSenha").value;
    const nome = document.getElementById("nome").value;
    let dataNasc = document.getElementById("nascimento").value;

    if(senha !== senha2){
      showNotificationError("As duas senhas devem ser iguais!");
      return
    }

    try {
      const response = await fetch("http://localhost:3000/signUp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nome, email, senha, dataNasc })
      });

      if(senha !== senha2){
        showNotificationError("As duas senhas devem ser iguais!");
        return
      }
      if (!verificarMaioridade(dataNasc)) {
        showNotificationError("É necessário ter mais de 18 anos para se cadastrar.");
        return;
      }

      dataNasc = formatarDataOracle(dataNasc);

      if (response.ok) { 

        showNotification("Usuário criado com sucesso!");
        const betModal = new bootstrap.Modal(document.getElementById('betModal'));
        betModal.show(); // Abre o modal de aposta

      } else {

        const errorMessage = await response.text();
        showNotificationError(errorMessage);

      }
    } catch (error) {
      showNotificationError(error);
    }
  }
  
  document.getElementById("logonForm").addEventListener("submit", enviarDadosBackend);

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

  function togglePasswordVisibility(id) {
    const passwordField = document.getElementById(id);
    const eyeIcon = document.getElementById(`eye-icon${id === 'senha' ? '' : '-confirm'}`);
    
    // Alterna o tipo do campo de senha
    if (passwordField.type === "password") {
      passwordField.type = "text";
      eyeIcon.classList.remove('bi-eye-slash');
      eyeIcon.classList.add('bi-eye');
    } else {
      passwordField.type = "password";
      eyeIcon.classList.remove('bi-eye');
      eyeIcon.classList.add('bi-eye-slash');
    }
  }

  function verificarMaioridade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    
    return idade >= 18;
  }

  function formatarDataOracle(dataNascimento) {
    const nascimento = new Date(dataNascimento);
    const dia = String(nascimento.getDate()).padStart(2, '0');
    const mes = String(nascimento.getMonth() + 1).padStart(2, '0'); // Janeiro é 0
    const ano = nascimento.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }