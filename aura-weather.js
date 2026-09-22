/* ==========================================================
   AuraWeather - Unified State, Open-Meteo Client & Canvas Particle Engine
   ========================================================== */

// --- State Store ---
const AppState = {
  city: "Tokyo",
  country: "Japan",
  lat: 35.6895,
  lon: 139.6917,
  unit: "C", // 'C' or 'F'
  weatherCode: 0,
  isDay: 1,
  currentTempC: 22,
  weatherData: null,
  activeParticles: "clear", // clear, rain, snow
};

// WMO Weather Interpretation Codes according to WMO specifications
const WMO_MAP = {
  0: { label: "Clear sky", icon: "fa-sun", nightIcon: "fa-moon", theme: "day", particles: "clear" },
  1: { label: "Mainly clear", icon: "fa-sun", nightIcon: "fa-moon", theme: "day", particles: "clear" },
  2: { label: "Partly cloudy", icon: "fa-cloud-sun", nightIcon: "fa-cloud-moon", theme: "day", particles: "clear" },
  3: { label: "Overcast", icon: "fa-cloud", nightIcon: "fa-cloud", theme: "rain", particles: "clear" },
  45: { label: "Fog & depositing rime fog", icon: "fa-smog", nightIcon: "fa-smog", theme: "rain", particles: "clear" },
  48: { label: "Depositing rime fog", icon: "fa-smog", nightIcon: "fa-smog", theme: "rain", particles: "clear" },
  51: { label: "Light drizzle", icon: "fa-cloud-rain", nightIcon: "fa-cloud-rain", theme: "rain", particles: "rain" },
  53: { label: "Moderate drizzle", icon: "fa-cloud-rain", nightIcon: "fa-cloud-rain", theme: "rain", particles: "rain" },
  55: { label: "Dense drizzle", icon: "fa-cloud-showers-heavy", nightIcon: "fa-cloud-showers-heavy", theme: "rain", particles: "rain" },
  61: { label: "Slight rain", icon: "fa-cloud-rain", nightIcon: "fa-cloud-rain", theme: "rain", particles: "rain" },
  63: { label: "Moderate rain", icon: "fa-cloud-showers-heavy", nightIcon: "fa-cloud-showers-heavy", theme: "rain", particles: "rain" },
  65: { label: "Heavy rain", icon: "fa-cloud-showers-heavy", nightIcon: "fa-cloud-showers-heavy", theme: "rain", particles: "rain" },
  71: { label: "Slight snow fall", icon: "fa-snowflake", nightIcon: "fa-snowflake", theme: "snow", particles: "snow" },
  73: { label: "Moderate snow", icon: "fa-snowflake", nightIcon: "fa-snowflake", theme: "snow", particles: "snow" },
  75: { label: "Heavy snow", icon: "fa-snowflake", nightIcon: "fa-snowflake", theme: "snow", particles: "snow" },
  80: { label: "Slight rain showers", icon: "fa-cloud-sun-rain", nightIcon: "fa-cloud-moon-rain", theme: "rain", particles: "rain" },
  81: { label: "Moderate rain showers", icon: "fa-cloud-showers-heavy", nightIcon: "fa-cloud-showers-heavy", theme: "rain", particles: "rain" },
  82: { label: "Violent rain showers", icon: "fa-cloud-showers-heavy", nightIcon: "fa-cloud-showers-heavy", theme: "rain", particles: "rain" },
  85: { label: "Slight snow showers", icon: "fa-snowflake", nightIcon: "fa-snowflake", theme: "snow", particles: "snow" },
  86: { label: "Heavy snow showers", icon: "fa-snowflake", nightIcon: "fa-snowflake", theme: "snow", particles: "snow" },
  95: { label: "Thunderstorm", icon: "fa-bolt-lightning", nightIcon: "fa-bolt-lightning", theme: "rain", particles: "rain" },
  96: { label: "Thunderstorm with slight hail", icon: "fa-cloud-bolt", nightIcon: "fa-cloud-bolt", theme: "rain", particles: "rain" },
  99: { label: "Thunderstorm with heavy hail", icon: "fa-cloud-bolt", nightIcon: "fa-cloud-bolt", theme: "rain", particles: "rain" },
};

