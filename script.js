/*
  ==========================================================================
  ÍNDICE DO ARQUIVO (JavaScript)
  1. LÓGICA DO RELÓGIO (Analógico e Digital)
  2. PREVISÃO DO TEMPO (Geocoding e Open-Meteo)
  3. SISTEMA DE TEMAS (Persistência e Toggle)
  4. MOTOR DE ANIMAÇÃO (Canvas API - Efeito Espacial)
  ==========================================================================
*/

/* =========================================================================
   1. LÓGICA DO RELÓGIO: Atualização em tempo real sincronizada
   ========================================================================= */
let currentTargetTimeZone = null; // Armazena o fuso horário da cidade buscada

function updateClock() {
  const now = new Date();

  // Relógio Analógico
  let hours, minutes, seconds;

  if (currentTargetTimeZone) {
    // Converte a hora atual para o fuso horário do local buscado
    const targetTime = now.toLocaleString("en-US", {
      timeZone: currentTargetTimeZone,
    });
    const targetDate = new Date(targetTime);
    hours = targetDate.getHours();
    minutes = targetDate.getMinutes();
    seconds = targetDate.getSeconds();
  } else {
    seconds = now.getSeconds();
    minutes = now.getMinutes();
    hours = now.getHours();
  }

  const secDegrees = (seconds / 60) * 360;
  const minDegrees = (minutes / 60) * 360 + (seconds / 60) * 6;
  const hourDegrees = (hours / 12) * 360 + (minutes / 60) * 30;

  document.getElementById("sec-hand").style.transform =
    `translateX(-50%) rotate(${secDegrees}deg)`;
  document.getElementById("min-hand").style.transform =
    `translateX(-50%) rotate(${minDegrees}deg)`;
  document.getElementById("hour-hand").style.transform =
    `translateX(-50%) rotate(${hourDegrees}deg)`;

  // Horário
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...(currentTargetTimeZone && { timeZone: currentTargetTimeZone }),
  };
  document.getElementById("time").textContent = now.toLocaleTimeString(
    "pt-BR",
    timeOptions,
  );

  // Data
  const dateOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(currentTargetTimeZone && { timeZone: currentTargetTimeZone }),
  };
  document.getElementById("date").textContent = now.toLocaleDateString(
    "pt-BR",
    dateOptions,
  );
}

setInterval(updateClock, 1000);
updateClock(); // Chama imediatamente na inicialização

/* =========================================================================
   2. PREVISÃO DO TEMPO: Geocoding e Open-Meteo API
   ========================================================================= */
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const cityNameEl = document.getElementById("city-name");
const temperatureEl = document.getElementById("temperature");
const descriptionEl = document.getElementById("description");
const weatherIconEl = document.getElementById("weather-icon");

// Mapeamento de códigos meteorológicos para Emojis e Texto
const weatherCodes = {
  0: { desc: "Céu limpo", icon: "☀️" },
  1: { desc: "Principalmente limpo", icon: "🌤️" },
  2: { desc: "Parcialmente nublado", icon: "⛅" },
  3: { desc: "Nublado", icon: "☁️" },
  45: { desc: "Neblina", icon: "🌫️" },
  48: { desc: "Nevoeiro", icon: "🌫️" },
  51: { desc: "Chuvisco leve", icon: "🌧️" },
  53: { desc: "Chuvisco moderado", icon: "🌧️" },
  55: { desc: "Chuvisco denso", icon: "🌧️" },
  61: { desc: "Chuva leve", icon: "🌧️" },
  63: { desc: "Chuva moderada", icon: "🌧️" },
  65: { desc: "Chuva forte", icon: "🌧️" },
  71: { desc: "Neve leve", icon: "❄️" },
  73: { desc: "Neve moderada", icon: "❄️" },
  75: { desc: "Neve forte", icon: "❄️" },
  95: { desc: "Tempestade", icon: "⛈️" },
  96: { desc: "Tempestade forte", icon: "⛈️" },
  99: { desc: "Tempestade extrema", icon: "⛈️" },
};

