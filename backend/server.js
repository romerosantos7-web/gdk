const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Função para ler o banco de dados
function readDB() {
  const data = fs.readFileSync(DB_PATH);
  return JSON.parse(data);
}

// Função para escrever no banco de dados
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Rota de login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const db = readDB();
  const usuario = db.usuarios.find(u => u.email === email && u.senha === senha);
  if (usuario) {
    // Não enviar a senha de volta
    const { senha, ...usuarioSemSenha } = usuario;
    res.json({ success: true, usuario: usuarioSemSenha });
  } else {
    res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
  }
});

// Rota de cadastro
app.post('/api/register', (req, res) => {
  const { nome, email, senha } = req.body;
  const db = readDB();
  
  // Verifica se email já existe
  if (db.usuarios.some(u => u.email === email)) {
    return res.status(400).json({ success: false, message: 'E-mail já cadastrado' });
  }

  const novoId = db.usuarios.length > 0 ? Math.max(...db.usuarios.map(u => u.id)) + 1 : 1;
  const novoUsuario = { id: novoId, nome, email, senha };
  db.usuarios.push(novoUsuario);
  writeDB(db);

  const { senha: _, ...usuarioSemSenha } = novoUsuario;
  res.json({ success: true, usuario: usuarioSemSenha });
});

// Rota para obter todos os usuários (opcional, apenas para teste)
app.get('/api/usuarios', (req, res) => {
  const db = readDB();
  const usuariosSemSenha = db.usuarios.map(({ senha, ...rest }) => rest);
  res.json(usuariosSemSenha);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});