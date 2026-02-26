// perfil.js - Gerenciamento completo da página de perfil com API real

class PerfilManager {
    constructor() {
        this.usuario = null;
        this.historico = [];
        this.filtroAtual = 'all';
        this.paginaAtual = 1;
        this.itensPorPagina = 5;
        this.API_URL = 'https://gdk.onrender.com/api';
        
        this.carregarElementos();
        this.init();
    }

    carregarElementos() {
        // Informações do usuário
        this.userNameEl = document.getElementById('user-name');
        this.userEmailEl = document.getElementById('user-email');
        this.userAvatarEl = document.getElementById('user-avatar');
        this.membroDesdeEl = document.getElementById('membro-desde');
        
        // Cards de estatísticas
        this.saldoEl = document.getElementById('saldo-disponivel');
        this.totalGastoEl = document.getElementById('total-gasto');
        this.totalComprasEl = document.getElementById('total-compras');
        
        // Histórico
        this.historyBody = document.getElementById('history-body');
        this.historyLoading = document.getElementById('history-loading');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.paginationContainer = document.getElementById('pagination');
    }

    async init() {
        // Verifica se usuário está logado
        const usuarioLogado = sessionStorage.getItem('usuarioLogado');
        if (!usuarioLogado) {
            window.location.href = 'login.html';
            return;
        }

        try {
            this.usuario = JSON.parse(usuarioLogado);
            
            // Carrega dados completos do usuário da API
            await this.carregarDadosUsuario();
            
            // Carrega histórico da API
            await this.carregarHistorico();
            
            // Configura eventos
            this.configurarEventos();
            
            // Renderiza informações
            this.renderizarInfoUsuario();
            this.renderizarEstatisticas();
            this.renderizarHistorico();
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.mostrarErro('Erro ao carregar perfil. Tente novamente.');
        }
    }

    async carregarDadosUsuario() {
        try {
            // Busca dados completos do usuário (se tiver rota)
            // Se não tiver, usa os dados do sessionStorage
            const response = await fetch(`${this.API_URL}/usuario/${this.usuario.id}`);
            if (response.ok) {
                const data = await response.json();
                this.usuario = { ...this.usuario, ...data };
            }
            
            // Busca saldo atualizado
            const saldoResponse = await fetch(`${this.API_URL}/saldo/${this.usuario.id}`);
            if (saldoResponse.ok) {
                const saldoData = await saldoResponse.json();
                this.usuario.saldo = saldoData.saldo || 0;
            }
            
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            this.usuario.saldo = this.usuario.saldo || 0;
        }
    }

    async carregarHistorico() {
        this.mostrarLoadingHistorico(true);
        
        try {
            // Busca histórico real da API
            const response = await fetch(`${this.API_URL}/historico/${this.usuario.id}`);
            
            if (response.ok) {
                const data = await response.json();
                this.historico = data.transacoes || [];
            } else {
                // Se não tiver histórico, usa array vazio
                this.historico = [];
                console.log('Nenhum histórico encontrado');
            }
            
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            this.historico = [];
            this.mostrarErro('Erro ao carregar histórico');
            
        } finally {
            this.mostrarLoadingHistorico(false);
        }
    }

    renderizarInfoUsuario() {
        if (this.userNameEl) {
            this.userNameEl.textContent = this.usuario.nome || 'Usuário GDK';
        }
        if (this.userEmailEl) {
            this.userEmailEl.textContent = this.usuario.email;
        }
        
        // Atualiza o avatar com as iniciais do usuário
        if (this.userAvatarEl) {
            const iniciais = this.usuario.nome 
                ? this.usuario.nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                : 'GD';
            this.userAvatarEl.src = `https://ui-avatars.com/api/?name=${iniciais}&size=120&background=00cc88&color=fff&bold=true&length=2`;
        }
        
        // Data de cadastro (se vier da API)
        if (this.membroDesdeEl) {
            const dataCadastro = this.usuario.criadoEm 
                ? new Date(this.usuario.criadoEm).getFullYear() 
                : '2025';
            this.membroDesdeEl.textContent = dataCadastro;
        }
    }

