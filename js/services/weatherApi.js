/**
 * Weather API & Offline Cache Service
 * Fetches live weather & CPCB-equivalent AQI from Open-Meteo,
 * and maintains an offline cache for low-connectivity rural users (GKMS).
 */

import { INDIAN_LOCATIONS } from "../data/mockData.js";

export class WeatherApiService {
  constructor() {
    this.cacheKeyPrefix = "mausam_cache_";
    this.isOnline = navigator.onLine;
    this.lastSyncTime = null;
    this.initNetworkListeners();
  }

  initNetworkListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      window.dispatchEvent(new CustomEvent("mausam_network_change", { detail: { online: true } }));
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      window.dispatchEvent(new CustomEvent("mausam_network_change", { detail: { online: false } }));
    });
  }

  /**
   * Fetch weather for a location ID
   * @param {string} locationId 
   * @param {boolean} forceLive 
   */
  async getLocationWeather(locationId, forceLive = false) {
    const defaultData = INDIAN_LOCATIONS[locationId] || INDIAN_LOCATIONS.delhi;

    // Check offline mode or cached availability
    if (!this.isOnline && !forceLive) {
      const cached = this.getCached(locationId);
      return {
        data: cached ? cached.data : defaultData,
        source: "offline_cache",
        timestamp: cached ? cached.timestamp : Date.now()
      };
    }

    try {
      // Fetch live data from Open-Meteo (free open API, no key required)
      const lat = defaultData.lat;
      const lon = defaultData.lon;

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,uv_index&timezone=Asia%2FKolkata`;
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&timezone=Asia%2FKolkata`;

      // Fetch with 3.5s timeout for snappy performance
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const [wRes, aqiRes] = await Promise.all([
        fetch(weatherUrl, { signal: controller.signal }),
        fetch(aqiUrl, { signal: controller.signal })
      ]);
      clearTimeout(timeoutId);

      if (wRes.ok) {
        const wData = await wRes.json();
        const aqiData = aqiRes.ok ? await aqiRes.json() : null;

        // Merge live metrics into location template
        const liveSnapshot = JSON.parse(JSON.stringify(defaultData));
        const curr = wData.current;

        liveSnapshot.weather.temp = Math.round(curr.temperature_2m);
        liveSnapshot.weather.feelsLike = Math.round(curr.apparent_temperature);
        liveSnapshot.weather.humidity = Math.round(curr.relative_humidity_2m);
        liveSnapshot.weather.windSpeed = Math.round(curr.wind_speed_10m);
        liveSnapshot.weather.pressure = Math.round(curr.surface_pressure);

        // Update AQI if available
        if (aqiData && aqiData.current) {
          const aqiVal = Math.round(aqiData.current.us_aqi || aqiData.current.pm2_5 * 2 || defaultData.weather.airQuality.aqi);
          liveSnapshot.weather.airQuality.aqi = aqiVal;
          liveSnapshot.weather.airQuality.pm25 = Math.round(aqiData.current.pm2_5 || defaultData.weather.airQuality.pm25);
          liveSnapshot.weather.airQuality.pm10 = Math.round(aqiData.current.pm10 || defaultData.weather.airQuality.pm10);
          liveSnapshot.weather.airQuality.category = this.categorizeAqi(aqiVal);
        }

        this.setCached(locationId, liveSnapshot);
        this.lastSyncTime = Date.now();

        return {
          data: liveSnapshot,
          source: "live_api",
          timestamp: this.lastSyncTime
        };
      }
    } catch (e) {
      console.warn("Live weather fetch failed, seamlessly falling back to local dataset:", e.message);
    }

    // Cache fallback
    const cached = this.getCached(locationId);
    return {
      data: cached ? cached.data : defaultData,
      source: cached ? "offline_cache" : "preset_dataset",
      timestamp: cached ? cached.timestamp : Date.now()
    };
  }

  categorizeAqi(aqi) {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Satisfactory";
    if (aqi <= 200) return "Moderate";
    if (aqi <= 300) return "Poor";
    if (aqi <= 400) return "Very Poor";
    return "Severe";
  }

  getCached(locationId) {
    try {
      const item = localStorage.getItem(this.cacheKeyPrefix + locationId);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  setCached(locationId, data) {
    try {
      localStorage.setItem(
        this.cacheKeyPrefix + locationId,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (e) {
      console.warn("Could not cache to localStorage", e);
    }
  }

  clearAllCache() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.cacheKeyPrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Could not clear cache", e);
    }
  }
}
