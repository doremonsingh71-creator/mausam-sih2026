/**
 * Mock & Regional Indian Datasets for Mausam Persona-Aware App
 * Covers IMD GKMS (Gramin Krishi Mausam Sewa), Mausamgram hyper-local data,
 * Central Pollution Control Board (CPCB) AQI, and INCOIS Marine/Tide data.
 */

export const INDIAN_LOCATIONS = {
  delhi: {
    id: "delhi",
    name: "New Delhi",
    state: "Delhi NCR",
    type: "urban_metro",
    lat: 28.6139,
    lon: 77.2090,
    panchayat: "Chanakyapuri Urban Block",
    weather: {
      temp: 26,
      feelsLike: 27,
      condition: "Hazy & Warm",
      icon: "fa-cloud-sun",
      humidity: 58,
      windSpeed: 8, // km/h
      windDirection: "NW",
      uvIndex: 4,
      rainChance: 15,
      pressure: 1012,
      visibility: 3.2, // km
      airQuality: {
        aqi: 218,
        category: "Poor",
        primaryPollutant: "PM2.5",
        pm25: 142,
        pm10: 235,
        o3: 45,
        no2: 68
      },
      forecastHourly: [
        { time: "06:00", temp: 19, aqi: 180, rain: 5, icon: "fa-sun" },
        { time: "08:00", temp: 22, aqi: 210, rain: 5, icon: "fa-sun" },
        { time: "10:00", temp: 26, aqi: 225, rain: 10, icon: "fa-cloud-sun" },
        { time: "12:00", temp: 29, aqi: 218, rain: 15, icon: "fa-cloud-sun" },
        { time: "14:00", temp: 31, aqi: 205, rain: 20, icon: "fa-cloud-sun" },
        { time: "16:00", temp: 28, aqi: 220, rain: 25, icon: "fa-cloud" },
        { time: "18:00", temp: 25, aqi: 240, rain: 15, icon: "fa-cloud-sun" },
        { time: "20:00", temp: 23, aqi: 255, rain: 10, icon: "fa-moon" }
      ],
      tides: null,
      agriculture: {
        soilMoisture: 42,
        soilTemp: 22,
        evapotranspiration: 3.4,
        frostRisk: "None",
        gkmsAdvisory: "Protect nursery seedlings with light irrigation. Avoid burning crop residues.",
        bestSprayWindow: "10:00 AM - 01:00 PM (Wind < 10 km/h)"
      },
      trafficImpact: {
        congestionLevel: "High",
        hotspot: "Ring Road & Outer Ring Road",
        peakRainRisk: "Low today"
      }
    }
  },
  mumbai: {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    type: "coastal",
    lat: 19.0760,
    lon: 72.8777,
    panchayat: "Bandra-Colaba Coastal Zone",
    weather: {
      temp: 31,
      feelsLike: 36,
      condition: "Humid & Showers Predicted",
      icon: "fa-cloud-showers-heavy",
      humidity: 82,
      windSpeed: 18,
      windDirection: "WSW",
      uvIndex: 8,
      rainChance: 65,
      pressure: 1008,
      visibility: 6.0,
      airQuality: {
        aqi: 72,
        category: "Satisfactory",
        primaryPollutant: "PM10",
        pm25: 28,
        pm10: 74,
        o3: 22,
        no2: 34
      },
      forecastHourly: [
        { time: "06:00", temp: 27, aqi: 65, rain: 20, icon: "fa-sun" },
        { time: "09:00", temp: 29, aqi: 68, rain: 30, icon: "fa-cloud-sun" },
        { time: "12:00", temp: 32, aqi: 75, rain: 45, icon: "fa-cloud-sun" },
        { time: "15:00", temp: 31, aqi: 72, rain: 70, icon: "fa-cloud-showers-heavy" },
        { time: "18:00", temp: 29, aqi: 70, rain: 60, icon: "fa-cloud-rain" },
        { time: "21:00", temp: 28, aqi: 65, rain: 40, icon: "fa-cloud" }
      ],
      tides: {
        highTide: "02:45 PM (4.2m)",
        lowTide: "08:15 PM (1.1m)",
        nextTide: "High Tide at 02:45 PM",
        waveHeight: "1.8m (Moderate Swell)",
        seaSurfaceTemp: 29,
        waterSafety: "Caution near rocky promenade during high tide."
      },
      agriculture: {
        soilMoisture: 78,
        soilTemp: 27,
        evapotranspiration: 4.8,
        frostRisk: "None",
        gkmsAdvisory: "Ensure drainage in low lying vegetable fields due to forecast showers.",
        bestSprayWindow: "Not recommended due to 65% rain probability"
      },
      trafficImpact: {
        congestionLevel: "Very High",
        hotspot: "Western Express Highway & Hindmata",
        peakRainRisk: "4 PM - 7 PM (Waterlogging alert in low-lying areas)"
      }
    }
  },
  ludhiana: {
    id: "ludhiana",
    name: "Ludhiana",
    state: "Punjab",
    type: "agricultural_plain",
    lat: 30.9010,
    lon: 75.8573,
    panchayat: "Gill Gram Panchayat (GKMS Agromet Station)",
    weather: {
      temp: 21,
      feelsLike: 21,
      condition: "Clear & Crisp",
      icon: "fa-sun",
      humidity: 50,
      windSpeed: 6,
      windDirection: "NW",
      uvIndex: 5,
      rainChance: 5,
      pressure: 1016,
      visibility: 8.5,
      airQuality: {
        aqi: 110,
        category: "Moderate",
        primaryPollutant: "PM2.5",
        pm25: 58,
        pm10: 112,
        o3: 31,
        no2: 24
      },
      forecastHourly: [
        { time: "05:00", temp: 12, aqi: 95, rain: 0, icon: "fa-moon" },
        { time: "07:00", temp: 15, aqi: 105, rain: 0, icon: "fa-sun" },
        { time: "10:00", temp: 20, aqi: 115, rain: 5, icon: "fa-sun" },
        { time: "13:00", temp: 23, aqi: 110, rain: 5, icon: "fa-sun" },
        { time: "16:00", temp: 21, aqi: 108, rain: 0, icon: "fa-sun" },
        { time: "19:00", temp: 16, aqi: 120, rain: 0, icon: "fa-moon" }
      ],
      tides: null,
      agriculture: {
        soilMoisture: 65,
        soilTemp: 18,
        evapotranspiration: 2.8,
        frostRisk: "Low (Night min > 10°C)",
        gkmsAdvisory: "Optimal window for wheat top-dressing with urea. Soil moisture adequate. Light hoeing advised.",
        bestSprayWindow: "08:30 AM - 02:00 PM (Wind calm < 7 km/h, zero rain risk)"
      },
      trafficImpact: {
        congestionLevel: "Low",
        hotspot: "GT Road bypass",
        peakRainRisk: "None"
      }
    }
  },
  bengaluru: {
    id: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    type: "urban_plateau",
    lat: 12.9716,
    lon: 77.5946,
    panchayat: "Yelahanka - Bellandur Tech Corridor",
    weather: {
      temp: 24,
      feelsLike: 24,
      condition: "Pleasant & Breezy",
      icon: "fa-cloud-sun",
      humidity: 62,
      windSpeed: 14,
      windDirection: "E",
      uvIndex: 6,
      rainChance: 25,
      pressure: 1014,
      visibility: 9.0,
      airQuality: {
        aqi: 54,
        category: "Satisfactory",
        primaryPollutant: "PM10",
        pm25: 18,
        pm10: 55,
        o3: 28,
        no2: 26
      },
      forecastHourly: [
        { time: "06:00", temp: 18, aqi: 48, rain: 5, icon: "fa-sun" },
        { time: "09:00", temp: 22, aqi: 52, rain: 10, icon: "fa-sun" },
        { time: "12:00", temp: 26, aqi: 58, rain: 15, icon: "fa-cloud-sun" },
        { time: "15:00", temp: 25, aqi: 55, rain: 30, icon: "fa-cloud-rain" },
        { time: "18:00", temp: 22, aqi: 52, rain: 20, icon: "fa-cloud" },
        { time: "21:00", temp: 20, aqi: 50, rain: 10, icon: "fa-moon" }
      ],
      tides: null,
      agriculture: {
        soilMoisture: 55,
        soilTemp: 21,
        evapotranspiration: 3.6,
        frostRisk: "None",
        gkmsAdvisory: "Favorable conditions for vegetable harvesting and drip fertigation.",
        bestSprayWindow: "07:00 AM - 11:00 AM (Before afternoon gust increases)"
      },
      trafficImpact: {
        congestionLevel: "Moderate to High",
        hotspot: "Outer Ring Road (Silk Board to Marathahalli)",
        peakRainRisk: "Passing shower possible at 4:30 PM"
      }
    }
  },
  shimla: {
    id: "shimla",
    name: "Shimla",
    state: "Himachal Pradesh",
    type: "mountain",
    lat: 31.1048,
    lon: 77.1734,
    panchayat: "Mashobra Agromet Station",
    weather: {
      temp: 11,
      feelsLike: 9,
      condition: "Chilly & Misty",
      icon: "fa-smog",
      humidity: 75,
      windSpeed: 12,
      windDirection: "NNE",
      uvIndex: 4,
      rainChance: 35,
      pressure: 1022,
      visibility: 4.0,
      airQuality: {
        aqi: 32,
        category: "Good",
        primaryPollutant: "PM10",
        pm25: 10,
        pm10: 32,
        o3: 35,
        no2: 12
      },
      forecastHourly: [
        { time: "06:00", temp: 4, aqi: 28, rain: 10, icon: "fa-smog" },
        { time: "09:00", temp: 8, aqi: 30, rain: 15, icon: "fa-cloud-sun" },
        { time: "12:00", temp: 13, aqi: 35, rain: 25, icon: "fa-cloud-sun" },
        { time: "15:00", temp: 11, aqi: 32, rain: 40, icon: "fa-cloud-rain" },
        { time: "18:00", temp: 7, aqi: 30, rain: 20, icon: "fa-cloud" },
        { time: "21:00", temp: 5, aqi: 28, rain: 10, icon: "fa-moon" }
      ],
      tides: null,
      agriculture: {
        soilMoisture: 72,
        soilTemp: 10,
        evapotranspiration: 1.5,
        frostRisk: "High (Night min drops to 2°C)",
        gkmsAdvisory: "Apply light surface irrigation to apple orchards to protect against night frost injury.",
        bestSprayWindow: "Avoid early morning due to heavy dew and cold mist"
      },
      trafficImpact: {
        congestionLevel: "Moderate",
        hotspot: "Kalka-Shimla NH5 & Sanjauli Bypass",
        peakRainRisk: "Dense fog & slip hazard between 6 PM - 8 AM"
      }
    }
  }
};