// --- DOM References ---
const UI = {
  cityInput: document.getElementById("cityInput"),
  clearSearchBtn: document.getElementById("clearSearchBtn"),
  searchDropdown: document.getElementById("searchDropdown"),
  gpsBtn: document.getElementById("gpsBtn"),
  unitToggleBtn: document.getElementById("unitToggleBtn"),
  unitText: document.getElementById("unitText"),
  cityName: document.getElementById("cityName"),
  countryName: document.getElementById("countryName"),
  currentTime: document.getElementById("currentTime"),
  conditionSummary: document.getElementById("conditionSummary"),
  badgeIcon: document.getElementById("badgeIcon"),
  mainTemp: document.getElementById("mainTemp"),
  mainWeatherIcon: document.getElementById("mainWeatherIcon"),
  highTemp: document.getElementById("highTemp"),
  lowTemp: document.getElementById("lowTemp"),
  feelsLike: document.getElementById("feelsLike"),
  hourlyTrack: document.getElementById("hourlyTrack"),
  dailyList: document.getElementById("dailyList"),
  windVal: document.getElementById("windVal"),
  windUnit: document.getElementById("windUnit"),
  windDirText: document.getElementById("windDirText"),
  humidityVal: document.getElementById("humidityVal"),
  dewPointText: document.getElementById("dewPointText"),
  uvVal: document.getElementById("uvVal"),
  uvLevel: document.getElementById("uvLevel"),
  visVal: document.getElementById("visVal"),
  visUnit: document.getElementById("visUnit"),
  visQuality: document.getElementById("visQuality"),
  pressureVal: document.getElementById("pressureVal"),
  precipVal: document.getElementById("precipVal"),
  toast: document.getElementById("toast"),
  toastMsg: document.getElementById("toastMsg"),
  deviceText: document.getElementById("deviceText"),
};

// --- Conversion Helpers ---
function cToF(c) {
  return Math.round((c * 9) / 5 + 32);
}

function formatTemp(celsius) {
  if (celsius === null || celsius === undefined || isNaN(celsius)) return "--";
  const val = Math.round(celsius);
  return AppState.unit === "C" ? val : cToF(val);
}

function getWindDirection(deg) {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return directions[Math.round(deg / 22.5) % 16];
}

// --- Platform / Device Detection ---
function detectEnvironment() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  let deviceName = "Desktop Window";

  if (/iPad|Macintosh/i.test(ua) && "ontouchend" in document) {
    deviceName = "iPadOS Glass";
  } else if (/iPhone/i.test(ua)) {
    deviceName = "iOS Dynamic Island";
  } else if (/Android/i.test(ua)) {
    deviceName = "Android Fluid";
  } else if (/Linux/i.test(ua)) {
    deviceName = "Linux Desktop";
  } else if (/Mac/i.test(ua)) {
    deviceName = "macOS Glass";
  } else if (/Win/i.test(ua)) {
    deviceName = "Windows Mica";
  }

  UI.deviceText.textContent = deviceName;
}

