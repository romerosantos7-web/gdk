const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
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

// ===== ROTAS DE AUTENTICAÇÃO =====

// Rota de login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const db = readDB();
  const usuario = db.usuarios.find(u => u.email === email && u.senha === senha);
  if (usuario) {
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
  
  if (db.usuarios.some(u => u.email === email)) {
    return res.status(400).json({ success: false, message: 'E-mail já cadastrado' });
  }

  const novoId = db.usuarios.length > 0 ? Math.max(...db.usuarios.map(u => u.id)) + 1 : 1;
  const novoUsuario = { id: novoId, nome, email, senha, saldo: 0 };
  db.usuarios.push(novoUsuario);
  writeDB(db);

  const { senha: _, ...usuarioSemSenha } = novoUsuario;
  res.json({ success: true, usuario: usuarioSemSenha });
});

// Rota para obter todos os usuários (teste)
app.get('/api/usuarios', (req, res) => {
  const db = readDB();
  const usuariosSemSenha = db.usuarios.map(({ senha, ...rest }) => rest);
  res.json(usuariosSemSenha);
});

// ===== ROTAS DE SALDO =====

// Rota para obter saldo do usuário
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

// ===== ROTA DE RECARGA =====
app.post('/api/recarga', (req, res) => {
  const { userId, valor } = req.body;
  if (!userId || !valor || valor <= 0) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  const db = readDB();
  const usuario = db.usuarios.find(u => u.id === userId);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

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

// ===== ROTAS PIX (MisticPay) =====

const MISTICPAY_BASE_URL = 'https://api.misticpay.com/api';
const MISTICPAY_CI = process.env.MISTICPAY_CI;
const MISTICPAY_CS = process.env.MISTICPAY_CS;

// Rota para criar PIX
app.post('/api/criar-pix', async (req, res) => {
  const { userId, amount, payerName, payerDocument, description } = req.body;

  if (!userId || !amount || !payerName || !payerDocument) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const transactionId = `recarga-${userId}-${Date.now()}`;

  try {
    const response = await axios.post(
      `${MISTICPAY_BASE_URL}/transactions/create`,
      {
        amount: amount,
        payerName: payerName,
        payerDocument: payerDocument.replace(/\D/g, ''),
        transactionId: transactionId,
        description: description || 'Recarga de saldo GDK',
        projectWebhook: `https://${req.get('host')}/api/webhook/misticpay`
      },
      {
        headers: {
          ci: MISTICPAY_CI,
          cs: MISTICPAY_CS,
          'Content-Type': 'application/json',
        },
      }
    );

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

// Rota do webhook (recebe confirmação da MisticPay)
app.post('/api/webhook/misticpay', async (req, res) => {
  const webhookData = req.body;
  console.log('Webhook recebido:', webhookData);

  if (webhookData.transactionType === 'DEPOSITO' && webhookData.status === 'COMPLETO') {
    const transactionId = webhookData.transactionId;
    const amount = webhookData.value;

    const match = transactionId.match(/^recarga-(\d+)-/);
    if (match) {
      const userId = parseInt(match[1]);
      const db = readDB();
      const usuario = db.usuarios.find(u => u.id === userId);
      
      if (usuario) {
        const valorEmReais = amount;
        const bonus = valorEmReais * 0.10;
        const totalAdicionado = valorEmReais + bonus;
        usuario.saldo = (usuario.saldo || 0) + totalAdicionado;
        
        // Registrar transação de recarga
        const novaTransacao = {
          id: Date.now(),
          usuarioId: userId,
          data: new Date().toISOString(),
          tipo: 'recarga',
          descricao: 'Recarga de saldo via PIX',
          valor: valorEmReais,
          bonus: bonus,
          total: totalAdicionado,
          status: 'concluido',
          metodo: 'PIX',
          transactionId: webhookData.transactionId
        };
        
        if (!db.transacoes) db.transacoes = [];
        db.transacoes.push(novaTransacao);
        
        writeDB(db);
        console.log(`✅ Saldo atualizado para usuário ${userId}: +R$ ${totalAdicionado.toFixed(2)}`);
      }
    }
  }

  res.sendStatus(200);
});

// ===== ROTAS PARA O PERFIL =====

// Buscar dados completos do usuário
app.get('/api/usuario/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const db = readDB();
  const usuario = db.usuarios.find(u => u.id === userId);
  
  if (usuario) {
    const { senha, ...usuarioSemSenha } = usuario;
    res.json(usuarioSemSenha);
  } else {
    res.status(404).json({ error: 'Usuário não encontrado' });
  }
});

// Buscar histórico de transações do usuário
app.get('/api/historico/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const db = readDB();
  const transacoes = db.transacoes?.filter(t => t.usuarioId === userId) || [];
  res.json({ transacoes });
});

// Registrar nova transação
app.post('/api/transacoes', (req, res) => {
  const { usuarioId, tipo, descricao, valor, metodo } = req.body;
  const db = readDB();
  
  const novaTransacao = {
    id: Date.now(),
    usuarioId,
    data: new Date().toISOString(),
    tipo,
    descricao,
    valor,
    status: 'concluido',
    metodo
  };
  
  if (!db.transacoes) db.transacoes = [];
  db.transacoes.push(novaTransacao);
  writeDB(db);
  
  res.json({ success: true, transacao: novaTransacao });
});

// ===== ROTA DE COMPRA DE CARTÃO =====
app.post('/api/comprar-cartao', (req, res) => {
  const { usuarioId, cartaoId, valor, descricao } = req.body;
  const db = readDB();
  
  const usuario = db.usuarios.find(u => u.id === usuarioId);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  if (usuario.saldo < valor) {
    return res.status(400).json({ error: 'Saldo insuficiente' });
  }
  
  usuario.saldo -= valor;
  
  const novaTransacao = {
    id: Date.now(),
    usuarioId,
    data: new Date().toISOString(),
    tipo: 'compra',
    descricao: descricao || 'Compra de cartão',
    valor: valor,
    status: 'concluido',
    metodo: 'Saldo',
    cartaoId: cartaoId
  };
  
  if (!db.transacoes) db.transacoes = [];
  db.transacoes.push(novaTransacao);
  
  writeDB(db);
  
  res.json({ 
    success: true, 
    message: 'Compra realizada com sucesso',
    novoSaldo: usuario.saldo,
    transacao: novaTransacao
  });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
