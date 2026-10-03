/**
 * Voice & Multilingual Query Engine ("Mausam Bol")
 * Integrates Web Speech API (Speech Recognition & SpeechSynthesis)
 * with natural language intent classification for English and Hindi.
 */

export class VoiceQueryEngine {
  constructor(options = {}) {
    this.onStateChange = options.onStateChange || (() => {});
    this.onResult = options.onResult || (() => {});
    this.recognition = null;
    this.isListening = false;
    this.synth = window.speechSynthesis || null;
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = "en-IN"; // Supports English with Indian accent; also works with Hindi

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStateChange({ listening: true, error: null });
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.isListening = false;
        this.onStateChange({ listening: false, transcript });
      };

      this.recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        this.isListening = false;
        this.onStateChange({ listening: false, error: event.error });
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onStateChange({ listening: false });
      };
    } else {
      console.warn("Speech Recognition API not supported in this browser environment.");
    }
  }

  startListening(lang = "en-IN") {
    if (!this.recognition) {
      return false;
    }
    try {
      this.recognition.lang = lang;
      this.recognition.start();
      return true;
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Speak out the answer using Web Speech Synthesis
   */
  speak(text, lang = "en-IN") {
    if (!this.synth) return;
    try {
      this.synth.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang.startsWith("hi") ? "hi-IN" : "en-IN";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      this.synth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  /**
   * Process Natural Language Query in English or Hindi
   * @param {string} query 
   * @param {Object} location 
   * @param {Object} scores 
   * @returns {Object} answer, matchedPersona, actionWidget
   */
  processQuery(query, location, scores) {
    const q = query.toLowerCase().trim();
    const weather = location.weather;

    // Detect language
    const isHindi = /[\u0900-\u097F]|kya|aaj|barish|dhaud|kisan|chhidkaw|hawa|mausam|pradushan/i.test(q);

    // 1. Fitness / Running Query
    if (q.includes("run") || q.includes("jog") || q.includes("fitness") || q.includes("दौड़") || q.includes("dhaud") || q.includes("walk")) {
      const runScore = scores.runner.score;
      if (isHindi) {
        const text = runScore >= 70
          ? `आज ${location.name} में दौड़ने के लिए मौसम बहुत अच्छा है। रन स्कोर 100 में से ${runScore} है। AQI ${weather.airQuality?.aqi || 'सामान्य'} है।`
          : `आज दौड़ने से बचें या इनडोर व्यायाम करें। रन स्कोर सिर्फ ${runScore} है, क्योंकि AQI ${weather.airQuality?.aqi || 200} है।`;
        return {
          answer: text,
          persona: "runner",
          widgetId: "run_score",
          isHindi: true
        };
      } else {
        const text = runScore >= 70
          ? `Conditions in ${location.name} are good for a run! Your Run Score is ${runScore}/100. Best running window is early morning before 7:30 AM.`
          : `Running outdoors is not recommended right now. Your Run Score is ${runScore}/100 due to ${scores.runner.subtext}. Consider treadmill or indoor workout.`;
        return {
          answer: text,
          persona: "runner",
          widgetId: "run_score",
          isHindi: false
        };
      }
    }

    // 2. Agriculture / Spraying / Crop Query
    if (q.includes("spray") || q.includes("crop") || q.includes("farm") || q.includes("pesticide") || q.includes("fertilizer") || q.includes("छिड़काव") || q.includes("फसल") || q.includes("chhidkaw") || q.includes("kisan") || q.includes("khad")) {
      const agroScore = scores.farmer.score;
      if (isHindi) {
        const text = agroScore >= 70
          ? `जी हां! आज मौसम छिड़काव के लिए अनुकूल है। स्कोर ${agroScore}/100 है। हवा की गति ${weather.windSpeed} किमी प्रति घंटा है और बारिश का खतरा केवल ${weather.rainChance}% है।`
          : `सावधानी: आज कीटनाशक छिड़काव से बचें। मौसम स्कोर ${agroScore}/100 है। ${scores.farmer.subtext}।`;
        return {
          answer: text,
          persona: "farmer",
          widgetId: "spray_window",
          isHindi: true
        };
      } else {
        const text = agroScore >= 70
          ? `Yes, conditions are favorable for spraying. Agro suitability is ${agroScore}/100 with calm wind at ${weather.windSpeed} km/h and rain chance at ${weather.rainChance}%.`
          : `Caution: Chemical spraying is not recommended today (Score: ${agroScore}/100). Reason: ${scores.farmer.subtext}.`;
        return {
          answer: text,
          persona: "farmer",
          widgetId: "spray_window",
          isHindi: false
        };
      }
    }

    // 3. Rain / Precipitation Query
    if (q.includes("rain") || q.includes("umbrella") || q.includes("बारिश") || q.includes("barish") || q.includes("waterlog")) {
      const rain = weather.rainChance;
      if (isHindi) {
        const text = rain >= 50
          ? `आज ${location.name} में बारिश की संभावना ${rain}% है। छाता साथ रखें, दोपहर या शाम को पानी भरने की चेतावनी है।`
          : `आज बारिश की संभावना बहुत कम है (${rain}%)। मौसम मुख्य रूप से ${weather.condition} रहेगा।`;
        return {
          answer: text,
          persona: "commuter",
          widgetId: "rain_alert",
          isHindi: true
        };
      } else {
        const text = rain >= 50
          ? `Rain is very likely in ${location.name} today with a ${rain}% probability. Keep an umbrella ready and expect traffic slowdowns.`
          : `Only a ${rain}% chance of rain in ${location.name} today. Expect mostly ${weather.condition} skies.`;
        return {
          answer: text,
          persona: "commuter",
          widgetId: "rain_alert",
          isHindi: false
        };
      }
    }

    // 4. Beach / Tide Query
    if (q.includes("beach") || q.includes("tide") || q.includes("sea") || q.includes("ocean") || q.includes("समुद्र") || q.includes("तट") || q.includes("बीच")) {
      if (!weather.tides) {
        return {
          answer: `${location.name} is an inland city without marine beaches.`,
          persona: "beach",
          widgetId: "beach_score",
          isHindi: false
        };
      }
      const tide = weather.tides.highTide;
      return {
        answer: `Beach suitability in ${location.name} is ${scores.beach.score}/100. High tide expected at ${tide}. Wave swell is ${weather.tides.waveHeight}.`,
        persona: "beach",
        widgetId: "tide_card",
        isHindi: false
      };
    }

    // 5. Air Quality / AQI / Health Query
    if (q.includes("aqi") || q.includes("pollution") || q.includes("air") || q.includes("mask") || q.includes("हवा") || q.includes("प्रदूषण") || q.includes("hawa")) {
      const aqi = weather.airQuality.aqi;
      const cat = weather.airQuality.category;
      if (isHindi) {
        return {
          answer: `${location.name} में आज वायु गुणवत्ता सूचकांक (AQI) ${aqi} है, जो श्रेणी '${cat}' में आता है। मुख्य प्रदूषक ${weather.airQuality.primaryPollutant} है।`,
          persona: "health",
          widgetId: "aqi_breakdown",
          isHindi: true
        };
      } else {
        return {
          answer: `The real-time AQI in ${location.name} is ${aqi} (${cat}). Primary pollutant is ${weather.airQuality.primaryPollutant} at ${weather.airQuality.pm25} µg/m³. ${aqi > 150 ? 'Wear an N95 mask outdoors.' : 'Air is acceptable.'}`,
          persona: "health",
          widgetId: "aqi_breakdown",
          isHindi: false
        };
      }
    }

    // Default general response
    if (isHindi) {
      return {
        answer: `${location.name} में वर्तमान तापमान ${weather.temp}°C है, जो ${weather.feelsLike}°C जैसा महसूस हो रहा है। मौसम ${weather.condition} है और AQI ${weather.airQuality.aqi} है।`,
        persona: "runner",
        widgetId: "weather_overview",
        isHindi: true
      };
    }

    return {
      answer: `Currently in ${location.name}: ${weather.temp}°C, feels like ${weather.feelsLike}°C with ${weather.condition}. Air quality is ${weather.airQuality.aqi} (${weather.airQuality.category}).`,
      persona: "runner",
      widgetId: "weather_overview",
      isHindi: false
    };
  }
}
