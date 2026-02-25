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
  const saldoAtualEl = document.getElementById('saldo-atual');

  // URL da API (ajuste conforme necessário)
  const API_URL = 'https://gdk-backend.onrender.com/api'; // substitua pela URL do seu backend

  let saldoAtual = 0;

  // Buscar saldo atual
  try {
    const response = await fetch(`${API_URL}/saldo/${userId}`);
    const data = await response.json();
    if (data.saldo !== undefined) {
      saldoAtual = data.saldo;
      saldoAtualEl.textContent = `R$ ${saldoAtual.toFixed(2)}`;
    }
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    saldoAtualEl.textContent = `R$ 0,00`;
  }

  function atualizarValor(valor) {
    valor = parseFloat(valor) || 0;
    const bonus = valor * 0.10;
    const valorComBonus = valor + bonus;
    const saldoFinal = saldoAtual + valorComBonus;

    valorExibido.textContent = `R$ ${valor.toFixed(2)}`;
    bonusExibido.textContent = `Bônus de 10%: R$ ${bonus.toFixed(2)}`;
    saldoApos.textContent = `R$ ${saldoFinal.toFixed(2)}`;
    infoBonus.textContent = `+ R$ ${valor.toFixed(2)} + R$ ${bonus.toFixed(2)} bônus`;

    // Marca botão rápido correspondente
    botoesRapidos.forEach(btn => {
      btn.classList.remove('selecionado');
      if (parseFloat(btn.dataset.valor) === valor) {
        btn.classList.add('selecionado');
      }
    });

    // Atualiza slider (evita loop)
    if (parseFloat(slider.value) !== valor) {
      slider.value = valor;
    }
  }

  slider.addEventListener('input', () => atualizarValor(slider.value));
  botoesRapidos.forEach(btn => {
    btn.addEventListener('click', () => atualizarValor(btn.dataset.valor));
  });

  // Inicializa com valor padrão
  atualizarValor(108);

  // Botão Continuar
  btnContinuar.addEventListener('click', async function() {
    const valor = parseFloat(slider.value);
    if (valor < 20 || valor > 200) {
      alert('Valor fora do limite permitido (R$20 a R$200).');
      return;
    }

    // Solicita CPF do usuário (simplificado)
    const payerDocument = prompt('Informe seu CPF (apenas números) para gerar o PIX:');
    if (!payerDocument || payerDocument.length !== 11) {
      alert('CPF inválido. Digite 11 números.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/criar-pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: valor,
          payerName: usuario.nome,
          payerDocument,
        }),
      });

      const data = await response.json();
      if (data.success) {
        exibirQRCode(data);
      } else {
        alert('Erro ao gerar PIX: ' + (data.error || 'Tente novamente.'));
      }
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    }
  });

  function exibirQRCode(dados) {
    // Cria um modal simples
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';

    const modal = document.createElement('div');
    modal.style.background = '#111';
    modal.style.padding = '2rem';
    modal.style.borderRadius = '40px';
    modal.style.maxWidth = '400px';
    modal.style.width = '90%';
    modal.style.border = '1px solid #333';
    modal.style.color = '#fff';
    modal.style.textAlign = 'center';

    modal.innerHTML = `
      <h2 style="margin-bottom:1.5rem;">Pagamento PIX</h2>
      <img src="${dados.qrCodeBase64}" style="width:250px; height:250px; margin-bottom:1.5rem; border-radius:20px;">
      <p style="color:#aaa; margin-bottom:0.5rem;">Escaneie o QR Code ou copie o código:</p>
      <div style="background:#222; padding:1rem; border-radius:30px; margin-bottom:1rem; word-break:break-all;">
        <code style="color:#fff;">${dados.copyPaste}</code>
      </div>
      <button id="fecharQRCode" style="background:#fff; color:#000; border:none; padding:0.8rem 2rem; border-radius:40px; font-weight:600; cursor:pointer;">Fechar</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('fecharQRCode').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
  }
});