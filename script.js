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
   3. ANIMAÇÃO DE FUNDO (CANVAS)
   ========================================================================== */

const canvas = document.getElementById('bg-canvas');

if (canvas) {
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const colors = ['#bbff00', '#ddff00', '#ffff00', '#ffcc00', '#ffaa00'];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function isPosOccupied(x, y, minDistance) {
    for (let p of particles) {
      const dx = p.x - x;
      const dy = p.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) return true;
    }
    return false;
  }

  class Star {
    constructor() {
      this.init(true);
    }

    init(fullScreen = false) {
      this.type = Math.floor(Math.random() * 3) + 1;
      
      // Definição de tamanhos por tipo conforme solicitado
      if (this.type === 1) {
        this.size = Math.random() * 3 + 6; // Tipo 1: entre 3 e 9
      } else if (this.type === 2) {
        this.size = Math.random() * 4 + 5; // Tipo 2: entre 4 e 9
      } else {
        this.size = Math.random() * 2 + 3; // Tipo 3: entre 2 e 5
      }
      
      let foundPos = false;
      let attempts = 0;
      let safeMargin = 45; 

      while (!foundPos && attempts < 30) {
        this.x = Math.random() * width;
        this.y = fullScreen ? Math.random() * height : -50;
        
        let currentMargin = attempts > 15 ? safeMargin / 2 : safeMargin;

        if (!isPosOccupied(this.x, this.y, currentMargin)) {
          foundPos = true;
        }
        attempts++;
      }

      this.speed = Math.random() * 0.3 + 0.15;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.opacity = Math.random() * 0.4 + 0.2;
      this.isBlinking = false;
      this.blinkTimer = 0;
    }

    update() {
      this.y += this.speed;
      
      if (!this.isBlinking && Math.random() > 0.992) {
        this.isBlinking = true;
        this.blinkTimer = Math.floor(Math.random() * 6) + 3;
      }

      if (this.isBlinking) {
        this.blinkTimer--;
        if (this.blinkTimer <= 0) this.isBlinking = false;
      }
      
      if (this.y > height + 50) {
        this.init(false);
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      const s = this.size;
      
      if (this.isBlinking) {
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
      } else {
        ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = 0;
      }
      
      ctx.fillStyle = this.color;

      switch (this.type) {
        case 1: this._drawType1(s); break;
        case 2: this._drawType2(s); break;
        case 3: this._drawType3(s); break;
      }
      ctx.restore();
    }

    _drawType1(s) {
      const drawTaper = (angle, len, thk) => {
        ctx.save(); ctx.rotate(angle); ctx.beginPath();
        ctx.moveTo(0, -thk / 2); ctx.lineTo(len, 0); ctx.lineTo(0, thk / 2);
        ctx.fill(); ctx.restore();
      };
      ctx.rotate(Math.PI / 8); 
      drawTaper(-Math.PI / 4, s * 2.2, s * 0.2);
      drawTaper(3 * Math.PI / 4, s * 1.4, s * 0.2);
      drawTaper(-3 * Math.PI / 4, s * 0.8, s * 0.15);
      drawTaper(Math.PI / 4, s * 0.7, s * 0.15);
    }

    _drawType2(s) {
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        let angle = i * Math.PI / 8 - Math.PI / 2;
        let radius = (i % 4 === 0) ? s * 1.8 : (i % 2 === 0 ? s * 0.8 : s * 0.2);
        if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.fill();
    }

    _drawType3(s) {
      ctx.beginPath();
      // Ajuste na proporção
      const vLen = s * 2.2; 
      const hLen = s * 0.7; 
      
      ctx.moveTo(0, -vLen);
      ctx.quadraticCurveTo(0, 0, hLen, 0);
      ctx.quadraticCurveTo(0, 0, 0, vLen);
      ctx.quadraticCurveTo(0, 0, -hLen, 0);
      ctx.quadraticCurveTo(0, 0, 0, -vLen);
      
      ctx.closePath();
      ctx.fill();
    }
  }

  function initParticles() {
    resize();
    particles = [];
    const particleCount = Math.floor(width / 22); 
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Star());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', initParticles);
  resize(); initParticles(); animate();
}
