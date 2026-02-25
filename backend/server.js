const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

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

// Rota para obter saldo do usuário
app.get('/api/saldo/:id', (req, res) => {
    const db = readDB();
    const usuario = db.usuarios.find(u => u.id == req.params.id);
    if (usuario) {
        res.json({ saldo: usuario.saldo || 0 });
    } else {
        res.status(404).json({ error: 'Usuário não encontrado' });
    }
});

// Rota para atualizar saldo (após recarga)
app.post('/api/saldo/atualizar', (req, res) => {
    const { userId, valor } = req.body;
    const db = readDB();
    const usuario = db.usuarios.find(u => u.id == userId);
    if (usuario) {
        usuario.saldo = (usuario.saldo || 0) + valor;
        writeDB(db);
        res.json({ success: true, novoSaldo: usuario.saldo });
    } else {
        res.status(404).json({ error: 'Usuário não encontrado' });
    }
});

// Rota para obter saldo do usuário (requer autenticação via session ou token)
// Como usamos sessionStorage no frontend, vamos passar o ID do usuário no corpo ou via query.
// Vamos fazer uma rota simples: GET /api/saldo/:id
app.get('/api/saldo/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const db = readDB();
  const usuario = db.usuarios.find(u => u.id === userId);
  if (usuario) {
    res.json({ saldo: usuario.saldo || 0 });
  } else {
    res.status(404).json({ error: 'Usuário não encontrado' });
  }
});

app.post('/api/recarga', (req, res) => {
  const { userId, valor } = req.body; // valor em reais
  if (!userId || !valor || valor <= 0) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  const db = readDB();
  const usuario = db.usuarios.find(u => u.id === userId);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Adiciona saldo (valor + bônus de 10%)
  const bonus = valor * 0.10;
  const totalAdicionado = valor + bonus;
  usuario.saldo = (usuario.saldo || 0) + totalAdicionado;

  writeDB(db);

  res.json({ 
    success: true, 
    novoSaldo: usuario.saldo,
    valorAdicionado: valor,
    bonus: bonus
  });
});

const axios = require('axios');

// Configurações da API MisticPay (use variáveis de ambiente)
const MISTICPAY_BASE_URL = 'https://api.misticpay.com/api';
const MISTICPAY_CI = process.env.MISTICPAY_CI; // seu client_id
const MISTICPAY_CS = process.env.MISTICPAY_CS; // seu client_secret

// Rota para criar transação PIX (chamada pelo frontend)
app.post('/api/criar-pix', async (req, res) => {
  const { userId, amount, payerName, payerDocument, description } = req.body;

  if (!userId || !amount || !payerName || !payerDocument) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  // Gera um ID único para esta transação (pode ser algo como "recarga-{userId}-{timestamp}")
  const transactionId = `recarga-${userId}-${Date.now()}`;

  try {
    const response = await axios.post(
      `${MISTICPAY_BASE_URL}/transactions/create`,
      {
        amount: amount,
        payerName: payerName,
        payerDocument: payerDocument.replace(/\D/g, ''), // remove formatação
        transactionId: transactionId,
        description: description || 'Recarga de saldo GDK',
        // projectWebhook: 'https://gdkccs.onrender.com/api/webhook/misticpay' // opcional
      },
      {
        headers: {
          ci: MISTICPAY_CI,
          cs: MISTICPAY_CS,
          'Content-Type': 'application/json',
        },
      }
    );

    // Salva temporariamente a transação no seu banco (opcional)
    // Por enquanto, vamos apenas repassar os dados da MisticPay para o frontend
    res.json({
      success: true,
      transactionId: response.data.data.transactionId,
      qrCodeBase64: response.data.data.qrCodeBase64,
      qrcodeUrl: response.data.data.qrcodeUrl,
      copyPaste: response.data.data.copyPaste,
      amount: amount,
    });
  } catch (error) {
    console.error('Erro ao criar PIX:', error.response?.data || error.message);
    res.status(500).json({ error: 'Falha ao gerar PIX' });
  }
});

// Rota para webhook (receber confirmação da MisticPay)
app.post('/api/webhook/misticpay', async (req, res) => {
  // Nota: Você deve configurar esta URL no campo projectWebhook ao criar a transação,
  // ou na dashboard da MisticPay para a credencial.
  const webhookData = req.body;

  // Log para depuração
  console.log('Webhook recebido:', webhookData);

  // Verifica se é uma transação de depósito completa
  if (webhookData.transactionType === 'DEPOSITO' && webhookData.status === 'COMPLETO') {
    const transactionId = webhookData.transactionId; // ID da transação na MisticPay
    const amount = webhookData.value; // valor em centavos? Verifique na documentação

    // Aqui você precisa encontrar a transação no seu sistema pelo transactionId
    // Como você passou o transactionId personalizado (ex: "recarga-1-123456"), pode extrair o userId
    // Vamos supor que você tenha um banco de transações pendentes.
    // Para simplificar, vamos extrair o userId do transactionId se ele seguir o padrão "recarga-{userId}-{timestamp}"
    const match = transactionId.match(/^recarga-(\d+)-/);
    if (match) {
      const userId = parseInt(match[1]);

      // Carrega o banco de dados
      const db = readDB();
      const usuario = db.usuarios.find(u => u.id === userId);
      if (usuario) {
        // Adiciona o saldo (considerando que amount já está em reais? Verifique se a MisticPay envia em centavos)
        // Na documentação, o campo value no webhook parece ser o valor em reais (ex: 455). Vamos confirmar.
        // Se for em centavos, divida por 100.
        const valorEmReais = amount; // supondo que já seja em reais
        const bonus = valorEmReais * 0.10; // bônus de 10%
        usuario.saldo = (usuario.saldo || 0) + valorEmReais + bonus;

        writeDB(db);
        console.log(`Saldo atualizado para o usuário ${userId}: R$ ${usuario.saldo}`);
      }
    }
  }

  // Responde 200 para a MisticPay saber que recebeu
  res.sendStatus(200);
});

