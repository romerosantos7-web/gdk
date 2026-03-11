// click-spark.js - Efeito de partículas ao clicar (versão HTML puro)
class ClickSpark {
    constructor(options = {}) {
        this.options = {
            sparkColor: options.sparkColor || '#ffffff',
            sparkSize: options.sparkSize || 10,
            sparkRadius: options.sparkRadius || 15,
            sparkCount: options.sparkCount || 8,
            duration: options.duration || 400,
            easing: options.easing || 'ease-out',
            extraScale: options.extraScale || 1,
            ...options
        };
        
        this.init();
    }
    
    init() {
        // Cria o container para as partículas
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999999;
            overflow: hidden;
        `;
        document.body.appendChild(this.container);
        
        // Adiciona evento de clique
        document.addEventListener('click', (e) => this.createSpark(e));
    }
    
    createSpark(e) {
        const { clientX, clientY } = e;
        const { sparkColor, sparkSize, sparkRadius, sparkCount, duration, easing, extraScale } = this.options;
        
        for (let i = 0; i < sparkCount; i++) {
            const angle = (i / sparkCount) * Math.PI * 2;
            const velocity = sparkRadius * (0.8 + Math.random() * 0.4);
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            const delay = (i / sparkCount) * 0.1;
            const scale = extraScale * (0.8 + Math.random() * 0.4);
            
            const spark = document.createElement('div');
            spark.style.cssText = `
                position: absolute;
                left: ${clientX}px;
                top: ${clientY}px;
                width: ${sparkSize}px;
                height: ${sparkSize}px;
                background: ${sparkColor};
                border-radius: 50%;
                box-shadow: 0 0 ${sparkSize * 2}px ${sparkColor};
                transform: translate(-50%, -50%);
                pointer-events: none;
                opacity: 1;
                transition: transform ${duration}ms ${easing}, opacity ${duration}ms ${easing};
                transform: translate(-50%, -50%) scale(1);
                will-change: transform, opacity;
            `;
            
            this.container.appendChild(spark);
            
            // Anima a partícula
            requestAnimationFrame(() => {
                spark.style.transform = `translate(calc(-50% + ${vx}px), calc(-50% + ${vy}px)) scale(${scale})`;
                spark.style.opacity = '0';
            });
            
            // Remove após a animação
            setTimeout(() => {
                if (spark.parentNode) spark.remove();
            }, duration + 50);
        }
    }
    
    // Método para destruir/remover o efeito
    destroy() {
        if (this.container && this.container.parentNode) {
            document.removeEventListener('click', this.createSpark);
            this.container.remove();
        }
    }
}

// Inicializa automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Você pode personalizar aqui as opções
    window.clickSpark = new ClickSpark({
        sparkColor: '#ffffff',    // Cor das partículas (branco)
        sparkSize: 8,             // Tamanho de cada partícula
        sparkRadius: 30,          // Distância que as partículas se espalham
        sparkCount: 8,            // Número de partículas por clique
        duration: 500,            // Duração da animação em ms
        easing: 'ease-out',       // Curva de animação
        extraScale: 1.2           // Escala extra no final
    });
});
