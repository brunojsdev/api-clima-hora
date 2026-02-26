/**
 * ==========================================================
 * SEÇÃO 1: GERENCIAMENTO DO RELÓGIO E DATA
 * ==========================================================
 */

// Adiciona zero à esquerda para números menores que 10
const formatZero = (num) => (num < 10 ? `0${num}` : num);

function updateClock() {
    const now = new Date();
    
    // Captura dos elementos do DOM
    const hrsEl = document.getElementById("hrs");
    const minEl = document.getElementById("min");
    const secEl = document.getElementById("sec");
    const dateEl = document.getElementById("date");

    // Atualização do Tempo
    if (hrsEl) hrsEl.innerText = formatZero(now.getHours());
    if (minEl) minEl.innerText = formatZero(now.getMinutes());
    if (secEl) secEl.innerText = formatZero(now.getSeconds());
    
    // Atualização da Data (Padrão: Seg, 24 de Mai de 2024)
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' };
    let dateString = now.toLocaleDateString('pt-BR', options).replace(/\./g, '');
    if (dateEl) dateEl.innerText = dateString;
}

// Inicia o relógio imediatamente e define intervalo de 1s
setInterval(updateClock, 1000);
updateClock();


/**
 * ==========================================================
 * SEÇÃO 2: LÓGICA DO WIDGET DE CLIMA
 * ==========================================================
 */

const weatherMocks = [
    { icon: "☀️", temp: "28°C" },
    { icon: "⛅", temp: "24°C" },
    { icon: "🌧️", temp: "19°C" },
    { icon: "🌩️", temp: "21°C" },
    { icon: "☁️", temp: "18°C" }
];

function fetchWeather() {
    const btn = document.getElementById("btn-update");
    const iconEl = document.getElementById("w-icon");
    const tempEl = document.getElementById("w-temp");

    // Estado Visual: Carregando
    btn.innerText = "AGUARDE..."; 
    btn.disabled = true;
    iconEl.style.opacity = "0.3";
    tempEl.style.opacity = "0.3";

    // Simulação de delay de rede (1 segundo)
    setTimeout(() => {
        const randomWeather = weatherMocks[Math.floor(Math.random() * weatherMocks.length)];
        
        iconEl.innerText = randomWeather.icon;
        tempEl.innerText = randomWeather.temp;
        
        iconEl.style.opacity = "1";
        tempEl.style.opacity = "1";
        btn.innerText = "atualizar"; 
        btn.disabled = false;
    }, 1000);
}


/**
 * ==========================================================
 * SEÇÃO 3: ANIMAÇÃO DE FUNDO (DIGITAL RAIN)
 * ==========================================================
 */

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

// Paleta de cores extraída da raiz do CSS
const rainColors = ['#00ff88', '#00d2ff', '#b0d15a', '#005544'];

/**
 * Reajusta o tamanho do canvas para preencher a janela
 */
function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

/**
 * Classe que define o comportamento de cada quadrado cadente
 */
class SquareParticle {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * width;
        this.y = Math.random() * height - height; // Começa acima da tela
        this.size = Math.random() * 15 + 5;
        this.speed = Math.random() * 2 + 0.5;
        this.color = rainColors[Math.floor(Math.random() * rainColors.length)];
        this.opacity = Math.random() * 0.5 + 0.1;
    }

    update() {
        this.y += this.speed;
        // Reinicia no topo se sair por baixo
        if (this.y > height) {
            this.init();
            this.y = -20;
        }
    }

    draw() {
        ctx.globalAlpha = this.opacity;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        
        // Desenha apenas o contorno
        ctx.strokeRect(this.x, this.y, this.size, this.size);
        
        // Efeito Glitch: Ocasionalmente preenche o quadrado
        if (Math.random() > 0.98) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
        ctx.globalAlpha = 1;
    }
}

/**
 * Cria a lista de partículas baseada na largura da tela
 */
function setupRain() {
    particles = [];
    const density = Math.floor(width / 12); // Quantidade de quadrados
    for (let i = 0; i < density; i++) {
        particles.push(new SquareParticle());
    }
}

/**
 * Loop principal de animação
 */
function renderFrame() {
    ctx.clearRect(0, 0, width, height); // Limpa o frame anterior
    
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    requestAnimationFrame(renderFrame);
}

// Inicialização da Animação
window.addEventListener('resize', () => {
    resizeCanvas();
    setupRain();
});

// Execução imediata
resizeCanvas();
setupRain();
renderFrame();
