/**
 * MAUSAM: Persona-Aware Weather Application
 * Smart India Hackathon 2026 - Problem Statement SIH26076
 * Team: Byte Force 02
 * Main Application Orchestrator
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
    this.simulatedTime = null; // null uses current time, or can be simulated for demo
    this.isOfflineSimulated = false;

    this.initElements();
    this.initVoiceEngine();
    this.attachEventListeners();
    this.loadApplication();
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
      
      // Modals
      onboardingModal: document.getElementById("onboardingModal"),
      onboardingGrid: document.getElementById("onboardingGrid"),
      saveOnboardingBtn: document.getElementById("saveOnboardingBtn"),
      skipOnboardingBtn: document.getElementById("skipOnboardingBtn"),
      openOnboardingBtn: document.getElementById("openOnboardingBtn"),
      
      voiceModal: document.getElementById("voiceModal"),
      closeVoiceBtn: document.getElementById("closeVoiceBtn"),
      micDockBtn: document.getElementById("micDockBtn"),
      voiceWave: document.getElementById("voiceWave"),
      voiceStatusText: document.getElementById("voiceStatusText"),
      voiceInputText: document.getElementById("voiceInputText"),
      voiceSendBtn: document.getElementById("voiceSendBtn"),
      voiceResponseCard: document.getElementById("voiceResponseCard"),
      voiceResponseText: document.getElementById("voiceResponseText"),
      voiceListenToggleBtn: document.getElementById("voiceListenToggleBtn")
    };
  }

  initVoiceEngine() {
    this.voiceEngine = new VoiceQueryEngine({
      onStateChange: (state) => {
        if (state.listening) {
          this.el.voiceWave.classList.add("active");
          this.el.voiceStatusText.textContent = "Listening... बोलिए, मैं सुन रहा हूँ...";
          this.el.micDockBtn.classList.add("listening");
        } else {
          this.el.voiceWave.classList.remove("active");
          this.el.micDockBtn.classList.remove("listening");
          if (state.error) {
            this.el.voiceStatusText.textContent = `Mic status: ${state.error}. You can also type below!`;
          } else {
            this.el.voiceStatusText.textContent = "Tap mic to speak or select a sample question:";
          }
        }

        if (state.transcript) {
          this.el.voiceInputText.value = state.transcript;
          this.handleVoiceSubmit(state.transcript);
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

    // Voice Modal Controls
    this.el.micDockBtn?.addEventListener("click", () => this.openVoiceModal());
    this.el.closeVoiceBtn?.addEventListener("click", () => this.closeVoiceModal());
    this.el.voiceSendBtn?.addEventListener("click", () => {
      const text = this.el.voiceInputText.value.trim();
      if (text) this.handleVoiceSubmit(text);
    });
    this.el.voiceInputText?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const text = this.el.voiceInputText.value.trim();
        if (text) this.handleVoiceSubmit(text);
      }
    });
    this.el.voiceListenToggleBtn?.addEventListener("click", () => {
      this.voiceEngine.startListening();
    });

    // Prompt Chips inside Voice Modal
    document.querySelectorAll(".prompt-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const query = chip.dataset.query || chip.textContent;
        this.el.voiceInputText.value = query;
        this.handleVoiceSubmit(query);
      });
    });

    // Onboarding Modal Controls
    this.el.openOnboardingBtn?.addEventListener("click", () => this.openOnboardingModal());
    this.el.saveOnboardingBtn?.addEventListener("click", () => this.saveOnboarding());
    this.el.skipOnboardingBtn?.addEventListener("click", () => {
      this.el.onboardingModal.classList.remove("active");
    });

    // Network Change Custom Event
    window.addEventListener("mausam_network_change", (e) => {
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

    // Check first-time onboarding
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
    // Demonstration tool for hackathon judges: shifts time & severe scenario
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
    this.loadApplication();
  }

  renderPersonaPills() {
    this.el.personaPillsContainer.innerHTML = "";

    // Show selected personas first, then others
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
    const topContextPersona = this.contextInference.topPersona;
    const personaTitle = PERSONA_DEFINITIONS[topContextPersona]?.title.split("/")[0] || topContextPersona;

    this.el.contextText.innerHTML = `<span><strong>Context Engine:</strong> ${reason}</span>`;
  }

  renderHeroSection() {
    const pDef = PERSONA_DEFINITIONS[this.activePersona];
    const scoreData = this.comfortScores[this.activePersona];
    const weather = this.currentWeatherData.weather;

    // Set Hero card theme gradient
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

    // Greeting
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

    // Compound Comfort Index Score
    this.el.heroScoreLabel.textContent = pDef.scoreLabel;
    this.el.heroScoreVal.innerHTML = `${scoreData.score}<span class="denom">/100</span>`;
    this.el.heroScoreBadge.textContent = scoreData.badge;
    this.el.heroVerdict.textContent = scoreData.verdict;
    this.el.heroSubtext.textContent = scoreData.subtext;

    // Quick Metrics Strip based on Persona
    this.renderHeroMetrics(this.activePersona, weather);
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
        <div class="quick-metric-item"><span class="lbl">Water Safety</span><span class="val">${weather.tides ? 'Safe with Caution' : 'N/A'}</span></div>
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

    // Render Featured Cards (Top 4-5)
    this.el.featuredWidgetsContainer.innerHTML = "";
    featured.forEach(w => {
      const widgetNode = this.buildWidgetElement(w.id);
      if (widgetNode) this.el.featuredWidgetsContainer.appendChild(widgetNode);
    });

    // Render Secondary Cards ("More Insights")
    this.el.secondaryWidgetsContainer.innerHTML = "";
    secondary.forEach(w => {
      const widgetNode = this.buildWidgetElement(w.id);
      if (widgetNode) this.el.secondaryWidgetsContainer.appendChild(widgetNode);
    });

    this.el.moreInsightsCount.textContent = secondary.length;
  }

  buildWidgetElement(widgetId) {
    const weather = this.currentWeatherData.weather;
    const location = this.currentWeatherData;
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
            <div class="widget-card-title"><i class="fa-solid fa-building-wheat" style="color: #10b981;"></i> Gramin Krishi Mausam Sewa (GKMS)</div>
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
      // If it's in secondary, open it first
      this.el.secondaryWidgetsContainer.classList.add("open");
      setTimeout(() => {
        const secEl = document.getElementById(`widget_${widgetId}`);
        secEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
    }
  }

  // Voice Assistant Dialog
  openVoiceModal() {
    this.el.voiceModal.classList.add("active");
    this.el.voiceResponseCard.style.display = "none";
    this.el.voiceInputText.value = "";
    this.voiceEngine.startListening();
  }

  closeVoiceModal() {
    this.voiceEngine.stopListening();
    this.el.voiceModal.classList.remove("active");
  }

  handleVoiceSubmit(query) {
    const result = this.voiceEngine.processQuery(
      query,
      this.currentWeatherData,
      this.comfortScores
    );

    this.el.voiceResponseCard.style.display = "block";
    this.el.voiceResponseText.textContent = result.answer;

    // Speak response using SpeechSynthesis
    this.voiceEngine.speak(result.answer, result.isHindi ? "hi-IN" : "en-IN");

    // Automatically switch persona or highlight widget if relevant
    if (result.persona && result.persona !== this.activePersona) {
      setTimeout(() => {
        this.activePersona = result.persona;
        this.renderPersonaPills();
        this.renderHeroSection();
        this.renderAlerts();
        this.renderWidgets();
      }, 1500);
    }
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
}

// Bootstrap application on DOM load
window.addEventListener("DOMContentLoaded", () => {
  window.mausamApp = new MausamApp();
});
