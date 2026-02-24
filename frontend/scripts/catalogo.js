// catalogo.js

// Função para mascarar o número do cartão: mostra apenas os primeiros 6 dígitos
function mascararNumero(numeroCompleto) {
    // Garante que temos uma string
    const numStr = String(numeroCompleto);
    // Pega os primeiros 6 dígitos
    const primeiros6 = numStr.substring(0, 6);
    // Formata como: "4066 69•• •••• ••••"
    return primeiros6.replace(/(\d{4})(\d{2})/, '$1 $2') + '•• •••• ••••';
}

// Função para renderizar os cards a partir do estoque
function renderizarCatalogo(produtos) {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    grid.innerHTML = '';

    if (!produtos || produtos.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: #aaa;">
                <i class="fas fa-credit-card" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3 style="font-size: 1.8rem; font-weight: 500; margin-bottom: 0.5rem; color: #fff;">Nenhum cartão disponível</h3>
                <p style="font-size: 1.1rem;">Novos cartões serão adicionados em breve.</p>
            </div>
        `;
        document.getElementById('cardCount').textContent = '0';
        document.getElementById('totalCards').textContent = '0';
        return;
    }

    produtos.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'card-item';
        card.dataset.cardId = prod.id;
        card.dataset.bin = prod.numeroCompleto.substring(0, 6); // armazena BIN
        card.dataset.validity = prod.validade;
        card.dataset.level = prod.nivel;
        card.dataset.bank = prod.banco;
        card.dataset.price = prod.preco;

        const numeroMascarado = mascararNumero(prod.numeroCompleto);

        card.innerHTML = `
            <div class="card-badge">BIN</div>
            <div class="card-number">${numeroMascarado}</div>
            <div class="card-detail-row">
                <span>Validade <strong class="card-validity">${prod.validade}</strong></span>
            </div>
            <div class="card-detail-row">
                <span class="card-level">${prod.nivel}</span> • ${prod.bandeira}
            </div>
            <div class="card-bank">
                Banco <span class="card-bank-name">${prod.banco}</span>
            </div>
            <div class="card-price">R$ ${prod.preco.toFixed(2)}</div>
            <button class="btn-buy" data-card-id="${prod.id}">Comprar</button>
        `;

        grid.appendChild(card);
    });

    // Atualiza contadores
    document.getElementById('cardCount').textContent = produtos.length;
    document.getElementById('totalCards').textContent = produtos.length;
}

// Função para configurar eventos
function configurarEventos() {
    // Compra (delegação)
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-buy');
        if (!btn) return;
        e.preventDefault();
        const card = btn.closest('.card-item');
        if (!card) return;

        const cardData = {
            id: card.dataset.cardId,
            bin: card.dataset.bin,
            validity: card.dataset.validity,
            level: card.dataset.level,
            bank: card.dataset.bank,
            price: parseFloat(card.dataset.price)
        };

        console.log('Dados do cartão:', cardData);
        alert(`🛒 Compra simulada\n\nBanco: ${cardData.bank}\nBIN: ${cardData.bin}\nValidade: ${cardData.validity}\nNível: ${cardData.level}\nPreço: R$ ${cardData.price.toFixed(2)}`);
    });

    // Paginação simulada
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Newsletter
    const form = document.getElementById('newsletter-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]')?.value;
            if (email) alert(`📬 Inscrição simulada: ${email}`);
            this.reset();
        });
    }
}

// Inicialização: usa a variável global estoqueProdutos (definida em estoque.js)
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se a variável global existe
    if (typeof estoqueProdutos !== 'undefined') {
        renderizarCatalogo(estoqueProdutos);
    } else {
        console.error('Estoque não carregado. Verifique se estoque.js foi incluído.');
        renderizarCatalogo([]); // mostra mensagem de vazio
    }
    configurarEventos();
});