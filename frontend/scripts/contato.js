// contato.js
document.addEventListener('DOMContentLoaded', function() {
    // Pequeno efeito: ao clicar em um card, podemos registrar um evento (opcional)
    const cards = document.querySelectorAll('.contact-card');
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Se quiser fazer tracking, descomente abaixo:
            // const rede = this.querySelector('h3')?.textContent;
            // console.log(`Clique em contato: ${rede}`);
            // O link já abre normalmente, pois é um <a>
        });
    });

    // Newsletter (reaproveitando função do script.js se existir, mas mantendo aqui)
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]')?.value;
            if (email) {
                alert(`📬 Inscrição simulada: ${email}`);
                this.reset();
            }
        });
    }
});