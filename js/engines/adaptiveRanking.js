/**
 * Adaptive Widget Ranking & Alert Prioritization Engine
 * Re-ranks homepage widgets dynamically based on:
 * 1. Active Persona preference
 * 2. Real-time meteorological urgency (hazard alerts bubble to top)
 * 3. User engagement & interaction telemetry (clicks, pins, expansions)
 * 4. Partitions into Top 4-5 Hero Widgets + "More Insights"
 */

export class AdaptiveRankingEngine {
  constructor() {
    this.storageKey = "mausam_widget_engagement_v1";
    this.engagement = this.loadEngagement();
  }

  loadEngagement() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  saveEngagement() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.engagement));
    } catch (e) {
      console.warn("Could not save engagement to localStorage", e);
    }
  }

  trackInteraction(widgetId) {
    if (!this.engagement[widgetId]) {
      this.engagement[widgetId] = 0;
    }
    this.engagement[widgetId] += 1;
    this.saveEngagement();
  }

  resetEngagement() {
    this.engagement = {};
    this.saveEngagement();
  }

  /**
   * Evaluate and rank all available widgets
   * @param {string} activePersona 
   * @param {Object} location 
   * @param {Object} personaDef 
   * @returns {Object} { featured: Widget[], secondary: Widget[] }
   */
  rankWidgets(activePersona, location, personaDef) {
    const weather = location.weather;
    const baseList = [
      {
        id: "run_score",
        title: "Fitness & Run Score",
        category: "fitness",
        icon: "fa-person-running",
        personaMatch: ["runner", "health"],
        urgency: 0
      },
      {
        id: "agro_score",
        title: "Agro Spraying & Field Index",
        category: "agriculture",
        icon: "fa-seedling",
        personaMatch: ["farmer"],
        urgency: 0
      },
      {
        id: "soil_moisture",
        title: "Soil Moisture & Frost Risk",
        category: "agriculture",
        icon: "fa-droplet",
        personaMatch: ["farmer"],
        urgency: 0
      },
      {
        id: "gkms_advisory",
        title: "IMD GKMS Agromet Advisory",
        category: "agriculture",
        icon: "fa-building-wheat",
        personaMatch: ["farmer"],
        urgency: 0
      },
      {
        id: "spray_window",
        title: "Optimal Chemical Spray Window",
        category: "agriculture",
        icon: "fa-spray-can",
        personaMatch: ["farmer"],
        urgency: 0
      },
      {
        id: "commute_score",
        title: "Transit & Commute Index",
        category: "commute",
        icon: "fa-car",
        personaMatch: ["commuter", "parent"],
        urgency: 0
      },
      {
        id: "traffic_weather",
        title: "Traffic-Weather Fusion",
        category: "commute",
        icon: "fa-road-circle-exclamation",
        personaMatch: ["commuter"],
        urgency: 0
      },
      {
        id: "beach_score",
        title: "Beach & Coastal Suitability",
        category: "coastal",
        icon: "fa-umbrella-beach",
        personaMatch: ["beach", "travel"],
        urgency: 0
      },
      {
        id: "tide_card",
        title: "INCOIS Tide Schedule & Swell",
        category: "coastal",
        icon: "fa-water",
        personaMatch: ["beach"],
        urgency: 0
      },
      {
        id: "wave_swell",
        title: "Wave Height & Ocean Temp",
        category: "coastal",
        icon: "fa-ship",
        personaMatch: ["beach"],
        urgency: 0
      },
      {
        id: "parent_score",
        title: "Playground & Child Comfort",
        category: "family",
        icon: "fa-children",
        personaMatch: ["parent"],
        urgency: 0
      },
      {
        id: "clothing_tip",
        title: "Child Attire & Hydration Guide",
        category: "family",
        icon: "fa-shirt",
        personaMatch: ["parent", "runner"],
        urgency: 0
      },
      {
        id: "event_score",
        title: "Outdoor Event Feasibility",
        category: "event",
        icon: "fa-calendar-check",
        personaMatch: ["event"],
        urgency: 0
      },
      {
        id: "wind_gusts",
        title: "Wind Speed & Tent Stability",
        category: "event",
        icon: "fa-wind",
        personaMatch: ["event", "farmer", "beach"],
        urgency: 0
      },
      {
        id: "health_score",
        title: "Respiratory & Allergy Index",
        category: "health",
        icon: "fa-lungs",
        personaMatch: ["health", "runner", "parent"],
        urgency: 0
      },
      {
        id: "aqi_breakdown",
        title: "Air Quality (CPCB Real-Time)",
        category: "health",
        icon: "fa-mask-face",
        personaMatch: ["health", "runner", "commuter", "parent"],
        urgency: 0
      },
      {
        id: "uv_heat",
        title: "Solar UV & Heat Index",
        category: "comfort",
        icon: "fa-sun",
        personaMatch: ["runner", "beach", "parent", "event", "farmer"],
        urgency: 0
      },
      {
        id: "rain_alert",
        title: "Rain Onset & Precipitation Radar",
        category: "rain",
        icon: "fa-cloud-rain",
        personaMatch: ["runner", "commuter", "farmer", "event", "parent", "travel"],
        urgency: 0
      },
      {
        id: "hourly_comfort",
        title: "24-Hour Suitability Timeline",
        category: "timeline",
        icon: "fa-clock",
        personaMatch: ["runner", "commuter", "farmer", "event", "beach", "health"],
        urgency: 0
      },
      {
        id: "visibility_card",
        title: "Atmospheric Visibility & Fog",
        category: "transit",
        icon: "fa-eye",
        personaMatch: ["commuter", "travel"],
        urgency: 0
      }
    ];

    // Calculate dynamic weights
    const scoredList = baseList.map(widget => {
      let weight = 0;

      // 1. Persona Primary Match
      if (personaDef && personaDef.primaryWidgets && personaDef.primaryWidgets.includes(widget.id)) {
        weight += 80;
      } else if (widget.personaMatch.includes(activePersona)) {
        weight += 50;
      }

      // 2. Severe Condition Urgency Boost
      if (widget.id === "rain_alert" && weather.rainChance > 40) {
        weight += weather.rainChance; // up to +90 boost
      }
      if (widget.id === "aqi_breakdown" && weather.airQuality && weather.airQuality.aqi > 180) {
        weight += 60;
      }
      if (widget.id === "tide_card" && weather.tides) {
        weight += 30;
      } else if (widget.id === "tide_card" && !weather.tides) {
        weight -= 200; // eliminate for inland cities
      }
      if (widget.id === "soil_moisture" && location.type === "agricultural_plain") {
        weight += 40;
      }

      // 3. User engagement telemetry
      const userInteractions = this.engagement[widget.id] || 0;
      weight += Math.min(30, userInteractions * 4);

      return { ...widget, dynamicScore: weight };
    });

    // Sort descending by calculated dynamic score
    scoredList.sort((a, b) => b.dynamicScore - a.dynamicScore);

    // Filter out irrelevant cards (e.g. tides for landlocked cities)
    const validWidgets = scoredList.filter(w => w.dynamicScore > -50);

    // Top 4-5 are featured hero widgets; rest go into "More Insights"
    const featured = validWidgets.slice(0, 5);
    const secondary = validWidgets.slice(5);

    return {
      featured,
      secondary
    };
  }

  /**
   * Generate Urgency-Ranked Alerts (Slide 2 & 4: avoids alert fatigue)
   * @param {Object} location 
   * @param {string} persona 
   * @returns {Array} List of prioritized alerts
   */
  generatePrioritizedAlerts(location, persona) {
    const weather = location.weather;
    const alerts = [];

    // Severe Weather Alerts (Priority 1: Urgent)
    if (weather.airQuality && weather.airQuality.aqi > 200) {
      alerts.push({
        id: "aqi_severe",
        level: "severe",
        badge: "HEALTH ALERT",
        icon: "fa-triangle-exclamation",
        title: "Severe Air Quality Spike (AQI: " + weather.airQuality.aqi + ")",
        message: "PM2.5 levels are hazardous for outdoor cardio & asthmatics. N95 mask advised.",
        actionText: "Check AQI details",
        targetWidget: "aqi_breakdown",
        personaAffinity: ["runner", "health", "parent", "commuter"]
      });
    }

    if (weather.rainChance >= 60) {
      alerts.push({
        id: "rain_heavy",
        level: "warning",
        badge: "RAIN ALERT",
        icon: "fa-cloud-showers-water",
        title: `Heavy Rain Expected Today (${weather.rainChance}% Probability)`,
        message: "Onset expected in the afternoon. High risk of localized waterlogging on arterial roads.",
        actionText: "View Rain Radar",
        targetWidget: "rain_alert",
        personaAffinity: ["commuter", "parent", "farmer", "event"]
      });
    }

    if (weather.agriculture && weather.agriculture.frostRisk && weather.agriculture.frostRisk.includes("High")) {
      alerts.push({
        id: "frost_warning",
        level: "warning",
        badge: "AGROMET ALERT",
        icon: "fa-snowflake",
        title: "Night Frost Advisory for Standing Crops",
        message: "Sub-surface temperatures nearing frost threshold. Apply surface irrigation to orchards & winter vegetables.",
        actionText: "View GKMS Advisory",
        targetWidget: "gkms_advisory",
        personaAffinity: ["farmer"]
      });
    }

    if (weather.tides && weather.weather?.windSpeed > 20) {
      alerts.push({
        id: "high_tide",
        level: "info",
        badge: "COASTAL ADVISORY",
        icon: "fa-water",
        title: `Spring High Tide at ${weather.tides.highTide}`,
        message: "Rough surf conditions. Public cautioned against venturing into sea water.",
        actionText: "View Tide Schedule",
        targetWidget: "tide_card",
        personaAffinity: ["beach", "travel"]
      });
    }

    // Filter alerts to persona context to reduce fatigue, while preserving severe alerts for all
    return alerts.filter(alert => {
      if (alert.level === "severe") return true; // Everyone sees severe emergencies
      return alert.personaAffinity.includes(persona);
    });
  }
}
