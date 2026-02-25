// login.js
document.addEventListener('DOMContentLoaded', function() {
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const btnLogin = document.getElementById('btnLogin');
  const btnRegister = document.getElementById('btnRegister');
  const loginMessage = document.getElementById('loginMessage');
  const registerMessage = document.getElementById('registerMessage');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const registerName = document.getElementById('registerName');
  const registerEmail = document.getElementById('registerEmail');
  const registerPassword = document.getElementById('registerPassword');
  const registerConfirm = document.getElementById('registerConfirm');

  const API_URL = 'https://gdk.onrender.com/api';

  if (sessionStorage.getItem('usuarioLogado')) {
    window.location.href = 'catalogo.html';
    return;
  }

  function showLogin() {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    limparMensagens();
  }

  function showRegister() {
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    limparMensagens();
  }

  function limparMensagens() {
    loginMessage.textContent = '';
    loginMessage.className = 'message';
    registerMessage.textContent = '';
    registerMessage.className = 'message';
  }

  tabLogin.addEventListener('click', showLogin);
  tabRegister.addEventListener('click', showRegister);

  btnLogin.addEventListener('click', async function(e) {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const senha = loginPassword.value.trim();

    if (!email || !senha) {
      mostrarMensagem(loginMessage, 'Preencha todos os campos.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const data = await response.json();

      if (data.success) {
        mostrarMensagem(loginMessage, 'Login realizado! Redirecionando...', 'success');
        sessionStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
        setTimeout(() => window.location.href = 'catalogo.html', 1000);
      } else {
        mostrarMensagem(loginMessage, data.message, 'error');
      }
    } catch (error) {
      mostrarMensagem(loginMessage, 'Erro de conexão com o servidor.', 'error');
    }
  });

  btnRegister.addEventListener('click', async function(e) {
    e.preventDefault();
    const nome = registerName.value.trim();
    const email = registerEmail.value.trim();
    const senha = registerPassword.value.trim();
    const confirm = registerConfirm.value.trim();

    if (!nome || !email || !senha || !confirm) {
      mostrarMensagem(registerMessage, 'Preencha todos os campos.', 'error');
      return;
    }
    if (senha !== confirm) {
      mostrarMensagem(registerMessage, 'As senhas não coincidem.', 'error');
      return;
    }
    if (senha.length < 4) {
      mostrarMensagem(registerMessage, 'A senha deve ter pelo menos 4 caracteres.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
      });
      const data = await response.json();

      if (data.success) {
        mostrarMensagem(registerMessage, 'Cadastro realizado! Faça login.', 'success');
        registerName.value = '';
        registerEmail.value = '';
        registerPassword.value = '';
        registerConfirm.value = '';
        setTimeout(() => {
          showLogin();
          loginEmail.value = email;
          loginPassword.value = '';
        }, 1500);
      } else {
        mostrarMensagem(registerMessage, data.message, 'error');
      }
    } catch (error) {
      mostrarMensagem(registerMessage, 'Erro de conexão com o servidor.', 'error');
    }
  });

  function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = `message ${tipo}`;
  }
});
