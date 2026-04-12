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
   3. ANIMAÇÃO DE FUNDO ESPACIAL
   ========================================================================== */
const canvas = document.getElementById('bg-canvas');

if (canvas) {
  const ctx = canvas.getContext('2d');
  let width, height;
  let stars = [];
  let shootingStars = [];

  // PARTE IMPORTANTE 1: Paleta de cores das estrelas
  const starColors = ['#ffffff', '#fff4e6', '#ffdd00', '#ffaa00', '#ffcc80', '#e6f2ff'];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  // ==========================================
  // CLASSE: ESTRELAS DE FUNDO
  // ==========================================
  class Star {
    constructor() {
      this.init();
    }

    init() {
      // Define a forma da estrela usando seus 3 desenhos originais
      this.type = Math.floor(Math.random() * 3) + 1;
      
      // PARTE IMPORTANTE 2: Lógica de Parallax (Tamanho define a velocidade)
      let baseSize = Math.random() * 2 + 0.5; 
      
      if (this.type === 1) this.size = baseSize * 2.5;
      else if (this.type === 2) this.size = baseSize * 1.8;
      else this.size = baseSize * 1.2;

      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.baseSpeedX = (Math.random() - 0.5) * 0.1; 
      this.baseSpeedY = baseSize * 0.3 + 0.1;       
      
      this.color = starColors[Math.floor(Math.random() * starColors.length)];
      
      // PARTE IMPORTANTE 3: Controle do brilho pulsante (Twinkle)
      this.maxOpacity = Math.random() * 0.7 + 0.3;
      this.opacity = this.maxOpacity;
      this.twinkleSpeed = Math.random() * 0.02 + 0.005;
      this.twinklePhase = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.baseSpeedX;
      this.y -= this.baseSpeedY; // Faz as estrelas subirem
      
      // Pulsação suave usando a função Seno
      this.twinklePhase += this.twinkleSpeed;
      this.opacity = (Math.sin(this.twinklePhase) * 0.5 + 0.5) * this.maxOpacity;

      // Recicla a estrela se ela sair da tela
      if (this.y < -20) {
        this.y = height + 20;
        this.x = Math.random() * width;
      }
      if (this.x < -20) this.x = width + 20;
      if (this.x > width + 20) this.x = -20;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      
      // Adiciona o brilho externo
      ctx.shadowBlur = this.size * 2;
      ctx.shadowColor = this.color;
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;

      // PARTE IMPORTANTE 4: Uso das SUAS funções de desenho
      switch (this.type) {
        case 1: this._drawType1(this.size); break;
        case 2: this._drawType2(this.size); break;
        case 3: this._drawType3(this.size); break;
      }
      
      ctx.restore();
    }

    // --- Suas Funções Originais de Desenho de Estrelas ---
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

  // ==========================================
  // CLASSE: ESTRELA CADENTE
  // ==========================================
  class ShootingStar {
    constructor() {
      this.reset();
    }

    reset() {
      this.active = false;
      // Define a raridade do evento (só atira se for > 0.993)
      if(Math.random() > 0.993) {
        this.active = true;
        this.x = Math.random() * width;
        this.y = 0;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 5 + 3);
        this.speedY = Math.random() * 5 + 5;
        this.len = Math.random() * 80 + 30; // Tamanho do rastro
        this.opacity = 1;
      }
    }

    update() {
      if (!this.active) {
        this.reset();
        return;
      }
      this.x += this.speedX;
      this.y += this.speedY;
      this.opacity -= 0.015; // O rastro apaga gradualmente

      if (this.opacity <= 0 || this.y > height || this.x < 0 || this.x > width) {
        this.active = false;
      }
    }

    draw() {
      if (!this.active) return;
      
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.speedX * (this.len / 10), this.y - this.speedY * (this.len / 10));
      ctx.lineWidth = this.size;
      ctx.lineCap = "round";
      
      // PARTE IMPORTANTE 5: Criação do rastro com Degradê
      let grad = ctx.createLinearGradient(this.x, this.y, this.x - this.speedX * (this.len / 10), this.y - this.speedY * (this.len / 10));
      grad.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
      grad.addColorStop(1, `rgba(255, 170, 0, 0)`);
      
      ctx.strokeStyle = grad;
      ctx.stroke();
    }
  }

  // ==========================================
  // LOOP DE INICIALIZAÇÃO
  // ==========================================
  function initSpace() {
    resize();
    stars = [];
    shootingStars = [];
    
    // Controla a quantidade de estrelas na tela (ajuste o divisor 8000 para mais ou menos estrelas)
    const numStars = Math.floor((width * height) / 8000); 
    
    for (let i = 0; i < numStars; i++) {
      stars.push(new Star());
    }

    for(let i=0; i < 2; i++){
      shootingStars.push(new ShootingStar());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height); // Limpa o frame
    
    stars.forEach(star => {
      star.update();
      star.draw();
    });

    shootingStars.forEach(sStar => {
      sStar.update();
      sStar.draw();
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', initSpace);
  resize(); 
  initSpace(); 
  animate();
}
