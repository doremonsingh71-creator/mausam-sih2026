/**
 * Context Inference Engine
 * Detects implicit user personas and context signals based on:
 * 1. Geographic environment (coastal, agricultural plains, metro city, mountain)
 * 2. Time-of-day dynamics (morning run, commute rush hours, midday UV, evening leisure)
 * 3. Seasonal & severe weather events (monsoon deluge, winter frost, heatwave)
 */

export class ContextInferenceEngine {
  /**
   * Infer prioritized persona recommendations based on context
   * @param {Object} location 
   * @param {Date} [currentTime] 
   * @returns {Object} inferred personas, primary persona suggestion, and rationale
   */
  static inferContext(location, currentTime = new Date()) {
    const hours = currentTime.getHours();
    const weather = location.weather;
    const scores = {
      runner: 10,
      farmer: 10,
      commuter: 10,
      beach: 5,
      parent: 10,
      event: 5,
      health: 10,
      travel: 5
    };

    const reasons = [];

    // 1. Geographic Context Signals
    if (location.type === "coastal") {
      scores.beach += 40;
      reasons.push(`Coastal location (${location.name}) with marine tides`);
    } else if (location.type === "agricultural_plain") {
      scores.farmer += 45;
      reasons.push(`Agro-climatic zone (${location.panchayat || location.state}) with active crop season`);
    } else if (location.type === "urban_metro") {
      scores.commuter += 25;
      scores.health += 25;
      reasons.push(`Metropolitan zone with transit corridors & air monitoring`);
    } else if (location.type === "mountain") {
      scores.travel += 30;
      scores.commuter += 20;
      reasons.push("Mountain elevation: fog and terrain advisory active");
    }

    // 2. Time-of-day Signals
    if (hours >= 5 && hours <= 8) {
      scores.runner += 35;
      reasons.push("Early morning window: optimal for running & outdoor fitness");
    } else if ((hours >= 8 && hours <= 10) || (hours >= 17 && hours <= 20)) {
      scores.commuter += 35;
      scores.parent += 20;
      reasons.push("Peak commute hours: transit & road weather prioritized");
    } else if (hours >= 10 && hours <= 15) {
      scores.farmer += 25;
      scores.health += 20;
      reasons.push("Midday: agromet spraying window & solar UV peak");
    } else if (hours >= 15 && hours <= 19 && location.type === "coastal") {
      scores.beach += 30;
      reasons.push("Late afternoon: popular coastal breeze & promenade hours");
    }

    // 3. Real-Time Meteorological Priority Shifts
    // Extreme AQI shifts focus to Health & Parents
    if (weather.airQuality && weather.airQuality.aqi > 200) {
      scores.health += 35;
      scores.parent += 25;
      scores.runner -= 15; // discourage running, push health warnings
      reasons.push("Severe AQI detected (>200) - health protections activated");
    }

    // High rain onset boosts commuter & parent safety
    if (weather.rainChance > 50) {
      scores.commuter += 30;
      scores.parent += 25;
      scores.event += 20;
      scores.beach -= 20;
      reasons.push(`Rain probability ${weather.rainChance}%: travel & waterlogging alerts raised`);
    }

    // Frost risk in winter boosts farmer
    if (weather.agriculture && weather.agriculture.frostRisk && weather.agriculture.frostRisk.includes("High")) {
      scores.farmer += 40;
      reasons.push("Ground frost advisory active for regional crops");
    }

    // Sort personas by contextual weight
    const rankedPersonas = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([persona, weight]) => ({ persona, weight }));

    const topPersona = rankedPersonas[0].persona;

    return {
      topPersona,
      rankedPersonas,
      reasons,
      primaryReason: reasons[0] || "Tailored based on live local parameters"
    };
  }
}
