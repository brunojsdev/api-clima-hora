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
// Validação de segurança caso o canvas não exista na página
if (canvas) {
  const ctx = canvas.getContext('2d');

  let width, height;
  let particles = [];
  const colors = ['#bbff00', '#ddff00', '#ffff00', '#ffcc00', '#ffaa00'];

  /**
   * Atualiza as dimensões do canvas para ocupar a tela inteira.
   */
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  /**
   * Classe que representa uma única estrela no fundo.
   */
  class Star {
    constructor() {
      this.init();
    }

    /**
     * Inicializa ou reseta as propriedades da estrela.
     */
    init() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      
      // Sorteia o tipo da estrela (1 a 4)
      this.type = Math.floor(Math.random() * 4) + 1;
      
      // Tamanho base (entre 4 e 7px)
      const baseSize = Math.random() * 3 + 4; 
      
      // AJUSTE DE TAMANHO: 
      // Tipo 3 (Vazada) fica com tamanho normal. Os demais ficam maiores.
      if (this.type === 3) {
        this.size = baseSize; // Tamanho normal
      } else {
        this.size = baseSize * 1.5; // Aumenta o tamanho em 50%
      }
      
      this.speed = Math.random() * 0.5 + 0.2;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      
      // Lógica de Piscar Real (Twinkle) - Flash rápido e agressivo
      this.opacity = Math.random() * 0.3 + 0.2; // Opacidade base baixa
      this.isBlinking = false;
      this.blinkTimer = 0;
    }

    /**
     * Atualiza a posição e os estados da estrela a cada frame.
     */
    update() {
      this.y += this.speed;
      
      // Sorteia o flash (piscar) - Chance rara de acontecer (1.5%)
      if (!this.isBlinking && Math.random() > 0.985) {
        this.isBlinking = true;
        this.blinkTimer = Math.floor(Math.random() * 4) + 2; // Flash curtíssimo: 2 a 5 frames
      }

      // Decrementa o tempo do flash
      if (this.isBlinking) {
        this.blinkTimer--;
        if (this.blinkTimer <= 0) this.isBlinking = false;
      }
      
      // Reposiciona a estrela no topo se ela sair da tela
      if (this.y > height + 50) {
        this.x = Math.random() * width;
        this.y = -50;
      }
    }

    /**
     * Renderiza a estrela no canvas de acordo com o seu tipo.
     */
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      
      // Efeito de Piscar: Aumenta brilho e opacidade drasticamente quando ativo
      if (this.isBlinking) {
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
      } else {
        ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = 0;
      }
      
      const s = this.size;
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.color;

      // Chama a função de desenho apropriada com base no tipo
      switch (this.type) {
        case 1:
          this._drawType1(s);
          break;
        case 2:
          this._drawType2(s);
          break;
        case 3:
          this._drawType3(s);
          break;
        case 4:
          this._drawType4(s);
          break;
      }

      ctx.restore();
    }

    /* --- MÉTODOS DE DESENHO ESPECÍFICOS --- */

    /** TIPO 1: Risco manual assimétrico */
    _drawType1(s) {
      const drawTaper = (angle, len, thk) => {
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, -thk / 2);
        ctx.lineTo(len, 0);
        ctx.lineTo(0, thk / 2);
        ctx.fill();
        ctx.restore();
      };
      
      ctx.rotate(Math.PI / 8); 
      drawTaper(-Math.PI / 4, s * 2.2, s * 0.2);
      drawTaper(3 * Math.PI / 4, s * 1.4, s * 0.2);
      drawTaper(-3 * Math.PI / 4, s * 0.8, s * 0.15);
      drawTaper(Math.PI / 4, s * 0.7, s * 0.15);
      
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    /** TIPO 2: 8 pontas sólida */
    _drawType2(s) {
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        let angle = i * Math.PI / 8 - Math.PI / 2;
        let radius = (i % 4 === 0) ? s * 1.8 : (i % 2 === 0 ? s * 0.8 : s * 0.2);
        
        if (i === 0) {
          ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        } else {
          ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
      }
      ctx.fill();
    }

    /** TIPO 3: 8 pontas VAZADA (Buraco no meio) */
    _drawType3(s) {
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      
      const rMax = s * 2.0;  // Pontas longas
      const rMin = s * 1.0;  // Pontas curtas
      const rIn = s * 0.4;   // Centro vazio (buraco)
      
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 - Math.PI / 2;
        const nextAngle = ((i + 1) * Math.PI) / 4 - Math.PI / 2;
        const midAngle = (angle + nextAngle) / 2;
        
        const rCurr = i % 2 === 0 ? rMax : rMin;
        const rNext = (i + 1) % 2 === 0 ? rMax : rMin;
        
        const x1 = Math.cos(angle) * rCurr;
        const y1 = Math.sin(angle) * rCurr;
        const x2 = Math.cos(nextAngle) * rNext;
        const y2 = Math.sin(nextAngle) * rNext;
        
        const cx = Math.cos(midAngle) * rIn;
        const cy = Math.sin(midAngle) * rIn;
        
        if (i === 0) ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
      }
      ctx.closePath();
      ctx.stroke();
    }

    /** TIPO 4: SÓ LINHAS (Com lacuna no centro) */
    _drawType4(s) {
      for (let i = 0; i < 8; i++) {
        let angle = i * Math.PI / 4 - Math.PI / 2;
        let radius = (i % 2 === 0) ? s * 1.8 : s * 0.9;
        let gap = s * 0.3; // Garante o buraco central separando as linhas
        let thk = s * 0.15;
        
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(gap, -thk / 2);
        ctx.lineTo(radius, 0);
        ctx.lineTo(gap, thk / 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  /**
   * Instancia a matriz de partículas com base na largura da tela.
   */
  function initParticles() {
    resize();
    particles = [];
    const particleCount = Math.floor(width / 15); // Quantidade responsiva
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Star());
    }
  }

  /**
   * Loop principal de animação.
   */
  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  // Escuta o redimensionamento da janela para repopular o canvas corretamente
  window.addEventListener('resize', initParticles);

  // Inicializa o sistema de partículas e o loop
  resize();         
  initParticles();
  animate();
}
