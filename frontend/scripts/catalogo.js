// catalogo.js - Versão com compra real via API
const API_URL = 'https://gdk.onrender.com/api';

function mascararNumero(numeroCompleto) {
    const numStr = String(numeroCompleto);
    const primeiros6 = numStr.substring(0, 6);
    return primeiros6.replace(/(\d{4})(\d{2})/, '$1 $2') + '•• •••• ••••';
}

function renderizarCatalogo(produtos) {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!produtos || produtos.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:4rem; color:#aaa;">Nenhum cartão disponível</div>';
        document.getElementById('cardCount').textContent = '0';
        document.getElementById('totalCards').textContent = '0';
        return;
    }
    
    produtos.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'card-item';
        card.dataset.cardId = prod.id;
        card.dataset.preco = prod.preco;
        card.dataset.descricao = `${prod.nivel} ${prod.banco}`;

        const numeroMascarado = mascararNumero(prod.numeroCompleto);
        
        card.innerHTML = `
            <div class="card-badge">BIN</div>
            <div class="card-number">${numeroMascarado}</div>
            <div class="card-detail-row">
                <span>Validade <strong>${prod.validade}</strong></span>
            </div>
            <div class="card-detail-row">
                <span>${prod.nivel}</span> • ${prod.bandeira}
            </div>
            <div class="card-bank">
                Banco <span>${prod.banco}</span>
            </div>
            <div class="card-price">R$ ${prod.preco.toFixed(2)}</div>
            <button class="btn-buy" data-card-id="${prod.id}">Comprar</button>
        `;
        
        grid.appendChild(card);
    });
    
    document.getElementById('cardCount').textContent = produtos.length;
    document.getElementById('totalCards').textContent = produtos.length;
}

// Função para mostrar loading
function mostrarLoading(mensagem = 'Processando...') {
    const overlay = document.createElement('div');
    overlay.id = 'compra-loading';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    overlay.innerHTML = `
        <div style="background: #111; padding: 2rem; border-radius: 40px; text-align: center; border: 1px solid #333;">
            <div class="spinner" style="border: 4px solid #333; border-top: 4px solid #fff; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p style="color: #fff;">${mensagem}</p>
        </div>
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;
    document.body.appendChild(overlay);
}

function removerLoading() {
    const loading = document.getElementById('compra-loading');
    if (loading) loading.remove();
}

// Função de compra real
async function comprarCartao(cardId, preco, descricao) {
    // Verifica login
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        alert('Você precisa estar logado para comprar');
        window.location.href = 'login.html';
        return;
    }
    
    const usuario = JSON.parse(usuarioLogado);
    
    // Confirmação
    if (!confirm(`Deseja comprar este cartão por R$ ${preco.toFixed(2)}?`)) {
        return;
    }
    
    mostrarLoading('Processando compra...');
    
    try {
        const response = await fetch(`${API_URL}/comprar-cartao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioId: usuario.id,
                cartaoId: cardId,
                valor: preco,
                descricao: descricao
            })
        });
        
        const data = await response.json();
        removerLoading();
        
        if (data.success) {
            // Atualiza saldo no sessionStorage
            usuario.saldo = data.novoSaldo;
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuario));
            
            // Mostra sucesso
            alert(`✅ Compra realizada com sucesso!\n\nCartão: ${descricao}\nValor: R$ ${preco.toFixed(2)}\nNovo saldo: R$ ${data.novoSaldo.toFixed(2)}`);
            
            // Opcional: atualiza a página ou redireciona
            // window.location.reload();
        } else {
            alert('❌ Erro: ' + (data.error || 'Não foi possível completar a compra'));
        }
    } catch (error) {
        removerLoading();
        alert('❌ Erro de conexão com o servidor');
        console.error('Erro na compra:', error);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Carrega produtos do estoque
    if (typeof estoqueProdutos !== 'undefined') {
        renderizarCatalogo(estoqueProdutos);
    } else {
        renderizarCatalogo([]);
    }

    // Event listener para botões de compra (delegação)
    document.addEventListener('click', async function(e) {
        const btn = e.target.closest('.btn-buy');
        if (!btn) return;
        
        e.preventDefault();
        
        // Pega os dados do card
        const card = btn.closest('.card-item');
        if (!card) return;
        
        const cardId = btn.dataset.cardId;
        const preco = parseFloat(card.dataset.preco);
        const descricao = card.dataset.descricao || 'Cartão digital';
        
        // Chama a função de compra real
        await comprarCartao(cardId, preco, descricao);
    });
});