// --- Dynamic Canvas Atmospheric Engine ---
class WeatherFX {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.animationId = null;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setMode(mode) {
    this.mode = mode;
    this.particles = [];
    const count = mode === "rain" ? 90 : mode === "snow" ? 60 : 25;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(mode, true));
    }
  }

  createParticle(mode, init = false) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      x: Math.random() * w,
      y: init ? Math.random() * h : -20,
      size: mode === "snow" ? Math.random() * 3 + 1.5 : mode === "rain" ? Math.random() * 20 + 10 : Math.random() * 2 + 0.8,
      speedY: mode === "rain" ? Math.random() * 12 + 16 : mode === "snow" ? Math.random() * 1.5 + 0.8 : Math.random() * 0.4 + 0.2,
      speedX: mode === "snow" ? Math.sin(Math.random() * 2) * 0.8 : mode === "rain" ? -1.5 : (Math.random() - 0.5) * 0.3,
      opacity: mode === "clear" ? Math.random() * 0.4 + 0.1 : Math.random() * 0.5 + 0.3,
    };
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (this.mode === "rain") {
        this.ctx.strokeStyle = `rgba(200, 225, 255, ${p.opacity})`;
        this.ctx.lineWidth = 1.4;
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x + p.speedX * 2, p.y + p.size);
        this.ctx.stroke();
      } else if (this.mode === "snow") {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Floating clear dust/sun orbs
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Update positions
      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y > this.canvas.height + 20 || p.x < -20 || p.x > this.canvas.width + 20) {
        this.particles[i] = this.createParticle(this.mode, false);
      }
    }

    this.animationId = requestAnimationFrame(() => this.render());
  }
}

let fxEngine;

// --- API Layer: Open-Meteo Integration ---
async function fetchCoordinates(query) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Search network error");
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error("Geocoding Error:", err);
    return [];
  }
}

async function fetchWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code,visibility,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather service unreachable");
    return await res.json();
  } catch (err) {
    console.error("Open-Meteo API Error:", err);
    showToast("Failed to fetch weather data. Please check connection.");
    return null;
  }
}

// --- Render & UI Controller ---
function applyTheme(weatherCode, isDay) {
  const codeInfo = WMO_MAP[weatherCode] || WMO_MAP[0];
  document.body.className = "";

  if (!isDay && codeInfo.theme === "day") {
    document.body.classList.add("theme-night");
  } else {
    document.body.classList.add(`theme-${codeInfo.theme}`);
  }

  // Update canvas FX
  if (fxEngine) {
    fxEngine.setMode(codeInfo.particles);
  }
}

function updateWeatherUI(data) {
  if (!data || !data.current || !data.daily || !data.hourly) return;
  AppState.weatherData = data;

  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;
  const code = current.weather_code;
  const isDay = current.is_day;
  const info = WMO_MAP[code] || { label: "Clear", icon: "fa-sun", nightIcon: "fa-moon" };

  // City & Header
  UI.cityName.textContent = AppState.city;
  UI.countryName.textContent = AppState.country;
  UI.conditionSummary.textContent = info.label;

  // Icon
  const iconClass = isDay ? info.icon : info.nightIcon;
  UI.mainWeatherIcon.className = `fa-solid ${iconClass} weather-hero-icon`;
  UI.badgeIcon.className = `fa-solid ${iconClass}`;

  // Temperatures
  AppState.currentTempC = current.temperature_2m;
  UI.mainTemp.textContent = formatTemp(current.temperature_2m);
  UI.highTemp.textContent = `${formatTemp(daily.temperature_2m_max[0])}°`;
  UI.lowTemp.textContent = `${formatTemp(daily.temperature_2m_min[0])}°`;
  UI.feelsLike.textContent = `${formatTemp(current.apparent_temperature)}°`;

  // Date/Time
  const dateObj = new Date();
  UI.currentTime.textContent = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Theme & FX
  applyTheme(code, isDay);

  // Metrics
  // Wind
  if (AppState.unit === "C") {
    UI.windVal.textContent = Math.round(current.wind_speed_10m);
    UI.windUnit.textContent = "km/h";
  } else {
    UI.windVal.textContent = Math.round(current.wind_speed_10m * 0.621371);
    UI.windUnit.textContent = "mph";
  }
  const compass = getWindDirection(current.wind_direction_10m);
  UI.windDirText.textContent = `Direction: ${compass} (${current.wind_direction_10m}°)`;

  // Humidity & Dew point
  UI.humidityVal.textContent = current.relative_humidity_2m;
  const approxDew = Math.round(current.temperature_2m - (100 - current.relative_humidity_2m) / 5);
  UI.dewPointText.textContent = `The dew point is ${formatTemp(approxDew)}°`;

  // UV Index (Current hour UV)
  const currentHourIdx = new Date().getHours();
  const currentUV = Math.round(hourly.uv_index[currentHourIdx] || 0);
  UI.uvVal.textContent = currentUV;
  let uvLabel = "Low";
  if (currentUV >= 3 && currentUV <= 5) uvLabel = "Moderate";
  else if (currentUV >= 6 && currentUV <= 7) uvLabel = "High";
  else if (currentUV >= 8) uvLabel = "Very High";
  UI.uvLevel.textContent = uvLabel;

  // Visibility
  const currentVis = hourly.visibility[currentHourIdx] || 10000;
  if (AppState.unit === "C") {
    UI.visVal.textContent = (currentVis / 1000).toFixed(0);
    UI.visUnit.textContent = "km";
  } else {
    UI.visVal.textContent = ((currentVis / 1000) * 0.621371).toFixed(1);
    UI.visUnit.textContent = "mi";
  }
  UI.visQuality.textContent = currentVis >= 9000 ? "Perfect clear view" : "Haze/fog detected";

  // Pressure
  UI.pressureVal.textContent = Math.round(current.surface_pressure);

  // Precipitation
  UI.precipVal.textContent = current.precipitation.toFixed(1);

  // Render Hourly (Next 24 Hours)
  renderHourly(hourly);

  // Render 7 Days
  renderDaily(daily);
}

