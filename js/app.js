/**
 * MAUSAM: Persona-Aware Weather Application
 * Smart India Hackathon 2026 - Problem Statement SIH26076
 * Team: Byte Force 02
 * Enhanced Application Orchestrator with Full Conversational Assistant & Chat History
 */

import { INDIAN_LOCATIONS, PERSONA_DEFINITIONS } from "./data/mockData.js";
import { ComfortIndexEngine } from "./engines/comfortIndex.js";
import { ContextInferenceEngine } from "./engines/contextInference.js";
import { AdaptiveRankingEngine } from "./engines/adaptiveRanking.js";
import { VoiceQueryEngine } from "./engines/voiceQuery.js";
import { WeatherApiService } from "./services/weatherApi.js";

class MausamApp {
  constructor() {
    this.weatherService = new WeatherApiService();
    this.rankingEngine = new AdaptiveRankingEngine();
    this.voiceEngine = null;

    // State
    this.selectedLocationId = localStorage.getItem("mausam_selected_location") || "delhi";
    this.userPersonas = JSON.parse(localStorage.getItem("mausam_user_personas") || '["runner", "commuter", "health"]');
    this.activePersona = this.userPersonas[0] || "runner";
    this.currentWeatherData = null;
    this.comfortScores = null;
    this.contextInference = null;
    this.simulatedTime = null;
    this.isOfflineSimulated = false;

    // Chat History State
    this.chatStorageKey = "mausam_chat_history_v2";
    this.chatMessages = this.loadChatHistory();

    this.initElements();
    this.initVoiceEngine();
    this.attachEventListeners();
    this.startClock();
    this.loadApplication();
    this.renderChatHistory();
  }

  initElements() {
    this.el = {
      deviceContainer: document.getElementById("deviceContainer"),
      viewToggleBtn: document.getElementById("viewToggleBtn"),
      simTimeBtn: document.getElementById("simTimeBtn"),
      offlineToggleBtn: document.getElementById("offlineToggleBtn"),
      locationSelect: document.getElementById("locationSelect"),
      networkBadge: document.getElementById("networkBadge"),
      networkText: document.getElementById("networkText"),
      personaPillsContainer: document.getElementById("personaPillsContainer"),
      contextChip: document.getElementById("contextChip"),
      contextText: document.getElementById("contextText"),
      heroPersonaCard: document.getElementById("heroPersonaCard"),
      heroGreeting: document.getElementById("heroGreeting"),
      heroScoreLabel: document.getElementById("heroScoreLabel"),
      heroScoreVal: document.getElementById("heroScoreVal"),
      heroScoreBadge: document.getElementById("heroScoreBadge"),
      heroVerdict: document.getElementById("heroVerdict"),
      heroSubtext: document.getElementById("heroSubtext"),
      heroMetrics: document.getElementById("heroMetrics"),
      priorityAlertsArea: document.getElementById("priorityAlertsArea"),
      featuredWidgetsContainer: document.getElementById("featuredWidgetsContainer"),
      secondaryWidgetsContainer: document.getElementById("secondaryWidgetsContainer"),
      moreInsightsToggle: document.getElementById("moreInsightsToggle"),
      moreInsightsCount: document.getElementById("moreInsightsCount"),
      moreInsightsChevron: document.getElementById("moreInsightsChevron"),
      statusBarClock: document.getElementById("statusBarClock"),
      dynamicIsland: document.getElementById("dynamicIsland"),
      islandStatusPill: document.getElementById("islandStatusPill"),

      // Conversational Assistant Elements
      voiceModal: document.getElementById("voiceModal"),
      closeVoiceBtn: document.getElementById("closeVoiceBtn"),
      micDockBtn: document.getElementById("micDockBtn"),
      voiceWave: document.getElementById("voiceWave"),
      voiceInputText: document.getElementById("voiceInputText"),
      voiceSendBtn: document.getElementById("voiceSendBtn"),
      voiceListenToggleBtn: document.getElementById("voiceListenToggleBtn"),
      chatMessagesContainer: document.getElementById("chatMessagesContainer"),
      clearChatBtn: document.getElementById("clearChatBtn"),

      // Onboarding Elements
      onboardingModal: document.getElementById("onboardingModal"),
      onboardingGrid: document.getElementById("onboardingGrid"),
      saveOnboardingBtn: document.getElementById("saveOnboardingBtn"),
      skipOnboardingBtn: document.getElementById("skipOnboardingBtn"),
      openOnboardingBtn: document.getElementById("openOnboardingBtn"),
      closeOnboardingBtn: document.getElementById("closeOnboardingBtn"),
      personaSettingsDockBtn: document.getElementById("personaSettingsDockBtn"),

      // Radar Elements
      radarModal: document.getElementById("radarModal"),
      closeRadarBtn: document.getElementById("closeRadarBtn"),
      radarDockBtn: document.getElementById("radarDockBtn"),
      radarPlayToggle: document.getElementById("radarPlayToggle")
    };
  }

