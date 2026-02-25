// script.js - Versão unificada e otimizada

// ===== UTILITÁRIOS =====
function mostrarMensagem(texto, tipo = 'info') {
    // Função auxiliar para exibir mensagens (pode ser expandida)
    console.log(`[${tipo}] ${texto}`);
}

// ===== EFEITOS DE ANIMAÇÃO =====
function aplicarEfeitoCards() {
    const cards = document.querySelectorAll('.card-sample');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.3s ease';
        });
    });
}

function aplicarScrollFade() {
    const fadeElements = document.querySelectorAll('.fade-scroll');
    if (fadeElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Para de observar após ativar
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -30px 0px'
    });

    fadeElements.forEach(el => observer.observe(el));
}

// ===== GERENCIAMENTO DE HEADER (LOGIN/SALDO) =====
function atualizarHeader() {
    const userArea = document.getElementById('user-area');
    if (!userArea) return;

    const usuarioLogado = sessionStorage.getItem('usuarioLogado');

    if (usuarioLogado) {
        const usuario = JSON.parse(usuarioLogado);
        // Exibe email, botão de saldo e dropdown
        userArea.innerHTML = `
            <div class="header-balance">
                <button class="btn-add-saldo" onclick="window.location.href='recarga.html'">
                    <i class="fas fa-plus-circle"></i> Adicionar saldo
                </button>
            </div>
            <div class="user-dropdown">
                <button class="btn-user" id="userDropdownBtn">
                    <i class="fas fa-user-circle"></i> ${usuario.email} <i class="fas fa-chevron-down"></i>
                </button>
                <div class="dropdown-content" id="dropdownMenu">
                    <a href="#" id="btn-perfil"><i class="fas fa-id-card"></i> Acessar perfil</a>
                    <a href="#" id="btn-sair"><i class="fas fa-sign-out-alt"></i> Sair</a>
                </div>
            </div>
        `;

        // Configurar dropdown
        const dropdownBtn = document.getElementById('userDropdownBtn');
        const dropdownMenu = document.getElementById('dropdownMenu');

        if (dropdownBtn && dropdownMenu) {
            dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                    dropdownMenu.classList.remove('show');
                }
            });
        }

        // Botão sair
        const btnSair = document.getElementById('btn-sair');
        if (btnSair) {
            btnSair.addEventListener('click', (e) => {
                e.preventDefault();
                sessionStorage.removeItem('usuarioLogado');
                atualizarHeader();
                window.location.href = 'index.html';
            });
        }

        // Botão perfil (placeholder)
        const btnPerfil = document.getElementById('btn-perfil');
        if (btnPerfil) {
            btnPerfil.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Página de perfil em construção!');
            });
        }
    } else {
        // Usuário não logado: apenas botão de login
        userArea.innerHTML = `
            <button class="btn-outline" onclick="window.location.href='login.html'">
                Entrar
            </button>
        `;
    }
}

// ===== EVENTOS GLOBAIS (BOTÕES, NEWSLETTER, SCROLL) =====
function configurarEventosGlobais() {
    // Newsletter
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.querySelector('input[type="email"]')?.value;
            if (email) {
                alert(`Obrigado por se inscrever, ${email}! (Simulação)`);
                e.target.reset();
            }
        });
    }

    // Botões principais (simulação de ações)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-primary, .btn-secondary, .btn-outline, .btn-large');
        if (!btn) return;

        // Evita que botões com links sejam interceptados
        if (btn.tagName === 'A' || btn.closest('a')) return;

        e.preventDefault();

        const texto = btn.innerText.toLowerCase();
        if (texto.includes('entrar')) {
            window.location.href = 'login.html';
        } else if (texto.includes('comprar cartão') || texto.includes('começar')) {
            window.location.href = 'catalogo.html';
        } else if (texto.includes('ver catálogo')) {
            window.location.href = 'catalogo.html';
        } else if (texto.includes('conhecer planos')) {
            alert('Abrir página de planos (simulação)');
        } else {
            console.log('Botão clicado:', texto);
        }
    });
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado. Inicializando...');

    // Animações e efeitos
    aplicarEfeitoCards();
    aplicarScrollFade();

    // Header dinâmico
    atualizarHeader();

    // Eventos globais
    configurarEventosGlobais();

    // Destaque no menu conforme scroll (opcional)
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-menu a');
    if (sections.length && navLinks.length) {
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.clientHeight;
                if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }
});