function renderHourly(hourly) {
  UI.hourlyTrack.innerHTML = "";
  const startIdx = new Date().getHours();
  const limit = Math.min(startIdx + 24, hourly.time.length);

  for (let i = startIdx; i < limit; i++) {
    const rawTime = hourly.time[i];
    const hourNum = new Date(rawTime).getHours();
    const timeLabel = i === startIdx ? "Now" : `${hourNum % 12 || 12} ${hourNum >= 12 ? "PM" : "AM"}`;
    const code = hourly.weather_code[i];
    const isDayTime = hourNum >= 6 && hourNum < 19 ? 1 : 0;
    const codeMeta = WMO_MAP[code] || WMO_MAP[0];
    const icon = isDayTime ? codeMeta.icon : codeMeta.nightIcon;
    const tempVal = formatTemp(hourly.temperature_2m[i]);

    const hourCard = document.createElement("div");
    hourCard.className = `hour-item ${i === startIdx ? "active-hour" : ""}`;
    hourCard.innerHTML = `
      <span class="hour-time">${timeLabel}</span>
      <div class="hour-icon"><i class="fa-solid ${icon}"></i></div>
      <span class="hour-temp">${tempVal}°</span>
    `;
    UI.hourlyTrack.appendChild(hourCard);
  }
}

function renderDaily(daily) {
  UI.dailyList.innerHTML = "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < daily.time.length; i++) {
    const date = new Date(daily.time[i] + "T00:00:00");
    const dayLabel = i === 0 ? "Today" : days[date.getDay()];
    const code = daily.weather_code[i];
    const meta = WMO_MAP[code] || WMO_MAP[0];
    const max = formatTemp(daily.temperature_2m_max[i]);
    const min = formatTemp(daily.temperature_2m_min[i]);

    const row = document.createElement("div");
    row.className = "daily-row";
    row.innerHTML = `
      <span class="day-name">${dayLabel}</span>
      <span class="day-icon"><i class="fa-solid ${meta.icon}"></i></span>
      <div class="range-bar-wrapper">
        <div class="range-bar-fill" style="left: 15%; width: 70%;"></div>
      </div>
      <div class="day-hl-temp">
        <span class="day-low">${min}°</span>
        <span class="day-high">${max}°</span>
      </div>
    `;
    UI.dailyList.appendChild(row);
  }
}

// --- Toast Notification ---
let toastTimer = null;
function showToast(message) {
  UI.toastMsg.textContent = message;
  UI.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    UI.toast.classList.add("hidden");
  }, 3200);
}

