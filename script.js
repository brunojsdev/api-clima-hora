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
   2. ANIMAÇÃO DE FUNDO (CANVAS STARS)
   Cria um efeito de estrelas de 4 pontas curvadas (Estilo Ouros)
   ========================================================================== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

// Variáveis globais de controle do Canvas
let width, height;
let particles = [];

// Paleta de cores da animação
const colors = ['#bbff00', '#ddff00', '#ffff00', '#ffcc00', '#ffaa00'];

/* --- FUNÇÕES DE CONTROLE DO CANVAS --- */

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
    this.y = Math.random() * height; 
    // Tamanho reduzido para melhor estética
    this.size = Math.random() * 4 + 3; 
    this.speed = Math.random() * 1.0 + 0.3;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.opacity = Math.random() * 0.5 + 0.3; 
  }

  // Atualiza a posição da partícula a cada frame
  update() {
    this.y += this.speed;
    
    // Se a estrela sair da tela pela parte de baixo, reseta para o topo
    if (this.y > height + 20) {
      this.x = Math.random() * width;
      this.y = -20;
    }
  }

  // Desenha a estrela de 4 pontas curvada (Gordinha e Esticada)
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.globalAlpha = this.opacity;
    
    // Proporções estilo Naipe de Ouros
    const R_y = this.size * 1.8; // Vertical esticada
    const R_x = this.size * 1.2; // Horizontal gordinha
    const c = 0.25;              // Controle da curvatura (pontas finas)

    ctx.beginPath();
    ctx.moveTo(0, -R_y);

    // Curvas que formam o corpo da estrela
    ctx.quadraticCurveTo(R_x * c, -R_y * c, R_x, 0);   
    ctx.quadraticCurveTo(R_x * c, R_y * c, 0, R_y);    
    ctx.quadraticCurveTo(-R_x * c, R_y * c, -R_x, 0); 
    ctx.quadraticCurveTo(-R_x * c, -R_y * c, 0, -R_y); 
    
    ctx.closePath();

    // Estrela Oca por padrão
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    
    // Efeito de "piscar": preenche a estrela aleatoriamente
    if (Math.random() > 0.985) {
       ctx.globalAlpha = 1;
       ctx.fillStyle = this.color;
       ctx.fill();
    }
    
    ctx.restore();
  }
}

/* --- INICIALIZAÇÃO E LOOP DE ANIMAÇÃO --- */

function initParticles() {
  particles = [];
  const particleCount = Math.floor(width / 15); 
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Star());
  }
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  
  requestAnimationFrame(animate);
}

/* --- EVENT LISTENERS --- */

window.addEventListener('resize', () => {
  resize();
  initParticles();
});

/* --- START DO SCRIPT --- */
resize();         
initParticles();  
animate();
