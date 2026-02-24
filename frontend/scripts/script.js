(function() {
    // Efeito suave nos cards
    const cards = document.querySelectorAll('.card-sample');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.3s ease';
        });
    });

    // Simulação de envio do formulário de newsletter
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            if (email) {
                alert(`Obrigado por se inscrever, ${email}! (Simulação)`);
                this.reset();
            }
        });
    }

    // Botões principais (alerts de simulação)
    const primaryButtons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-outline, .btn-large');
    primaryButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.classList.contains('btn-outline') && this.innerText.includes('Entrar')) {
                alert('Redirecionar para login (simulação)');
            } else if (this.innerText.includes('Criar cartão') || this.innerText.includes('Começar')) {
                alert('Iniciar criação de cartão (simulação)');
            } else if (this.innerText.includes('Conhecer planos')) {
                alert('Abrir página de planos (simulação)');
            } else {
                // Evita comportamento padrão apenas para simulação, mas permite links
                e.preventDefault();
            }
        });
    });

    // Destaque no menu conforme scroll (simples)
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-menu a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
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
})();

// Efeito de scroll fade-in (versão robusta com logs para diagnóstico)
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, procurando elementos .fade-scroll');
    const fadeElements = document.querySelectorAll('.fade-scroll');
    console.log('Encontrados', fadeElements.length, 'elementos com fade-scroll');
    
    if (fadeElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.log('Elemento:', entry.target, 'isIntersecting:', entry.isIntersecting);
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    console.log('Classe VISIBLE adicionada a', entry.target);
                    // Opcional: parar de observar após aparecer (comentado para debug)
                    // observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1, // 10% visível
            rootMargin: '0px 0px -10px 0px' // margem negativa pequena para evitar ativação precoce
        });

        fadeElements.forEach(el => observer.observe(el));
    } else {
        console.warn('Nenhum elemento com classe .fade-scroll encontrado');
    }
});