    renderizarEstatisticas() {
        // Calcula totais a partir do histórico real
        const compras = this.historico.filter(item => item.tipo === 'compra');
        const totalGasto = compras.reduce((acc, item) => acc + (item.valor || 0), 0);
        const totalCompras = compras.length;
        
        // Atualiza elementos
        if (this.saldoEl) {
            this.saldoEl.textContent = `R$ ${(this.usuario.saldo || 0).toFixed(2)}`;
        }
        if (this.totalGastoEl) {
            this.totalGastoEl.textContent = `R$ ${totalGasto.toFixed(2)}`;
        }
        if (this.totalComprasEl) {
            this.totalComprasEl.textContent = totalCompras;
        }
    }

    renderizarHistorico() {
        if (!this.historyBody) return;

        // Filtra dados
        const dadosFiltrados = this.filtroAtual === 'all' 
            ? this.historico 
            : this.historico.filter(item => item.tipo === this.filtroAtual);

        // Aplica paginação
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const dadosPaginados = dadosFiltrados.slice(inicio, fim);
        
        // Calcula total de páginas
        const totalPaginas = Math.ceil(dadosFiltrados.length / this.itensPorPagina);

        if (dadosPaginados.length === 0) {
            this.historyBody.innerHTML = this.templateVazio();
        } else {
            this.historyBody.innerHTML = dadosPaginados.map(item => this.templateLinha(item)).join('');
        }

        // Renderiza paginação
        this.renderizarPaginacao(totalPaginas);
    }

    templateLinha(item) {
        const tipoIcon = item.tipo === 'compra' ? 'fa-credit-card' : 'fa-coins';
        const tipoTexto = item.tipo === 'compra' ? 'Compra' : 'Recarga';
        const valor = item.valor || 0;
        const data = item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '--/--/----';
        const descricao = item.descricao || item.produto || 'Transação';
        const metodo = item.metodoPagamento || item.metodo || '-';
        
        return `
            <tr>
                <td>${data}</td>
                <td>
                    <span class="transaction-type type-${item.tipo}">
                        <i class="fas ${tipoIcon}"></i>
                        ${tipoTexto}
                    </span>
                </td>
                <td>${descricao}</td>
                <td class="transaction-value">R$ ${valor.toFixed(2)}</td>
                <td>
                    <span class="transaction-status status-${item.status || 'concluido'}">
                        <i class="fas ${item.status === 'pendente' ? 'fa-clock' : 'fa-check-circle'}"></i>
                        ${item.status === 'pendente' ? 'Pendente' : 'Concluído'}
                    </span>
                </td>
                <td class="transaction-method">${metodo}</td>
            </tr>
        `;
    }

    templateVazio() {
        return `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.5;"></i>
                    <p style="font-size: 1.1rem;">Nenhuma transação encontrada</p>
                    <p style="font-size: 0.9rem; color: #888;">Tente outro filtro ou faça uma compra</p>
                </td>
            </tr>
        `;
    }

    renderizarPaginacao(totalPaginas) {
        if (!this.paginationContainer) return;

        if (totalPaginas <= 1) {
            this.paginationContainer.style.display = 'none';
            return;
        }

        this.paginationContainer.style.display = 'flex';
        
        let html = '';
        for (let i = 1; i <= totalPaginas; i++) {
            const activeClass = i === this.paginaAtual ? 'active' : '';
            html += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
        }
        
        this.paginationContainer.innerHTML = html;
        
        // Adiciona eventos aos novos botões
        this.paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.paginaAtual = parseInt(btn.dataset.page);
                this.renderizarHistorico();
            });
        });
    }

    mostrarLoadingHistorico(mostrar) {
        if (!this.historyLoading) return;
        this.historyLoading.style.display = mostrar ? 'flex' : 'none';
    }

    configurarEventos() {
        // Filtros
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                this.filtroAtual = e.target.dataset.filter;
                this.paginaAtual = 1;
                this.renderizarHistorico();
            });
        });
    }

    mostrarErro(mensagem) {
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
            animation: slideIn 0.3s ease;
        `;
        alerta.textContent = mensagem;
        document.body.appendChild(alerta);
        
        setTimeout(() => {
            alerta.remove();
        }, 3000);
    }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new PerfilManager();
});
