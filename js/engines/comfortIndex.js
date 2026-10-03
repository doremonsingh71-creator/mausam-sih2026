/**
 * Comfort & Suitability Index Engine
 * Computes compound 0-100 scores tailored for each persona based on
 * meteorological, atmospheric, and environmental variables.
 */

export class ComfortIndexEngine {
  /**
   * Calculate all persona scores for a given weather snapshot
   * @param {Object} weather 
   * @returns {Object} map of scores and text advisories per persona
   */
  static calculateAll(weather) {
    return {
      runner: this.calculateRunScore(weather),
      farmer: this.calculateAgroScore(weather),
      commuter: this.calculateCommuteScore(weather),
      beach: this.calculateBeachScore(weather),
      parent: this.calculateParentScore(weather),
      event: this.calculateEventScore(weather),
      health: this.calculateHealthScore(weather),
      travel: this.calculateTravelScore(weather)
    };
  }

  /**
   * Fitness / Runner Score (0 - 100)
   * Factors: Temperature comfort (optimal: 15-22°C), AQI (under 100 optimal), Rain (penalty), UV
   */
  static calculateRunScore(weather) {
    let score = 100;
    const notes = [];

    // Temperature penalty
    const temp = weather.temp;
    if (temp < 10) {
      score -= (10 - temp) * 3;
      notes.push("Chilly conditions");
    } else if (temp > 24) {
      score -= (temp - 24) * 3.5;
      if (temp > 30) notes.push("High heat stress");
    }

    // AQI penalty (major factor in India)
    const aqi = weather.airQuality?.aqi || 50;
    if (aqi > 200) {
      score -= 40;
      notes.push("Severe air pollution - mask advised");
    } else if (aqi > 150) {
      score -= 25;
      notes.push("Unhealthy AQI for endurance runs");
    } else if (aqi > 100) {
      score -= 12;
      notes.push("Moderate air quality");
    }

    // Rain penalty
    const rain = weather.rainChance || 0;
    if (rain > 50) {
      score -= 30;
      notes.push(`Rain risk: ${rain}%`);
    } else if (rain > 20) {
      score -= 10;
    }

    // Humidity penalty
    const hum = weather.humidity || 50;
    if (hum > 75) {
      score -= 15;
      notes.push("High humidity dampens pace");
    }

    score = Math.max(10, Math.min(100, Math.round(score)));

    let verdict = "Excellent for running";
    let subtext = "Prime outdoor cardio window";
    if (score >= 80) {
      verdict = "Great for running";
      subtext = notes.length ? notes[0] : "Ideal running conditions right now";
    } else if (score >= 60) {
      verdict = "Moderate conditions";
      subtext = notes.join(" · ") || "Acceptable for light jog";
    } else if (score >= 40) {
      verdict = "Sub-optimal for running";
      subtext = notes.join(" · ") || "Consider indoor treadmill or short recovery run";
    } else {
      verdict = "Poor running conditions";
      subtext = notes.join(" · ") || "Avoid strenuous outdoor exertion";
    }

    return {
      score,
      verdict,
      subtext,
      badge: score >= 75 ? "Optimal" : score >= 50 ? "Fair" : "Poor",
      colorClass: score >= 75 ? "score-good" : score >= 50 ? "score-warning" : "score-bad",
      bestHour: "06:00 AM - 07:30 AM"
    };
  }

