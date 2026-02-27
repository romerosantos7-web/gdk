// perfil.js - Versão com dados 100% reais da API
document.addEventListener('DOMContentLoaded', async function() {
    // ===== VERIFICAÇÃO DE LOGIN =====
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = 'login.html';
        return;
    }

    const usuarioSessao = JSON.parse(usuarioLogado);
    const userId = usuarioSessao.id;
    const API_URL = 'https://gdk.onrender.com/api';

    // ===== ELEMENTOS DO DOM =====
    const elements = {
        userName: document.getElementById('user-name'),
        userEmail: document.getElementById('user-email'),
        userAvatar: document.getElementById('user-avatar'),
        membroDesde: document.getElementById('membro-desde'),
        saldo: document.getElementById('saldo-disponivel'),
        totalGasto: document.getElementById('total-gasto'),
        totalCompras: document.getElementById('total-compras'),
        historyBody: document.getElementById('history-body'),
        historyLoading: document.getElementById('history-loading'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        pagination: document.getElementById('pagination')
    };

    // ===== ESTADO DA APLICAÇÃO =====
    let state = {
        usuario: null,
        saldo: 0,
        transacoes: [],
        filtroAtual: 'all',
        paginaAtual: 1,
        itensPorPagina: 5
    };

    // ===== FUNÇÕES AUXILIARES =====
    function setLoading(mostrar) {
        if (elements.historyLoading) {
            elements.historyLoading.style.display = mostrar ? 'flex' : 'none';
        }
    }

    function mostrarErro(mensagem) {
        const alerta = document.createElement('div');
        alerta.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #b22222;
            color: white;
            padding: 1rem 2rem;
            border-radius: 30px;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        alerta.textContent = mensagem;
        document.body.appendChild(alerta);
        setTimeout(() => alerta.remove(), 3000);
    }

    // ===== FUNÇÕES DA API =====
    
    async function carregarDadosUsuario() {
        try {
            const response = await fetch(`${API_URL}/usuario/${userId}`);
            if (!response.ok) throw new Error('Erro ao buscar usuário');
            state.usuario = await response.json();
        } catch (error) {
            console.error('Erro:', error);
            state.usuario = usuarioSessao; // fallback para dados da sessão
        }
    }

    async function carregarSaldo() {
        try {
            const response = await fetch(`${API_URL}/saldo/${userId}`);
            if (!response.ok) throw new Error('Erro ao buscar saldo');
            const data = await response.json();
            state.saldo = data.saldo || 0;
        } catch (error) {
            console.error('Erro ao buscar saldo:', error);
            state.saldo = 0;
        }
    }

    async function carregarHistorico() {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/historico/${userId}`);
            if (!response.ok) throw new Error('Erro ao buscar histórico');
            const data = await response.json();
            state.transacoes = data.transacoes || [];
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            state.transacoes = [];
            mostrarErro('Erro ao carregar histórico');
        } finally {
            setLoading(false);
            renderizarHistorico();
        }
    }

    // ===== FUNÇÕES DE RENDERIZAÇÃO =====
    
    function renderizarInfoUsuario() {
        const nome = state.usuario?.nome || usuarioSessao.nome || 'Usuário';
        const email = state.usuario?.email || usuarioSessao.email;
        
        if (elements.userName) elements.userName.textContent = nome;
        if (elements.userEmail) elements.userEmail.textContent = email;
        
        if (elements.userAvatar) {
            const iniciais = nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            elements.userAvatar.src = `https://ui-avatars.com/api/?name=${iniciais}&size=120&background=00cc88&color=fff&bold=true&length=2`;
        }
        
        if (elements.membroDesde) {
            const ano = state.usuario?.criadoEm 
                ? new Date(state.usuario.criadoEm).getFullYear() 
                : '2025';
            elements.membroDesde.textContent = ano;
        }
    }

    function renderizarSaldo() {
        if (elements.saldo) {
            elements.saldo.textContent = `R$ ${state.saldo.toFixed(2)}`;
        }
    }

    function calcularEstatisticas() {
        const compras = state.transacoes.filter(t => t.tipo === 'compra');
        const totalGasto = compras.reduce((acc, t) => acc + (t.valor || 0), 0);
        const totalCompras = compras.length;

        if (elements.totalGasto) {
            elements.totalGasto.textContent = `R$ ${totalGasto.toFixed(2)}`;
        }
        if (elements.totalCompras) {
            elements.totalCompras.textContent = totalCompras;
        }
    }

    function renderizarHistorico() {
        if (!elements.historyBody) return;

        // Aplica filtro
        const dadosFiltrados = state.filtroAtual === 'all' 
            ? state.transacoes 
            : state.transacoes.filter(t => t.tipo === state.filtroAtual);

        // Ordena por data (mais recente primeiro)
        dadosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

        // Paginação
        const inicio = (state.paginaAtual - 1) * state.itensPorPagina;
        const fim = inicio + state.itensPorPagina;
        const dadosPaginados = dadosFiltrados.slice(inicio, fim);
        const totalPaginas = Math.ceil(dadosFiltrados.length / state.itensPorPagina);

        elements.historyBody.innerHTML = dadosPaginados.length 
            ? dadosPaginados.map(t => templateLinha(t)).join('')
            : templateVazio();

        renderizarPaginacao(totalPaginas);
        calcularEstatisticas();
    }

    function templateLinha(transacao) {
        const data = new Date(transacao.data).toLocaleDateString('pt-BR');
        const hora = new Date(transacao.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const tipoIcon = transacao.tipo === 'compra' ? 'fa-credit-card' : 'fa-coins';
        const tipoTexto = transacao.tipo === 'compra' ? 'Compra' : 'Recarga';
        const statusClass = transacao.status === 'pendente' ? 'status-pendente' : 'status-concluido';
        const statusIcon = transacao.status === 'pendente' ? 'fa-clock' : 'fa-check-circle';
        const statusTexto = transacao.status === 'pendente' ? 'Pendente' : 'Concluído';
        
        return `
            <tr>
                <td>${data}<br><small style="color:#666;">${hora}</small></td>
                <td>
                    <span class="transaction-type type-${transacao.tipo}">
                        <i class="fas ${tipoIcon}"></i>
                        ${tipoTexto}
                    </span>
                </td>
                <td>${transacao.descricao}</td>
                <td class="transaction-value">R$ ${transacao.valor.toFixed(2)}</td>
                <td>
                    <span class="transaction-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i>
                        ${statusTexto}
                    </span>
                </td>
                <td class="transaction-method">${transacao.metodo || '-'}</td>
            </tr>
        `;
    }

    function templateVazio() {
        return `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.5;"></i>
                    <p>Nenhuma transação encontrada</p>
                </td>
            </tr>
        `;
    }

    function renderizarPaginacao(totalPaginas) {
        if (!elements.pagination) return;
        if (totalPaginas <= 1) {
            elements.pagination.style.display = 'none';
            return;
        }

        elements.pagination.style.display = 'flex';
        let html = '';
        for (let i = 1; i <= totalPaginas; i++) {
            html += `<button class="page-btn ${i === state.paginaAtual ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        elements.pagination.innerHTML = html;

        elements.pagination.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.paginaAtual = parseInt(btn.dataset.page);
                renderizarHistorico();
            });
        });
    }

    // ===== EVENTOS =====
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.filtroAtual = e.target.dataset.filter;
            state.paginaAtual = 1;
            renderizarHistorico();
        });
    });

    // ===== INICIALIZAÇÃO =====
    try {
        await Promise.all([
            carregarDadosUsuario(),
            carregarSaldo(),
            carregarHistorico()
        ]);
        
        renderizarInfoUsuario();
        renderizarSaldo();
        
    } catch (error) {
        console.error('Erro na inicialização:', error);
        mostrarErro('Erro ao carregar perfil');
    }
});