  startClock() {
    const updateTime = () => {
      const now = this.simulatedTime || new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      if (this.el.statusBarClock) {
        this.el.statusBarClock.textContent = `${hours}:${mins}`;
      }
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  initVoiceEngine() {
    this.voiceEngine = new VoiceQueryEngine({
      onStateChange: (state) => {
        if (state.listening) {
          this.el.voiceWave.classList.add("active");
          this.el.voiceListenToggleBtn.classList.add("listening");
          this.el.micDockBtn.classList.add("listening");
          if (this.el.islandStatusPill) {
            this.el.islandStatusPill.innerHTML = `<i class="fa-solid fa-microphone" style="color: #ef4444;"></i> Listening...`;
          }
        } else {
          this.el.voiceWave.classList.remove("active");
          this.el.voiceListenToggleBtn.classList.remove("listening");
          this.el.micDockBtn.classList.remove("listening");
          if (this.el.islandStatusPill) {
            this.el.islandStatusPill.innerHTML = `<i class="fa-solid fa-cloud-sun"></i> IMD`;
          }
        }

        if (state.transcript) {
          this.submitChatMessage(state.transcript);
        }
      }
    });
  }

  attachEventListeners() {
    // View Switcher (Mobile Mockup vs Fullscreen Responsive)
    this.el.viewToggleBtn?.addEventListener("click", () => {
      const isFullscreen = this.el.deviceContainer.classList.toggle("fullscreen");
      this.el.viewToggleBtn.innerHTML = isFullscreen 
        ? `<i class="fa-solid fa-mobile-screen"></i> Phone View` 
        : `<i class="fa-solid fa-expand"></i> Fullscreen View`;
    });

    // Offline Simulation Toggle (Slide 2 & 4: Offline-first mode)
    this.el.offlineToggleBtn?.addEventListener("click", () => {
      this.isOfflineSimulated = !this.isOfflineSimulated;
      this.el.offlineToggleBtn.innerHTML = this.isOfflineSimulated
        ? `<i class="fa-solid fa-wifi"></i> Restore Online`
        : `<i class="fa-solid fa-plane"></i> Test Offline Mode`;
      
      this.updateNetworkBadge();
      this.loadApplication();
    });

    // Simulate Context Shift (Morning -> Commute Rush -> Monsoon Storm)
    this.el.simTimeBtn?.addEventListener("click", () => {
      this.cycleContextSimulation();
    });

    // Location Change
    this.el.locationSelect?.addEventListener("change", (e) => {
      this.selectedLocationId = e.target.value;
      localStorage.setItem("mausam_selected_location", this.selectedLocationId);
      this.loadApplication();
    });

    // More Insights Collapse / Expand
    this.el.moreInsightsToggle?.addEventListener("click", () => {
      const isOpen = this.el.secondaryWidgetsContainer.classList.toggle("open");
      this.el.moreInsightsChevron.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
    });

    // Conversational Voice / Chat Modal Controls
    this.el.micDockBtn?.addEventListener("click", () => this.openVoiceModal(true));
    this.el.closeVoiceBtn?.addEventListener("click", () => this.closeVoiceModal());
    this.el.voiceListenToggleBtn?.addEventListener("click", () => {
      this.voiceEngine.startListening();
    });
    this.el.voiceSendBtn?.addEventListener("click", () => {
      const text = this.el.voiceInputText.value.trim();
      if (text) {
        this.submitChatMessage(text);
        this.el.voiceInputText.value = "";
      }
    });
    this.el.voiceInputText?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const text = this.el.voiceInputText.value.trim();
        if (text) {
          this.submitChatMessage(text);
          this.el.voiceInputText.value = "";
        }
      }
    });
    this.el.clearChatBtn?.addEventListener("click", () => this.clearChatHistory());

    // Prompt Chips inside Chat Modal
    document.querySelectorAll(".chat-prompt-pill").forEach(chip => {
      chip.addEventListener("click", () => {
        const query = chip.dataset.query || chip.textContent;
        this.submitChatMessage(query);
      });
    });

    // Onboarding Modal Controls
    this.el.openOnboardingBtn?.addEventListener("click", () => this.openOnboardingModal());
    this.el.personaSettingsDockBtn?.addEventListener("click", () => this.openOnboardingModal());
    this.el.closeOnboardingBtn?.addEventListener("click", () => this.el.onboardingModal.classList.remove("active"));
    this.el.saveOnboardingBtn?.addEventListener("click", () => this.saveOnboarding());
    this.el.skipOnboardingBtn?.addEventListener("click", () => {
      this.el.onboardingModal.classList.remove("active");
    });