  /**
   * Agriculture / Spraying Suitability Score (0 - 100)
   * Factors: Wind speed (< 12 km/h is best for spray drift), Rain probability (< 20%), Humidity (40-70%)
   */
  static calculateAgroScore(weather) {
    let score = 100;
    const notes = [];

    const wind = weather.windSpeed || 8;
    if (wind > 20) {
      score -= 45;
      notes.push("High wind causing excessive chemical drift");
    } else if (wind > 12) {
      score -= 20;
      notes.push("Breezy - spray with low-drift nozzles");
    } else {
      notes.push("Calm winds - optimal for pesticide/fertilizer spray");
    }

    const rain = weather.rainChance || 0;
    if (rain > 50) {
      score -= 50;
      notes.push("Rain imminent - wash-off risk");
    } else if (rain > 20) {
      score -= 20;
      notes.push("Scattered showers possible");
    }

    const hum = weather.humidity || 50;
    if (hum > 85) {
      score -= 15;
      notes.push("Fungal disease risk elevated");
    }

    score = Math.max(10, Math.min(100, Math.round(score)));

    let verdict = "Optimal Spraying & Field Window";
    if (score < 45) {
      verdict = "Unfavorable for Field Spraying";
    } else if (score < 70) {
      verdict = "Moderate Field Conditions";
    }

    return {
      score,
      verdict,
      subtext: notes.slice(0, 2).join(" · "),
      badge: score >= 75 ? "Safe to Spray" : score >= 50 ? "Caution" : "Avoid Spraying",
      colorClass: score >= 75 ? "score-good" : score >= 50 ? "score-warning" : "score-bad",
      advisory: weather.agriculture?.gkmsAdvisory || "Follow district Agromet advisory."
    };
  }

  /**
   * Commuter Impact Score (0 - 100)
   * 100 = smooth sailing, 0 = severe transit chaos
   */
  static calculateCommuteScore(weather) {
    let score = 100;
    const notes = [];

    const rain = weather.rainChance || 0;
    if (rain > 60) {
      score -= 40;
      notes.push("Heavy rain & waterlogging alerts");
    } else if (rain > 30) {
      score -= 20;
      notes.push("Slick roads & slow traffic expected");
    }

    const vis = weather.visibility || 10;
    if (vis < 2) {
      score -= 35;
      notes.push("Dense fog/smog - reduced road visibility");
    } else if (vis < 5) {
      score -= 15;
      notes.push("Moderate haze");
    }

    score = Math.max(15, Math.min(100, Math.round(score)));

    return {
      score,
      verdict: score >= 75 ? "Smooth Commute" : score >= 50 ? "Moderate Delays" : "Severe Traffic Friction",
      subtext: notes.length ? notes.join(" · ") : "Dry roads and clear travel routes",
      badge: score >= 75 ? "Clear" : score >= 50 ? "Delays" : "Severe",
      colorClass: score >= 75 ? "score-good" : score >= 50 ? "score-warning" : "score-bad"
    };
  }

  /**
   * Beach & Marine Score (0 - 100)
   */
  static calculateBeachScore(weather) {
    let score = 90;
    const notes = [];

    if (!weather.tides) {
      return {
        score: 60,
        verdict: "Inland Location",
        subtext: "Nearest coastal recreation > 200 km away",
        badge: "Inland",
        colorClass: "score-neutral"
      };
    }

    const rain = weather.rainChance || 0;
    if (rain > 50) {
      score -= 35;
      notes.push("Rain and choppy surf forecast");
    }

    const wind = weather.windSpeed || 10;
    if (wind > 25) {
      score -= 30;
      notes.push("High coastal winds & rough surf");
    }

    const uv = weather.uvIndex || 3;
    if (uv > 8) {
      notes.push("High UV - sunscreen mandatory");
    }

    score = Math.max(20, Math.min(100, Math.round(score)));

    return {
      score,
      verdict: score >= 75 ? "Great Beach Day" : score >= 50 ? "Moderate Conditions" : "Rough Sea / Caution",
      subtext: notes.length ? notes.join(" · ") : "Pleasant sea breeze & gentle waves",
      badge: score >= 75 ? "Favorable" : "Caution",
      colorClass: score >= 75 ? "score-good" : score >= 50 ? "score-warning" : "score-bad",
      tideHighlight: weather.tides.nextTide
    };
  }

