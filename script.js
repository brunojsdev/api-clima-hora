/* =========================================================================
   1. LÓGICA DO RELÓGIO
   ========================================================================= */
function updateClock() {
    const now = new Date();
    
    // Horário
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    document.getElementById('time').textContent = now.toLocaleTimeString('pt-BR', timeOptions);
    
    // Data
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('date').textContent = now.toLocaleDateString('pt-BR', dateOptions);
}

setInterval(updateClock, 1000);
updateClock(); // Chama imediatamente na inicialização


/* =========================================================================
   2. LÓGICA DE PREVISÃO DO TEMPO (Open-Meteo API)
   ========================================================================= */
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const cityNameEl = document.getElementById('city-name');
const temperatureEl = document.getElementById('temperature');
const descriptionEl = document.getElementById('description');
const weatherIconEl = document.getElementById('weather-icon');

// Mapeamento de códigos meteorológicos para Emojis e Texto
const weatherCodes = {
    0: { desc: 'Céu limpo', icon: '☀️' },
    1: { desc: 'Principalmente limpo', icon: '🌤️' },
    2: { desc: 'Parcialmente nublado', icon: '⛅' },
    3: { desc: 'Nublado', icon: '☁️' },
    45: { desc: 'Neblina', icon: '🌫️' },
    48: { desc: 'Nevoeiro', icon: '🌫️' },
    51: { desc: 'Chuvisco leve', icon: '🌧️' },
    53: { desc: 'Chuvisco moderado', icon: '🌧️' },
    55: { desc: 'Chuvisco denso', icon: '🌧️' },
    61: { desc: 'Chuva leve', icon: '🌧️' },
    63: { desc: 'Chuva moderada', icon: '🌧️' },
    65: { desc: 'Chuva forte', icon: '🌧️' },
    71: { desc: 'Neve leve', icon: '❄️' },
    73: { desc: 'Neve moderada', icon: '❄️' },
    75: { desc: 'Neve forte', icon: '❄️' },
    95: { desc: 'Tempestade', icon: '⛈️' },
    96: { desc: 'Tempestade forte', icon: '⛈️' },
    99: { desc: 'Tempestade extrema', icon: '⛈️' }
};

async function fetchWeather(city) {
    try {
        // UI de Carregamento
        cityNameEl.textContent = "Buscando...";
        temperatureEl.textContent = "--°C";
        descriptionEl.textContent = "Aguarde";
        weatherIconEl.textContent = "⏳";
        cityNameEl.classList.add('loading');

        // 1. Busca as coordenadas
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("Cidade não encontrada");
        }

        const { latitude, longitude, name, admin1, country } = geoData.results[0];
        const locationName = admin1 ? `${name}, ${admin1}` : `${name}, ${country}`;

        // 2. Busca a previsão do tempo
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weatherData = await weatherRes.json();

        const current = weatherData.current_weather;
        const code = current.weathercode;
        const weatherInfo = weatherCodes[code] || { desc: 'Desconhecido', icon: '🌍' };

        // Atualiza a Interface
        cityNameEl.textContent = locationName;
        temperatureEl.textContent = `${Math.round(current.temperature)}°C`;
        descriptionEl.textContent = weatherInfo.desc;
        weatherIconEl.textContent = weatherInfo.icon;

    } catch (error) {
        cityNameEl.textContent = "Erro na busca";
        temperatureEl.textContent = "--°C";
        descriptionEl.textContent = error.message === "Cidade não encontrada" ? "Cidade não encontrada" : "Tente novamente";
        weatherIconEl.textContent = "❌";
    } finally {
        cityNameEl.classList.remove('loading');
    }
}

// Eventos de Busca
searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== '') fetchWeather(cityInput.value);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && cityInput.value.trim() !== '') fetchWeather(cityInput.value);
});

// Inicia com uma cidade padrão
fetchWeather('São Paulo');


/* ==========================================================================
   3. ANIMAÇÃO DE FUNDO (CANVAS STARS)
   Cria um efeito de estrelas de 4 pontas caindo/piscando (Style: Sparkle)
   ========================================================================== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

// Variáveis globais de controle do Canvas
let width, height;
let particles = [];

// Paleta de cores da animação sincronizada com os DESTAQUES do CSS
const colors = ['#bbff00', '#ddff00', '#ffff00', '#ffcc00', '#ffaa00'];

/* --- FUNÇÕES DE CONTROLE DO CANVAS --- */

// Atualiza as dimensões do canvas para ocupar a tela inteira
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

/* --- CLASSE PRINCIPAL: STAR (PARTÍCULAS) --- */
class Star {
  constructor() {
    this.init();
  }

  // Inicializa ou reseta as propriedades da estrela
  init() {
    this.x = Math.random() * width;
    // Começa em uma posição Y aleatória para não caírem todas juntas no início
    this.y = Math.random() * height; 
    this.size = Math.random() * 7 + 3;          // Tamanho discreto (3px a 10px)
    this.speed = Math.random() * 1.5 + 0.5;     // Velocidade de queda suave
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.opacity = Math.random() * 0.7 + 0.3;   // Transparência variada
  }

  // Atualiza a posição da partícula a cada frame
  update() {
    this.y += this.speed;
    
    // Se a estrela sair da tela pela parte de baixo, reseta para o topo
    if (this.y > height + this.size) {
      this.x = Math.random() * width;
      this.y = -20;
      this.size = Math.random() * 7 + 3;
      this.speed = Math.random() * 1.5 + 0.5;
    }
  }

  // Desenha a estrela de 4 pontas simples (estilo losango esticado)
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.globalAlpha = this.opacity;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.2;
    
    // Proporções da estrela de 4 pontas
    const R_major = this.size;            // Pontas verticais e horizontais
    const R_minor = this.size * 0.25;     // Curvatura interna (mais fina para parecer brilho)

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      // Alterna entre raio maior e menor a cada 45 graus
      let angle = (i * Math.PI) / 4 - Math.PI / 2; 
      let radius = (i % 2 === 0) ? R_major : R_minor;

      let px = Math.cos(angle) * radius;
      let py = Math.sin(angle) * radius;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Desenha o contorno da estrela
    ctx.stroke();
    
    // Efeito de "piscar": 2% de chance de preencher a estrela neste frame
    if (Math.random() > 0.98) {
       ctx.fillStyle = this.color;
       ctx.fill();
    }
    
    ctx.restore();
  }
}

/* --- INICIALIZAÇÃO E LOOP DE ANIMAÇÃO --- */

// Preenche o array com estrelas (densidade ajustada para não poluir o texto)
function initParticles() {
  particles = [];
  const particleCount = Math.floor(width / 15); 
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Star());
  }
}

// Loop principal de renderização
function animate() {
  // Limpa o canvas
  ctx.clearRect(0, 0, width, height);
  
  // Atualiza e desenha cada estrela
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  
  requestAnimationFrame(animate);
}

/* --- EVENT LISTENERS --- */

// Recalcula o canvas ao redimensionar a janela
window.addEventListener('resize', () => {
  resize();
  initParticles();
});

/* --- START DO SCRIPT --- */
resize();         
initParticles();  
animate();