    // Doppler Radar Modal Controls
    this.el.radarDockBtn?.addEventListener("click", () => this.openRadarModal());
    this.el.closeRadarBtn?.addEventListener("click", () => this.closeRadarModal());
    this.el.radarPlayToggle?.addEventListener("click", () => {
      const isPaused = this.el.radarPlayToggle.classList.toggle("paused");
      this.el.radarPlayToggle.innerHTML = isPaused 
        ? `<i class="fa-solid fa-play"></i> Play Loop`
        : `<i class="fa-solid fa-pause"></i> Pause Loop`;
    });

    // Network Change Custom Event
    window.addEventListener("mausam_network_change", () => {
      this.updateNetworkBadge();
    });
  }

  async loadApplication() {
    this.updateNetworkBadge();

    // 1. Fetch Weather Data (Live or Cache Fallback)
    const result = await this.weatherService.getLocationWeather(
      this.selectedLocationId, 
      !this.isOfflineSimulated
    );
    this.currentWeatherData = result.data;

    // Update location header titles
    const cityEl = document.getElementById("cityDisplayName");
    const panchayatEl = document.getElementById("panchayatDisplayName");
    if (cityEl) cityEl.textContent = `${this.currentWeatherData.name}, ${this.currentWeatherData.state}`;
    if (panchayatEl) panchayatEl.textContent = this.currentWeatherData.panchayat || "IMD Agromet Observatory";
    if (this.el.locationSelect) this.el.locationSelect.value = this.selectedLocationId;

    // 2. Run Context Inference Engine
    const evalTime = this.simulatedTime || new Date();
    this.contextInference = ContextInferenceEngine.inferContext(this.currentWeatherData, evalTime);

    // 3. Compute Comfort & Suitability Scores
    this.comfortScores = ComfortIndexEngine.calculateAll(this.currentWeatherData.weather);

    // 4. Render UI Elements
    this.renderPersonaPills();
    this.renderContextBadge();
    this.renderHeroSection();
    this.renderAlerts();
    this.renderWidgets();

    // First time onboarding check
    if (!localStorage.getItem("mausam_onboarding_completed")) {
      this.openOnboardingModal();
    }
  }

  updateNetworkBadge() {
    if (this.isOfflineSimulated || !navigator.onLine) {
      this.el.networkBadge.classList.add("offline");
      this.el.networkText.textContent = "Offline Cache Active (GKMS)";
    } else {
      this.el.networkBadge.classList.remove("offline");
      this.el.networkText.textContent = "Live IMD Sync";
    }
  }

  cycleContextSimulation() {
    const states = [
      { name: "Early Morning (6 AM) · Fitness & Run Focus", hour: 6 },
      { name: "Morning Commute (8:30 AM) · Traffic & Rain Rush", hour: 9 },
      { name: "Midday Field Window (12 PM) · Agro Spraying & Heat", hour: 12 },
      { name: "Late Afternoon (4 PM) · Coastal High Tide & Showers", hour: 16 }
    ];

    const currentHour = this.simulatedTime ? this.simulatedTime.getHours() : 6;
    let nextIdx = 0;
    if (currentHour === 6) nextIdx = 1;
    else if (currentHour === 9) nextIdx = 2;
    else if (currentHour === 12) nextIdx = 3;
    else nextIdx = 0;

    const nextState = states[nextIdx];
    const simulatedDate = new Date();
    simulatedDate.setHours(nextState.hour, 0, 0, 0);
    this.simulatedTime = simulatedDate;

    this.el.simTimeBtn.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${nextState.name}`;
    this.startClock();
    this.loadApplication();
  }

  renderPersonaPills() {
    this.el.personaPillsContainer.innerHTML = "";

    const allPersonaKeys = Object.keys(PERSONA_DEFINITIONS);
    allPersonaKeys.forEach(pKey => {
      const pDef = PERSONA_DEFINITIONS[pKey];
      const pill = document.createElement("button");
      pill.className = `persona-pill ${this.activePersona === pKey ? "active" : ""}`;
      pill.innerHTML = `<i class="fa-solid ${pDef.icon}" style="color: ${this.activePersona === pKey ? '#fff' : pDef.color}"></i> ${pDef.title.split('/')[0].trim()}`;
      
      pill.addEventListener("click", () => {
        this.activePersona = pKey;
        this.rankingEngine.trackInteraction(`persona_${pKey}`);
        this.renderPersonaPills();
        this.renderHeroSection();
        this.renderAlerts();
        this.renderWidgets();
      });

      this.el.personaPillsContainer.appendChild(pill);
    });
  }

  renderContextBadge() {
    const reason = this.contextInference.primaryReason;
    this.el.contextText.innerHTML = `<span><strong>Context Engine:</strong> ${reason}</span>`;
  }

  renderHeroSection() {
    const pDef = PERSONA_DEFINITIONS[this.activePersona];
    const scoreData = this.comfortScores[this.activePersona];
    const weather = this.currentWeatherData.weather;

    const gradientMap = {
      runner: "linear-gradient(135deg, #ea580c, #c2410c)",
      farmer: "linear-gradient(135deg, #059669, #047857)",
      commuter: "linear-gradient(135deg, #6d28d9, #5b21b6)",
      beach: "linear-gradient(135deg, #0284c7, #0369a1)",
      parent: "linear-gradient(135deg, #e11d48, #be123c)",
      event: "linear-gradient(135deg, #d97706, #b45309)",
      health: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      travel: "linear-gradient(135deg, #0f766e, #115e59)"
    };

    this.el.heroPersonaCard.style.background = gradientMap[this.activePersona] || gradientMap.runner;

    const hour = (this.simulatedTime || new Date()).getHours();
    let timeGreeting = "Good morning";
    if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
    else if (hour >= 17) timeGreeting = "Good evening";

    this.el.heroGreeting.innerHTML = `
      <span>${timeGreeting}, ${pDef.title.split("/")[0].trim()}</span>
      <div class="hero-weather-mini">
        <i class="fa-solid ${weather.icon}"></i>
        <span>${weather.temp}°C · ${weather.condition}</span>
      </div>
    `;

    this.el.heroScoreLabel.textContent = pDef.scoreLabel;
    this.animateScoreCount(scoreData.score);
    this.el.heroScoreBadge.textContent = scoreData.badge;
    this.el.heroVerdict.textContent = scoreData.verdict;
    this.el.heroSubtext.textContent = scoreData.subtext;

    this.renderHeroMetrics(this.activePersona, weather);
  }

  animateScoreCount(targetScore) {
    let current = 0;
    const duration = 400; // ms
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = Math.ceil(targetScore / totalSteps);

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        current = targetScore;
        clearInterval(timer);
      }
      this.el.heroScoreVal.innerHTML = `${current}<span class="denom">/100</span>`;
    }, stepTime);
  }

  renderHeroMetrics(persona, weather) {
    let metricsHtml = "";
    if (persona === "runner") {
      metricsHtml = `
        <div class="quick-metric-item"><span class="lbl">AQI Status</span><span class="val">${weather.airQuality.aqi} (${weather.airQuality.category})</span></div>
        <div class="quick-metric-item"><span class="lbl">UV Index</span><span class="val">${weather.uvIndex} · Moderate</span></div>
        <div class="quick-metric-item"><span class="lbl">Rain Risk</span><span class="val">${weather.rainChance}%</span></div>
      `;
    } else if (persona === "farmer") {
      metricsHtml = `
        <div class="quick-metric-item"><span class="lbl">Soil Moisture</span><span class="val">${weather.agriculture.soilMoisture}% Adequate</span></div>
        <div class="quick-metric-item"><span class="lbl">Wind Drift</span><span class="val">${weather.windSpeed} km/h ${weather.windDirection}</span></div>
        <div class="quick-metric-item"><span class="lbl">Frost Threat</span><span class="val">${weather.agriculture.frostRisk}</span></div>
      `;
    } else if (persona === "commuter") {
      metricsHtml = `
        <div class="quick-metric-item"><span class="lbl">Rain Onset</span><span class="val">${weather.rainChance > 40 ? '4:00 PM (70%)' : 'None Expected'}</span></div>
        <div class="quick-metric-item"><span class="lbl">Road Visibility</span><span class="val">${weather.visibility} km</span></div>
        <div class="quick-metric-item"><span class="lbl">Traffic Impact</span><span class="val">${weather.trafficImpact.congestionLevel}</span></div>
      `;
    } else if (persona === "beach") {
      metricsHtml = `
        <div class="quick-metric-item"><span class="lbl">Next Tide</span><span class="val">${weather.tides ? weather.tides.highTide : 'Inland'}</span></div>
        <div class="quick-metric-item"><span class="lbl">Wave Swell</span><span class="val">${weather.tides ? weather.tides.waveHeight : 'N/A'}</span></div>
        <div class="quick-metric-item"><span class="lbl">Water Safety</span><span class="val">${weather.tides ? 'Caution at Tide' : 'N/A'}</span></div>
      `;
    } else {
      metricsHtml = `
        <div class="quick-metric-item"><span class="lbl">AQI</span><span class="val">${weather.airQuality.aqi}</span></div>
        <div class="quick-metric-item"><span class="lbl">Humidity</span><span class="val">${weather.humidity}%</span></div>
        <div class="quick-metric-item"><span class="lbl">Rain Chance</span><span class="val">${weather.rainChance}%</span></div>
      `;
    }
    this.el.heroMetrics.innerHTML = metricsHtml;
  }

  renderAlerts() {
    this.el.priorityAlertsArea.innerHTML = "";
    const alerts = this.rankingEngine.generatePrioritizedAlerts(this.currentWeatherData, this.activePersona);

    if (alerts.length === 0) {
      this.el.priorityAlertsArea.style.display = "none";
      return;
    }
    this.el.priorityAlertsArea.style.display = "flex";

    alerts.forEach(alert => {
      const card = document.createElement("div");
      card.className = `alert-card ${alert.level}`;
      card.innerHTML = `
        <div class="alert-icon"><i class="fa-solid ${alert.icon}"></i></div>
        <div class="alert-body">
          <div class="alert-header-row">
            <span class="alert-badge">${alert.badge}</span>
            <span class="alert-title">${alert.title}</span>
          </div>
          <div class="alert-description">${alert.message}</div>
          <button class="alert-action-btn" data-target="${alert.targetWidget}">
            ${alert.actionText} <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      `;

      card.querySelector(".alert-action-btn").addEventListener("click", () => {
        this.rankingEngine.trackInteraction(alert.targetWidget);
        this.scrollToWidget(alert.targetWidget);
      });

      this.el.priorityAlertsArea.appendChild(card);
    });
  }

  renderWidgets() {
    const pDef = PERSONA_DEFINITIONS[this.activePersona];
    const { featured, secondary } = this.rankingEngine.rankWidgets(
      this.activePersona,
      this.currentWeatherData,
      pDef
    );

    this.el.featuredWidgetsContainer.innerHTML = "";
    featured.forEach(w => {
      const widgetNode = this.buildWidgetElement(w.id);
      if (widgetNode) this.el.featuredWidgetsContainer.appendChild(widgetNode);
    });

    this.el.secondaryWidgetsContainer.innerHTML = "";
    secondary.forEach(w => {
      const widgetNode = this.buildWidgetElement(w.id);
      if (widgetNode) this.el.secondaryWidgetsContainer.appendChild(widgetNode);
    });

    this.el.moreInsightsCount.textContent = secondary.length;
  }

  buildWidgetElement(widgetId) {
    const weather = this.currentWeatherData.weather;
    const card = document.createElement("div");
    card.className = "app-widget-card";
    card.id = `widget_${widgetId}`;

    card.addEventListener("click", () => {
      this.rankingEngine.trackInteraction(widgetId);
    });

    switch (widgetId) {
      case "run_score":
        card.innerHTML = `
          <div class="widget-card-header">
            <div class="widget-card-title"><i class="fa-solid fa-person-running" style="color: #ff6b35;"></i> Running & Fitness Hours</div>
            <span class="widget-status-badge badge-green">Prime: 6:00 AM</span>
          </div>
          <p style="font-size: 0.8rem; color: #475569; margin-bottom: 10px;">
            Calculated from heat stress index, current PM2.5 AQI (${weather.airQuality.aqi}) and wind resistance.
          </p>
          <div style="background: #f8fafc; border-radius: 10px; padding: 10px; display: flex; justify-content: space-between; font-size: 0.78rem;">
            <span>🌅 <strong>06:00 - 07:30 AM:</strong> 85/100 (Best)</span>
            <span>🌆 <strong>06:00 - 07:30 PM:</strong> 62/100 (Fair)</span>
          </div>
        `;
        return card;

      case "aqi_breakdown":
        const aqi = weather.airQuality.aqi;
        const pointerPercent = Math.min(100, Math.max(0, (aqi / 350) * 100));
        card.innerHTML = `
          <div class="widget-card-header">
            <div class="widget-card-title"><i class="fa-solid fa-mask-face" style="color: #2563eb;"></i> CPCB Real-Time Air Quality</div>
            <span class="widget-status-badge ${aqi > 200 ? 'badge-red' : aqi > 100 ? 'badge-orange' : 'badge-green'}">AQI ${aqi} · ${weather.airQuality.category}</span>
          </div>
          <div class="aqi-visual-bar">
            <div class="aqi-pointer-pin" style="left: ${pointerPercent}%;"></div>
          </div>
          <div class="aqi-grid-details">
            <div class="sub-pollutant"><span class="lbl">PM2.5</span><span class="val">${weather.airQuality.pm25} µg</span></div>
            <div class="sub-pollutant"><span class="lbl">PM10</span><span class="val">${weather.airQuality.pm10} µg</span></div>
            <div class="sub-pollutant"><span class="lbl">O3</span><span class="val">${weather.airQuality.o3} ppb</span></div>
            <div class="sub-pollutant"><span class="lbl">NO2</span><span class="val">${weather.airQuality.no2} ppb</span></div>
          </div>
        `;
        return card;

      case "agro_score":
      case "gkms_advisory":
        card.innerHTML = `
          <div class="widget-card-header">
            <div class="widget-card-title"><i class="fa-solid fa-seedling" style="color: #10b981;"></i> Gramin Krishi Mausam Sewa (GKMS)</div>
            <span class="gkms-badge-pill"><i class="fa-solid fa-check"></i> IMD Agromet</span>
          </div>
          <div class="gkms-advisory-quote">
            "${weather.agriculture.gkmsAdvisory}"
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.74rem; color: #475569;">
            <span><i class="fa-solid fa-droplet"></i> Soil Moisture: <strong>${weather.agriculture.soilMoisture}%</strong></span>
            <span><i class="fa-solid fa-snowflake"></i> Frost Risk: <strong>${weather.agriculture.frostRisk}</strong></span>
          </div>
        `;
        return card;

      case "soil_moisture":
      case "spray_window":
        card.innerHTML = `
          <div class="widget-card-header">
            <div class="widget-card-title"><i class="fa-solid fa-spray-can" style="color: #059669;"></i> Pesticide & Fertilizer Spray Window</div>
            <span class="widget-status-badge badge-green">Clear Window</span>
          </div>
          <p style="font-size: 0.8rem; color: #334155; margin-bottom: 8px;">
            <strong>Optimal Hours:</strong> ${weather.agriculture.bestSprayWindow}
          </p>
          <div style="font-size: 0.72rem; color: #64748b;">
            Wind speed is calm at ${weather.windSpeed} km/h (${weather.windDirection}). No rain washout risk for the next 6 hours.
          </div>
        `;
        return card;

      case "tide_card":
      case "wave_swell":
        if (!weather.tides) return null;
        card.innerHTML = `
          <div class="widget-card-header">
            <div class="widget-card-title"><i class="fa-solid fa-water" style="color: #0284c7;"></i> INCOIS Tide Schedule & Surf</div>
            <span class="widget-status-badge badge-blue">Coastal Zone</span>
          </div>
          <div class="tide-timeline">
            <div class="tide-node">
              <span class="tide-type">🌊 HIGH TIDE</span>
              <span class="tide-val">${weather.tides.highTide}</span>
            </div>
            <i class="fa-solid fa-arrows-left-right" style="color: #0284c7;"></i>
            <div class="tide-node">
              <span class="tide-type">🏖️ LOW TIDE</span>
              <span class="tide-val">${weather.tides.lowTide}</span>
            </div>
          </div>
          <div style="font-size: 0.74rem; color: #475569;">
            <strong>Wave Height:</strong> ${weather.tides.waveHeight} · <strong>Sea Temp:</strong> ${weather.tides.seaSurfaceTemp}°C
          </div>
        `;
        return card;

      case "traffic_weather":
      case "commute_score":
        card.innerHTML = `
          <div class="widget-card-header">
            <div class="widget-card-title"><i class="fa-solid fa-car" style="color: #7209b7;"></i> Traffic-Weather Fusion</div>
            <span class="widget-status-badge badge-purple">${weather.trafficImpact.congestionLevel}</span>
          </div>
          <p style="font-size: 0.8rem; color: #334155; margin-bottom: 6px;">
            <strong>Commute Corridor:</strong> ${weather.trafficImpact.hotspot}
          </p>
          <div style="background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 8px; padding: 8px 10px; font-size: 0.74rem; color: #581c87;">
            <i class="fa-solid fa-triangle-exclamation"></i> ${weather.trafficImpact.peakRainRisk}
          </div>
        `;
        return card;

      case "rain_alert":
        card.innerHTML = `
          <div class="widget-card-header">
            <div class="widget-card-title"><i class="fa-solid fa-cloud-showers-heavy" style="color: #2563eb;"></i> Precipitation & Rain Radar</div>
            <span class="widget-status-badge ${weather.rainChance > 50 ? 'badge-blue' : 'badge-green'}">${weather.rainChance}% Probability</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; margin: 8px 0;">
            <span>Expected Onset: <strong>${weather.rainChance > 40 ? '04:00 PM' : 'Nil'}</strong></span>
            <span>Humidity: <strong>${weather.humidity}%</strong></span>
          </div>
          <div style="background: #e0f2fe; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background: #0284c7; width: ${weather.rainChance}%; height: 100%;"></div>
          </div>
        `;
        return card;

      case "hourly_comfort":
        let stripHtml = "";
        weather.forecastHourly.forEach(item => {
          stripHtml += `
            <div class="hourly-pill">
              <span style="color: #64748b;">${item.time}</span>
              <i class="fa-solid ${item.icon}" style="color: #f59e0b;"></i>
              <span style="font-weight: 800;">${item.temp}°</span>
              <span style="font-size: 0.62rem; color: #0284c7;">${item.rain}% rain</span>
            </div>
          `;
        });
        card.innerHTML = `
          <div class="widget-card-header">
            <div class="widget-card-title"><i class="fa-solid fa-clock" style="color: #f59e0b;"></i> Hourly Suitability Forecast</div>
            <span class="widget-status-badge badge-blue">Next 24h</span>
          </div>
          <div class="hourly-strip">${stripHtml}</div>
        `;
        return card;

      case "uv_heat":
        card.innerHTML = `
          <div class="widget-card-header">
            <div class="widget-card-title"><i class="fa-solid fa-sun" style="color: #f59e0b;"></i> Solar UV & Thermal Comfort</div>
            <span class="widget-status-badge badge-orange">UV ${weather.uvIndex}</span>
          </div>
          <p style="font-size: 0.78rem; color: #475569; margin-bottom: 6px;">
            Apparent temperature feels like <strong>${weather.feelsLike}°C</strong> with ${weather.humidity}% relative humidity.
          </p>
          <div style="font-size: 0.74rem; color: #b45309;">
            <i class="fa-solid fa-glasses"></i> Wear UV-protective sunglasses between 11 AM - 3 PM.
          </div>
        `;
        return card;

      default:
        card.innerHTML = `
          <div class="widget-card-header">
            <div class="widget-card-title"><i class="fa-solid fa-circle-info"></i> Atmospheric Insights</div>
          </div>
          <p style="font-size: 0.8rem; color: #475569;">
            Atmospheric pressure: ${weather.pressure} hPa · Visibility: ${weather.visibility} km
          </p>
        `;
        return card;
    }
  }

  scrollToWidget(widgetId) {
    const el = document.getElementById(`widget_${widgetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.boxShadow = "0 0 0 3px #2563eb";
      setTimeout(() => { el.style.boxShadow = ""; }, 2000);
    } else {
      this.el.secondaryWidgetsContainer.classList.add("open");
      setTimeout(() => {
        const secEl = document.getElementById(`widget_${widgetId}`);
        secEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
    }
  }

  // ==========================================================================
  // CONVERSATIONAL CHAT ASSISTANT LOGIC (Full History Stream)
  // ==========================================================================
  loadChatHistory() {
    try {
      const data = localStorage.getItem(this.chatStorageKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn("Could not load chat history", e);
    }

    // Default welcoming message
    return [
      {
        id: "msg_welcome",
        sender: "assistant",
        text: "नमस्ते! I am Mausam AI, your personalized weather assistant. I calculate real-time Comfort Scores (Run Score, Agro Spraying Window, Beach Tides, Commute Friction). Ask me anything in English or हिन्दी!",
        timestamp: "Just now",
        personaTag: "Mausam AI",
        widgetTarget: null
      }
    ];
  }

  saveChatHistory() {
    try {
      localStorage.setItem(this.chatStorageKey, JSON.stringify(this.chatMessages));
    } catch (e) {
      console.warn("Could not save chat history", e);
    }
  }

  clearChatHistory() {
    this.chatMessages = [
      {
        id: `msg_${Date.now()}`,
        sender: "assistant",
        text: "Chat history cleared. How can I help you with today's weather?",
        timestamp: "Just now",
        personaTag: "Mausam AI",
        widgetTarget: null
      }
    ];
    this.saveChatHistory();
    this.renderChatHistory();
  }

  renderChatHistory() {
    if (!this.el.chatMessagesContainer) return;
    this.el.chatMessagesContainer.innerHTML = "";

    this.chatMessages.forEach(msg => {
      const row = document.createElement("div");
      row.className = `chat-message-row ${msg.sender}`;

      const avatar = document.createElement("div");
      avatar.className = "chat-bubble-avatar";
      avatar.innerHTML = msg.sender === "user" 
        ? `<i class="fa-solid fa-user"></i>` 
        : `<i class="fa-solid fa-robot"></i>`;

      const content = document.createElement("div");
      content.className = "chat-bubble-content";

      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";
      bubble.textContent = msg.text;

      // Action button if assistant suggested a persona or widget
      if (msg.sender === "assistant" && msg.widgetTarget) {
        const actionBtn = document.createElement("button");
        actionBtn.className = "chat-action-btn";
        actionBtn.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> View ${msg.personaTag || 'Widget'}`;
        actionBtn.addEventListener("click", () => {
          this.closeVoiceModal();
          if (msg.persona) {
            this.activePersona = msg.persona;
            this.renderPersonaPills();
            this.renderHeroSection();
            this.renderAlerts();
            this.renderWidgets();
          }
          if (msg.widgetTarget) {
            setTimeout(() => this.scrollToWidget(msg.widgetTarget), 350);
          }
        });
        bubble.appendChild(document.createElement("br"));
        bubble.appendChild(actionBtn);
      }

      const meta = document.createElement("div");
      meta.className = "chat-meta-bar";
      meta.innerHTML = `<span>${msg.timestamp}</span>`;

      if (msg.sender === "assistant") {
        const speakBtn = document.createElement("button");
        speakBtn.className = "chat-speak-btn";
        speakBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Listen`;
        speakBtn.addEventListener("click", () => {
          this.voiceEngine.speak(msg.text, msg.isHindi ? "hi-IN" : "en-IN");
        });
        meta.appendChild(speakBtn);
      }

      content.appendChild(bubble);
      content.appendChild(meta);

      row.appendChild(avatar);
      row.appendChild(content);

      this.el.chatMessagesContainer.appendChild(row);
    });

    // Auto-scroll to latest
    this.el.chatMessagesContainer.scrollTop = this.el.chatMessagesContainer.scrollHeight;
  }

  submitChatMessage(userQuery) {
    if (!userQuery || !userQuery.trim()) return;
    const query = userQuery.trim();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Add User Message
    this.chatMessages.push({
      id: `user_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: timeStr
    });
    this.saveChatHistory();
    this.renderChatHistory();

    // 2. Render Typing Indicator
    const typingRow = document.createElement("div");
    typingRow.className = "chat-message-row assistant";
    typingRow.id = "chatTypingIndicator";
    typingRow.innerHTML = `
      <div class="chat-bubble-avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="chat-bubble-content">
        <div class="chat-bubble" style="padding: 8px 12px;">
          <div class="typing-dots">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>
    `;
    this.el.chatMessagesContainer.appendChild(typingRow);
    this.el.chatMessagesContainer.scrollTop = this.el.chatMessagesContainer.scrollHeight;

    // 3. Process Query through NLP Voice Engine
    setTimeout(() => {
      const result = this.voiceEngine.processQuery(
        query,
        this.currentWeatherData,
        this.comfortScores
      );

      // Remove typing indicator
      const ind = document.getElementById("chatTypingIndicator");
      if (ind) ind.remove();

      // Add Assistant Message
      this.chatMessages.push({
        id: `asst_${Date.now()}`,
        sender: "assistant",
        text: result.answer,
        timestamp: timeStr,
        personaTag: PERSONA_DEFINITIONS[result.persona]?.title || result.persona,
        persona: result.persona,
        widgetTarget: result.widgetId,
        isHindi: result.isHindi
      });

      this.saveChatHistory();
      this.renderChatHistory();

      // Automatically speak the response
      this.voiceEngine.speak(result.answer, result.isHindi ? "hi-IN" : "en-IN");
    }, 450);
  }

  openVoiceModal(startMic = false) {
    this.el.voiceModal.classList.add("active");
    this.renderChatHistory();
    if (startMic) {
      setTimeout(() => this.voiceEngine.startListening(), 300);
    }
  }

  closeVoiceModal() {
    this.voiceEngine.stopListening();
    this.el.voiceModal.classList.remove("active");
  }

  // Onboarding Persona Multi-select
  openOnboardingModal() {
    this.el.onboardingModal.classList.add("active");
    this.renderOnboardingOptions();
  }

  renderOnboardingOptions() {
    this.el.onboardingGrid.innerHTML = "";
    Object.keys(PERSONA_DEFINITIONS).forEach(key => {
      const p = PERSONA_DEFINITIONS[key];
      const isSelected = this.userPersonas.includes(key);
      const item = document.createElement("div");
      item.className = `onboarding-item ${isSelected ? 'selected' : ''}`;
      item.innerHTML = `
        <div class="icon-row">
          <i class="fa-solid ${p.icon}" style="color: ${p.color};"></i>
          <div class="check-indicator"><i class="fa-solid fa-check"></i></div>
        </div>
        <h4>${p.title}</h4>
        <p>${p.tagline}</p>
      `;

      item.addEventListener("click", () => {
        if (this.userPersonas.includes(key)) {
          if (this.userPersonas.length > 1) {
            this.userPersonas = this.userPersonas.filter(x => x !== key);
          }
        } else {
          this.userPersonas.push(key);
        }
        item.classList.toggle("selected", this.userPersonas.includes(key));
      });

      this.el.onboardingGrid.appendChild(item);
    });
  }

  saveOnboarding() {
    localStorage.setItem("mausam_user_personas", JSON.stringify(this.userPersonas));
    localStorage.setItem("mausam_onboarding_completed", "true");
    this.activePersona = this.userPersonas[0] || "runner";
    this.el.onboardingModal.classList.remove("active");
    this.loadApplication();
  }

  // Doppler Radar Modal
  openRadarModal() {
    this.el.radarModal.classList.add("active");
  }

  closeRadarModal() {
    this.el.radarModal.classList.remove("active");
  }
}

// Bootstrap application on DOM load
window.addEventListener("DOMContentLoaded", () => {
  window.mausamApp = new MausamApp();
});
