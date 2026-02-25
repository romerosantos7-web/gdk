// recarga.js - Versão com tratamento numérico seguro
document.addEventListener('DOMContentLoaded', async function() {
  const usuarioLogado = sessionStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    window.location.href = 'login.html';
    return;
  }

  const usuario = JSON.parse(usuarioLogado);
  const userId = usuario.id;

  // Elementos da UI (com verificação)
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
  const etapa1 = document.getElementById('etapa1');
  const etapa2 = document.getElementById('etapa2');
  const etapa3 = document.getElementById('etapa3');
  const indicadores = {
    1: document.getElementById('etapa-ind1'),
    2: document.getElementById('etapa-ind2'),
    3: document.getElementById('etapa-ind3')
  };
  const loadingOverlay = document.getElementById('loading-overlay');
  const qrContainer = document.getElementById('qr-container');
  const valorConfirmacao = document.getElementById('valor-confirmacao');

  // Verificação de elementos críticos
  if (!slider || !btnContinuar || !etapa1 || !etapa2 || !etapa3 || !valorConfirmacao) {
    console.error('Elementos críticos não encontrados no HTML.');
    alert('Erro de carregamento da página. Atualize ou contate o suporte.');
    return;
  }

  const API_URL = 'https://gdk.onrender.com/api';
  let saldoAtual = 0; // sempre número

  // Buscar saldo atual
  try {
    const response = await fetch(`${API_URL}/saldo/${userId}`);
    const data = await response.json();
    console.log('Resposta da API /saldo:', data); // para debug
    // Garantir que seja número
    if (data && typeof data.saldo === 'number') {
      saldoAtual = data.saldo;
    } else if (data && data.saldo) {
      // tentar converter se for string
      saldoAtual = parseFloat(data.saldo) || 0;
    }
    saldoAtualEl.textContent = `R$ ${saldoAtual.toFixed(2)}`;
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    saldoAtual = 0;
    saldoAtualEl.textContent = 'R$ 0,00';
  }

  function atualizarValor(valor) {
    // Garantir que valor seja número
    const valorNum = parseFloat(valor);
    if (isNaN(valorNum)) return;

    const bonus = valorNum * 0.10;
    const valorComBonus = valorNum + bonus;
    // Garantir que saldoAtual seja número
    const saldoAtualNum = typeof saldoAtual === 'number' ? saldoAtual : 0;
    const saldoFinal = saldoAtualNum + valorComBonus;

    if (valorExibido) valorExibido.textContent = `R$ ${valorNum.toFixed(2)}`;
    if (bonusExibido) bonusExibido.textContent = `Bônus de 10%: R$ ${bonus.toFixed(2)}`;
    if (saldoApos) saldoApos.textContent = `R$ ${saldoFinal.toFixed(2)}`;
    if (infoBonus) infoBonus.textContent = `+ R$ ${valorNum.toFixed(2)} + R$ ${bonus.toFixed(2)} bônus`;

    botoesRapidos.forEach(btn => {
      btn.classList.remove('selecionado');
      const btnValor = parseFloat(btn.dataset.valor);
      if (btnValor === valorNum) btn.classList.add('selecionado');
    });

    if (slider && parseFloat(slider.value) !== valorNum) slider.value = valorNum;
  }

  if (slider) {
    slider.addEventListener('input', function() {
      atualizarValor(this.value);
    });
  }

  botoesRapidos.forEach(btn => {
    btn.addEventListener('click', function() {
      atualizarValor(this.dataset.valor);
    });
  });

  // Inicializa com valor padrão
  atualizarValor(108);

  // ========== FUNÇÃO MODIFICADA ==========
  function mostrarEtapa(etapa) {
    if (!etapa1 || !etapa2 || !etapa3 || !indicadores[1] || !indicadores[2] || !indicadores[3]) return;

    // Esconde todas as etapas forçando display none
    etapa1.style.display = 'none';
    etapa2.style.display = 'none';
    etapa3.style.display = 'none';
    etapa2.classList.remove('visivel');
    etapa3.classList.remove('visivel');

    // Reseta indicadores
    indicadores[1].classList.remove('ativa');
    indicadores[2].classList.remove('ativa');
    indicadores[3].classList.remove('ativa');

    // Mostra a etapa selecionada
    if (etapa === 1) {
      etapa1.style.display = 'block';
      indicadores[1].classList.add('ativa');
    } else if (etapa === 2) {
      etapa2.style.display = 'block';
      setTimeout(() => etapa2.classList.add('visivel'), 10);
      indicadores[2].classList.add('ativa');
    } else if (etapa === 3) {
      etapa3.style.display = 'block';
      setTimeout(() => etapa3.classList.add('visivel'), 10);
      indicadores[3].classList.add('ativa');
    }
  }
  // ========================================

  btnContinuar.addEventListener('click', function() {
    const valor = parseFloat(slider.value);
    if (isNaN(valor) || valor < 20 || valor > 200) {
      alert('Valor fora do limite permitido.');
      return;
    }
    if (valorConfirmacao) valorConfirmacao.textContent = `R$ ${valor.toFixed(2)}`;
    mostrarEtapa(2);
  });

  btnVoltar.addEventListener('click', function() {
    mostrarEtapa(1);
  });

  btnConfirmarPix.addEventListener('click', async function() {
    const valor = parseFloat(slider.value);
    if (isNaN(valor) || valor < 20 || valor > 200) {
      alert('Valor inválido.');
      return;
    }
    if (!loadingOverlay || !qrContainer) return;

    loadingOverlay.classList.add('ativo');

    try {
      const response = await fetch(`${API_URL}/criar-pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: valor,
          payerName: usuario.nome || 'Cliente GDK',
          payerDocument: '00000000000',
          description: `Recarga GDK - ${usuario.email}`
        })
      });

      const data = await response.json();
      loadingOverlay.classList.remove('ativo');

      if (data.success) {
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

  btnFechar.addEventListener('click', function() {
    mostrarEtapa(1);
  });

  mostrarEtapa(1);
});
