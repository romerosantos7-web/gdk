// recarga.js
document.addEventListener('DOMContentLoaded', async function() {
  const usuarioLogado = sessionStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    window.location.href = 'login.html';
    return;
  }

  const usuario = JSON.parse(usuarioLogado);
  const userId = usuario.id;

  // Elementos da UI
  const slider = document.getElementById('valor-slider');
  const valorExibido = document.getElementById('valor-exibido');
  const bonusExibido = document.getElementById('bonus-exibido');
  const saldoApos = document.getElementById('saldo-apos');
  const infoBonus = document.getElementById('info-bonus');
  const botoesRapidos = document.querySelectorAll('.btn-valor-rapido');
  const btnContinuar = document.getElementById('btn-continuar');
  const btnConfirmarPix = document.getElementById('btn-confirmar-pix');
  const btnVoltar = document.getElementById('btn-voltar-etapa1');
  const btnFechar = document.getElementById('btn-fechar-qr');
  const saldoAtualEl = document.getElementById('saldo-atual');

  // Etapas
  const etapa1 = document.getElementById('etapa1');
  const etapa2 = document.getElementById('etapa2');
  const etapa3 = document.getElementById('etapa3');
  const indicadores = {
    1: document.getElementById('etapa-ind1'),
    2: document.getElementById('etapa-ind2'),
    3: document.getElementById('etapa-ind3')
  };
  const loadingOverlay = document.getElementById('loading-overlay');

  const API_URL = 'https://gdk.onrender.com/api';

  let saldoAtual = 0;
  let valorSelecionado = 108;

  // Buscar saldo atual do backend
  try {
    const response = await fetch(`${API_URL}/saldo/${userId}`);
    const data = await response.json();
    if (data.saldo !== undefined) {
      saldoAtual = data.saldo;
      saldoAtualEl.textContent = `R$ ${saldoAtual.toFixed(2)}`;
    }
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    saldoAtual = 0;
    saldoAtualEl.textContent = `R$ 0,00`;
  }

  function atualizarValor(valor) {
    valor = parseFloat(valor) || 0;
    valorSelecionado = valor;
    const bonus = valor * 0.10;
    const valorComBonus = valor + bonus;
    const saldoFinal = saldoAtual + valorComBonus;

    valorExibido.textContent = `R$ ${valor.toFixed(2)}`;
    bonusExibido.textContent = `Bônus de 10%: R$ ${bonus.toFixed(2)}`;
    saldoApos.textContent = `R$ ${saldoFinal.toFixed(2)}`;
    infoBonus.textContent = `+ R$ ${valor.toFixed(2)} + R$ ${bonus.toFixed(2)} bônus`;

    botoesRapidos.forEach(btn => {
      btn.classList.remove('selecionado');
      if (parseFloat(btn.dataset.valor) === valor) {
        btn.classList.add('selecionado');
      }
    });

    if (parseFloat(slider.value) !== valor) {
      slider.value = valor;
    }
  }

  slider.addEventListener('input', function() {
    atualizarValor(this.value);
  });

  botoesRapidos.forEach(btn => {
    btn.addEventListener('click', function() {
      atualizarValor(this.dataset.valor);
    });
  });

  // Inicializa com valor padrão (108)
  atualizarValor(108);

  // Funções de controle de etapas
  function mostrarEtapa(etapa) {
    // Oculta todas
    etapa1.style.display = 'none';
    etapa2.classList.remove('visivel');
    etapa3.classList.remove('visivel');

    // Mostra a desejada
    if (etapa === 1) {
      etapa1.style.display = 'block';
      etapa2.classList.remove('visivel');
      etapa3.classList.remove('visivel');
      indicadores[1].classList.add('ativa');
      indicadores[2].classList.remove('ativa');
      indicadores[3].classList.remove('ativa');
    } else if (etapa === 2) {
      etapa2.style.display = 'block';
      setTimeout(() => etapa2.classList.add('visivel'), 10); // para animação
      indicadores[1].classList.remove('ativa');
      indicadores[2].classList.add('ativa');
      indicadores[3].classList.remove('ativa');
    } else if (etapa === 3) {
      etapa3.style.display = 'block';
      setTimeout(() => etapa3.classList.add('visivel'), 10);
      indicadores[1].classList.remove('ativa');
      indicadores[2].classList.remove('ativa');
      indicadores[3].classList.add('ativa');
    }
  }

  // Botão Continuar (etapa 1 -> 2)
  btnContinuar.addEventListener('click', function() {
    const valor = parseFloat(slider.value);
    if (valor < 20 || valor > 200) {
      alert('Valor fora do limite permitido.');
      return;
    }
    // Atualiza o valor na etapa 2
    document.getElementById('valor-confirmacao').textContent = `R$ ${valor.toFixed(2)}`;
    mostrarEtapa(2);
  });

  // Botão Voltar (etapa 2 -> 1)
  btnVoltar.addEventListener('click', function() {
    mostrarEtapa(1);
  });

  // Botão Confirmar PIX (etapa 2 -> loading -> etapa 3)
  btnConfirmarPix.addEventListener('click', async function() {
    const valor = parseFloat(slider.value);

    // Mostra loading
    loadingOverlay.classList.add('ativo');

    try {
      const response = await fetch(`${API_URL}/criar-pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: valor,
          payerName: usuario.nome || 'Cliente GDK',
          payerDocument: '00000000000', // CPF fixo ou poderia vir do perfil
          description: `Recarga GDK - ${usuario.email}`
        })
      });

      const data = await response.json();
      loadingOverlay.classList.remove('ativo');

      if (data.success) {
        // Preenche a etapa 3 com QR Code e aviso
        const qrContainer = document.getElementById('qr-container');
        qrContainer.innerHTML = `
          <h2 style="margin-bottom:1.5rem;">Pagamento PIX</h2>
          <img src="${data.qrCodeBase64}" class="qr-code-img">
          <p style="color:#aaa; margin-bottom:0.5rem;">Escaneie ou copie o código:</p>
          <div class="pix-code">
            <code style="color:#fff;">${data.copyPaste}</code>
          </div>
          <div class="aviso">
            <i class="fas fa-exclamation-triangle"></i> 
            Esta transação não pode ser cancelada. O pagamento deve ser realizado para evitar bloqueios.
            Muitas requisições sem prosseguir podem resultar em banimento da conta.
          </div>
        `;
        mostrarEtapa(3);
      } else {
        alert('Erro ao gerar PIX: ' + (data.error || 'Tente novamente.'));
      }
    } catch (error) {
      loadingOverlay.classList.remove('ativo');
      alert('Erro de conexão com o servidor.');
    }
  });

  // Botão Fechar (etapa 3 -> etapa 1)
  btnFechar.addEventListener('click', function() {
    mostrarEtapa(1);
  });

  // Inicia na etapa 1
  mostrarEtapa(1);
});