// --- Coordinates & City Loader ---
async function loadWeatherData(lat, lon, cityName, countryName) {
  AppState.lat = lat;
  AppState.lon = lon;
  AppState.city = cityName;
  AppState.country = countryName;

  const data = await fetchWeather(lat, lon);
  if (data) {
    updateWeatherUI(data);
  }
}

// --- Search Auto-complete & User Interaction ---
let searchDebounce = null;

UI.cityInput.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  UI.clearSearchBtn.style.display = val.length > 0 ? "block" : "none";

  clearTimeout(searchDebounce);
  if (val.length < 2) {
    UI.searchDropdown.classList.add("hidden");
    UI.searchDropdown.innerHTML = "";
    return;
  }

  searchDebounce = setTimeout(async () => {
    const results = await fetchCoordinates(val);
    UI.searchDropdown.innerHTML = "";
    if (results.length === 0) {
      UI.searchDropdown.innerHTML = `<div class="dropdown-item" style="color:var(--text-muted); cursor:default;">No matches found</div>`;
      UI.searchDropdown.classList.remove("hidden");
      return;
    }

    results.forEach((place) => {
      const item = document.createElement("div");
      item.className = "dropdown-item";
      item.innerHTML = `
        <strong>${place.name}</strong>
        <span class="country">${place.admin1 ? place.admin1 + ", " : ""}${place.country || ""}</span>
      `;
      item.addEventListener("click", () => {
        UI.cityInput.value = "";
        UI.clearSearchBtn.style.display = "none";
        UI.searchDropdown.classList.add("hidden");
        // Clear active chip
        document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        loadWeatherData(place.latitude, place.longitude, place.name, place.country || "");
      });
      UI.searchDropdown.appendChild(item);
    });
    UI.searchDropdown.classList.remove("hidden");
  }, 350);
});

UI.clearSearchBtn.addEventListener("click", () => {
  UI.cityInput.value = "";
  UI.clearSearchBtn.style.display = "none";
  UI.searchDropdown.classList.add("hidden");
  UI.cityInput.focus();
});

// Close dropdown on outside click
document.addEventListener("click", (e) => {
  if (!UI.cityInput.contains(e.target) && !UI.searchDropdown.contains(e.target)) {
    UI.searchDropdown.classList.add("hidden");
  }
});

// Quick Pills
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", async () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const city = chip.getAttribute("data-city");
    const results = await fetchCoordinates(city);
    if (results.length > 0) {
      const p = results[0];
      loadWeatherData(p.latitude, p.longitude, p.name, p.country || "");
    }
  });
});

// GPS Geolocation Handler
UI.gpsBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser");
    return;
  }

  showToast("Detecting your location...");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        // Reverse Geocoding via Open-Meteo reverse or BigDataCloud client-side free fallback
        const rev = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const revData = await rev.json();
        const detectedCity = revData.city || revData.locality || "My Location";
        const detectedCountry = revData.countryName || "";
        loadWeatherData(latitude, longitude, detectedCity, detectedCountry);
        showToast(`Located: ${detectedCity}`);
      } catch (e) {
        loadWeatherData(latitude, longitude, "Current Location", "");
      }
    },
    (err) => {
      console.warn(err);
      showToast("Location access denied or unavailable");
    },
    { timeout: 10000 }
  );
});

// Temperature Unit Toggle (°C <-> °F)
UI.unitToggleBtn.addEventListener("click", () => {
  AppState.unit = AppState.unit === "C" ? "F" : "C";
  UI.unitText.textContent = `°${AppState.unit}`;
  if (AppState.weatherData) {
    updateWeatherUI(AppState.weatherData);
  }
});

// --- Bootstrapper ---
window.addEventListener("DOMContentLoaded", () => {
  detectEnvironment();
  fxEngine = new WeatherFX("weatherCanvas");
  fxEngine.setMode("clear");
  fxEngine.render();

  // Load Initial City (Tokyo)
  loadWeatherData(AppState.lat, AppState.lon, AppState.city, AppState.country);
});