export const PERSONA_DEFINITIONS = {
  runner: {
    id: "runner",
    title: "Runner / Fitness",
    tagline: "Run hours, AQI, Heat & UV stress",
    icon: "fa-person-running",
    color: "#ff6b35",
    colorBg: "rgba(255, 107, 53, 0.14)",
    scoreLabel: "RUN SCORE",
    primaryWidgets: ["run_score", "aqi_breakdown", "uv_heat", "rain_alert", "hourly_comfort"]
  },
  farmer: {
    id: "farmer",
    title: "Farmer / Agriculture",
    tagline: "Soil moisture, spraying window, frost & GKMS",
    icon: "fa-seedling",
    color: "#2ec4b6",
    colorBg: "rgba(46, 196, 182, 0.14)",
    scoreLabel: "AGRO SUITABILITY",
    primaryWidgets: ["agro_score", "soil_moisture", "gkms_advisory", "spray_window", "rain_alert"]
  },
  commuter: {
    id: "commuter",
    title: "Daily Commuter",
    tagline: "Traffic-weather fusion, rain onset & visibility",
    icon: "fa-car",
    color: "#7209b7",
    colorBg: "rgba(114, 9, 183, 0.14)",
    scoreLabel: "COMMUTE SCORE",
    primaryWidgets: ["commute_score", "rain_alert", "traffic_weather", "visibility_card", "hourly_comfort"]
  },
  beach: {
    id: "beach",
    title: "Beach & Coastal",
    tagline: "Tides, swell height, sea temp & coastal winds",
    icon: "fa-umbrella-beach",
    color: "#0077b6",
    colorBg: "rgba(0, 119, 182, 0.14)",
    scoreLabel: "BEACH SCORE",
    primaryWidgets: ["beach_score", "tide_card", "wave_swell", "uv_heat", "rain_alert"]
  },
  parent: {
    id: "parent",
    title: "Parents & Kids",
    tagline: "School commute, playground weather, allergens",
    icon: "fa-children",
    color: "#e63946",
    colorBg: "rgba(230, 57, 70, 0.14)",
    scoreLabel: "PLAYGROUND SCORE",
    primaryWidgets: ["parent_score", "aqi_breakdown", "rain_alert", "uv_heat", "clothing_tip"]
  },
  event: {
    id: "event",
    title: "Event Planner",
    tagline: "Go/No-Go call, hourly gust risks, heat index",
    icon: "fa-calendar-check",
    color: "#f77f00",
    colorBg: "rgba(247, 127, 0, 0.14)",
    scoreLabel: "EVENT GO/NO-GO",
    primaryWidgets: ["event_score", "rain_alert", "wind_gusts", "hourly_comfort", "uv_heat"]
  },
  health: {
    id: "health",
    title: "Health & Respiratory",
    tagline: "Fine particulates, pollen, asthma warning",
    icon: "fa-lungs",
    color: "#3a86ff",
    colorBg: "rgba(58, 134, 255, 0.14)",
    scoreLabel: "HEALTH INDEX",
    primaryWidgets: ["health_score", "aqi_breakdown", "pollen_card", "hourly_comfort", "mask_advisory"]
  },
  travel: {
    id: "travel",
    title: "Traveller & Weekend",
    tagline: "Sightseeing comfort, packing tips, transit risks",
    icon: "fa-plane-departure",
    color: "#06d6a0",
    colorBg: "rgba(6, 214, 160, 0.14)",
    scoreLabel: "TRAVEL SCORE",
    primaryWidgets: ["travel_score", "weather_overview", "packing_tip", "rain_alert", "visibility_card"]
  }
};