  /**
   * Parents & Playground Score
   */
  static calculateParentScore(weather) {
    let score = 95;
    const notes = [];

    const aqi = weather.airQuality?.aqi || 50;
    if (aqi > 200) {
      score -= 45;
      notes.push("Unhealthy air: keep children indoors");
    } else if (aqi > 100) {
      score -= 20;
      notes.push("Sensitive kids may cough outdoors");
    }

    const rain = weather.rainChance || 0;
    if (rain > 40) {
      score -= 25;
      notes.push("Pack raincoats/umbrellas for school return");
    }

    const temp = weather.temp;
    if (temp > 35) {
      score -= 30;
      notes.push("Risk of dehydration/sunstroke");
    } else if (temp < 10) {
      score -= 20;
      notes.push("Warm jackets required");
    }

    score = Math.max(15, Math.min(100, Math.round(score)));

    return {
      score,
      verdict: score >= 75 ? "Great for Outdoor Play" : score >= 50 ? "Caution Advised" : "Keep Kids Indoors",
      subtext: notes.slice(0, 2).join(" · ") || "Safe and pleasant for park & school activities",
      badge: score >= 75 ? "Kid-Safe" : score >= 50 ? "Moderate" : "Hazardous",
      colorClass: score >= 75 ? "score-good" : score >= 50 ? "score-warning" : "score-bad"
    };
  }

  /**
   * Event Go/No-Go Score
   */
  static calculateEventScore(weather) {
    let score = 95;
    const notes = [];

    const rain = weather.rainChance || 0;
    if (rain > 50) {
      score -= 45;
      notes.push("High precipitation risk: consider covered canopy");
    } else if (rain > 20) {
      score -= 15;
      notes.push("Slight chance of scattered drizzle");
    }

    const wind = weather.windSpeed || 10;
    if (wind > 25) {
      score -= 30;
      notes.push("Strong gusts: secure temporary tents & banners");
    }

    score = Math.max(10, Math.min(100, Math.round(score)));

    return {
      score,
      verdict: score >= 75 ? "Green: Go for Outdoor Event" : score >= 50 ? "Yellow: Prepare Rain Plan" : "Red: High Weather Disruption Risk",
      subtext: notes.join(" · ") || "Stable weather parameters for outdoor gatherings",
      badge: score >= 75 ? "Go" : score >= 50 ? "Contingency" : "No-Go",
      colorClass: score >= 75 ? "score-good" : score >= 50 ? "score-warning" : "score-bad"
    };
  }

  /**
   * Health & Respiratory Index
   */
  static calculateHealthScore(weather) {
    const aqi = weather.airQuality?.aqi || 50;
    let score = Math.max(10, Math.min(100, Math.round(100 - (aqi / 3.5))));
    const pm25 = weather.airQuality?.pm25 || 25;

    let verdict = "Clean & Safe Air";
    let subtext = "Air quality poses minimal risk";
    if (aqi > 250) {
      verdict = "Severe Respiratory Hazard";
      subtext = `PM2.5: ${pm25} µg/m³. N95 mask required outdoors.`;
    } else if (aqi > 150) {
      verdict = "Unhealthy for Asthmatics & Elderly";
      subtext = "Limit prolonged outdoor exertion";
    } else if (aqi > 100) {
      verdict = "Moderate Air Warning";
      subtext = "Sensitive groups may experience minor cough";
    }

    return {
      score,
      verdict,
      subtext,
      badge: aqi <= 50 ? "Good" : aqi <= 100 ? "Satisfactory" : aqi <= 200 ? "Moderate" : "Hazardous",
      colorClass: score >= 70 ? "score-good" : score >= 40 ? "score-warning" : "score-bad"
    };
  }

  /**
   * Travel & Sightseeing Score
   */
  static calculateTravelScore(weather) {
    let score = 90;
    const notes = [];
    if (weather.rainChance > 40) {
      score -= 25;
      notes.push("Sightseeing delays due to rain");
    }
    if (weather.visibility < 4) {
      score -= 20;
      notes.push("Hazy landscapes");
    }
    score = Math.max(20, Math.min(100, Math.round(score)));

    return {
      score,
      verdict: score >= 75 ? "Excellent Sightseeing" : score >= 50 ? "Moderate Travel Ease" : "Travel Weather Warnings",
      subtext: notes.join(" · ") || "Scenic, clear vistas and easy transit conditions",
      badge: score >= 75 ? "Prime" : "Fair",
      colorClass: score >= 75 ? "score-good" : score >= 50 ? "score-warning" : "score-bad"
    };
  }
}
