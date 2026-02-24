// users.js - Simulação de banco de dados de usuários em memória
// Futuramente, isso será substituído por chamadas a um backend real

// Array de usuários pré-cadastrados (seed)
const usuarios = [
    {
        id: 1,
        nome: "Admin",
        email: "admin@gdk.com",
        senha: "123456"
    }
];

// Função auxiliar para encontrar usuário por email (case insensitive)
function encontrarUsuarioPorEmail(email) {
    const emailLimpo = email.trim().toLowerCase();
    return usuarios.find(user => user.email.toLowerCase() === emailLimpo);
}

// Função para adicionar novo usuário
function adicionarUsuario(nome, email, senha) {
    const novoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
    const novoUsuario = { 
        id: novoId, 
        nome: nome.trim(), 
        email: email.trim().toLowerCase(), 
        senha: senha 
    };
    usuarios.push(novoUsuario);
    console.log('Usuário cadastrado:', novoUsuario);
    console.log('Total de usuários agora:', usuarios.length);
    return novoUsuario;
}