async function fetchWeather(city) {
  try {
    // UI de Carregamento
    cityNameEl.textContent = "Buscando...";
    temperatureEl.textContent = "--°C";
    descriptionEl.textContent = "Aguarde";
    weatherIconEl.textContent = "⏳";
    cityNameEl.classList.add("loading");

    // 1. Busca as coordenadas
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt`,
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("Cidade não encontrada");
    }

    const { latitude, longitude, name, admin1, country, timezone } =
      geoData.results[0];
    currentTargetTimeZone = timezone; // Atualiza o fuso horário global para o relógio
    const locationName = admin1
      ? `${name}, ${admin1} - ${country}`
      : `${name}, ${country}`;

    // 2. Busca a previsão do tempo
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
    );
    const weatherData = await weatherRes.json();

    const current = weatherData.current_weather;
    const code = current.weathercode;
    const weatherInfo = weatherCodes[code] || {
      desc: "Desconhecido",
      icon: "🌍",
    };

    // Atualiza a Interface
    cityNameEl.textContent = locationName;
    temperatureEl.textContent = `${Math.round(current.temperature)}°C`;
    descriptionEl.textContent = weatherInfo.desc;
    weatherIconEl.textContent = weatherInfo.icon;
  } catch (error) {
    cityNameEl.textContent = "Erro na busca";
    temperatureEl.textContent = "--°C";
    descriptionEl.textContent =
      error.message === "Cidade não encontrada"
        ? "Cidade não encontrada"
        : "Tente novamente";
    weatherIconEl.textContent = "❌";
  } finally {
    cityNameEl.classList.remove("loading");
  }
}

// Eventos de Busca
searchBtn.addEventListener("click", () => {
  if (cityInput.value.trim() !== "") fetchWeather(cityInput.value);
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && cityInput.value.trim() !== "")
    fetchWeather(cityInput.value);
});

// Inicia com uma cidade padrão
fetchWeather("São Paulo");

/* =========================================================================
   3. SISTEMA DE TEMAS: Persistência e Alternância Visual
   ========================================================================= */
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const body = document.body;

// Carrega o tema salvo
if (localStorage.getItem("theme") === "light") {
  body.classList.add("light-mode");
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    body.classList.toggle("light-mode");
    const isLight = body.classList.contains("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");

    // Reinicializa as cores das estrelas para o novo tema
    initSpace();
  });
}

// Inicializa ícones do Lucide
if (window.lucide) {
  window.lucide.createIcons();
}

/* ==========================================================================
   4. MOTOR DE ANIMAÇÃO: Renderização Espacial via Canvas API
   ========================================================================== */
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

// Variáveis globais de controle do Canvas
let width, height;
let stars = [];
let shootingStars = [];

// Paleta de cores da animação
const darkStarColors = [
  "#ffffff",
  "#fff4e6",
  "#ffdd00",
  "#ffaa00",
  "#ffcc80",
  "#e6f2ff",
];

const lightStarColors = ["#150136", "#5752ff", "#4338ca", "#17005c", "#0d0033"];

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
    this.type = Math.floor(Math.random() * 3) + 1;
    let baseSize = Math.random() * 2 + 0.5;

    if (this.type === 1) this.size = baseSize * 2.5;
    else if (this.type === 2) this.size = baseSize * 1.8;
    else this.size = baseSize * 1.2;

    this.x = Math.random() * width;
    this.y = Math.random() * height;

    this.baseSpeedX = (Math.random() - 0.5) * 0.1;
    this.baseSpeedY = baseSize * 0.4 + 0.2;

    const currentPalette = body.classList.contains("light-mode")
      ? lightStarColors
      : darkStarColors;
    this.color =
      currentPalette[Math.floor(Math.random() * currentPalette.length)];

    this.maxOpacity = Math.random() * 0.7 + 0.3;
    this.opacity = this.maxOpacity;
    this.twinkleSpeed = Math.random() * 0.02 + 0.005;
    this.twinklePhase = Math.random() * Math.PI * 2;
  }

  // Atualiza a posição da partícula a cada frame
  update() {
    this.x += this.baseSpeedX;
    this.y += this.baseSpeedY;
    this.twinklePhase += this.twinkleSpeed;
    this.opacity = (Math.sin(this.twinklePhase) * 0.5 + 0.5) * this.maxOpacity;

    if (this.y > height + 20) {
      this.y = -20;
      this.x = Math.random() * width;
    }
    if (this.x < -20) this.x = width + 20;
    if (this.x > width + 20) this.x = -20;
  }

  draw() {
    const alpha = this.opacity;

    ctx.globalAlpha = alpha * 0.2;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    this._drawFourPointStar(this.x, this.y, this.size);
    ctx.globalAlpha = 1.0;
  }

  _drawFourPointStar(x, y, s) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y - s * 2.5);
    ctx.lineTo(x + s * 0.4, y - s * 0.4);
    ctx.lineTo(x + s * 2.5, y);
    ctx.lineTo(x + s * 0.4, y + s * 0.4);
    ctx.lineTo(x, y + s * 2.5);
    ctx.lineTo(x - s * 0.4, y + s * 0.4);
    ctx.lineTo(x - s * 2.5, y);
    ctx.lineTo(x - s * 0.4, y - s * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/* --- CLASSE: SHOOTINGSTAR (EFEITO ESPECIAL) --- */
class ShootingStar {
  constructor() {
    this.init();
  }

  init() {
    this.active = false;
    if (Math.random() > 0.993) {
      this.active = true;
      this.x = Math.random() * width;
      this.y = -50;
      this.size = Math.random() * 2 + 1;
      this.speedX = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 5 + 3);
      this.speedY = Math.random() * 5 + 7;
      this.len = Math.random() * 80 + 30;
      this.opacity = 1;
    }
  }

  update() {
    if (!this.active) {
      this.init();
      return;
    }
    this.x += this.speedX;
    this.y += this.speedY;
    this.opacity -= 0.015;
    if (this.opacity <= 0 || this.y > height || this.x < 0 || this.x > width)
      this.active = false;
  }

  draw() {
    if (!this.active) return;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(
      this.x - this.speedX * (this.len / 5),
      this.y - this.speedY * (this.len / 5),
    );
    ctx.lineWidth = this.size;
    ctx.lineCap = "round";

    let grad = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x - this.speedX * (this.len / 10),
      this.y - this.speedY * (this.len / 10),
    );

    grad.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
    grad.addColorStop(1, `rgba(255, 170, 0, 0)`);

    ctx.strokeStyle = grad;
    ctx.stroke();
  }
}

/* --- INICIALIZAÇÃO E LOOP DE ANIMAÇÃO --- */

function initSpace() {
  stars = [];
  shootingStars = [];

  const calculatedStars = Math.floor((width * height) / 12000);
  const numStars = Math.min(calculatedStars, 150);

  for (let i = 0; i < numStars; i++) {
    stars.push(new Star());
  }

  for (let i = 0; i < 2; i++) {
    shootingStars.push(new ShootingStar());
  }
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  stars.forEach((s) => {
    s.update();
    s.draw();
  });

  shootingStars.forEach((s) => {
    s.update();
    s.draw();
  });

  requestAnimationFrame(animate);
}

/* --- EVENT LISTENERS --- */

window.addEventListener("resize", () => {
  initSpace();
});

/* --- START DO SCRIPT --- */
resize();
initSpace();
animate();
