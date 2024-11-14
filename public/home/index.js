import { checkUserSession } from "../funcoes.js";

document.addEventListener("load", async () => {
    const isLoggedIn = await checkUserSession();
    const currentPath = window.location.pathname;

    // Verifica se está logado e se está na página index.html
    if (isLoggedIn && currentPath.endsWith("index.html")) {
        // Redireciona para 'indexlog.html' se estiver logado
        window.location.href = "/home/indexlog.html";
    } 
    // Se não estiver logado e estiver na página indexlog.html
    else if (!isLoggedIn && currentPath.endsWith("indexlog.html")) {
        // Redireciona para 'index.html'
        window.location.href = "/home/index.html";
    }
});
