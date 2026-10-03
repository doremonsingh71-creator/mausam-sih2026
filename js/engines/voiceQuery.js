/**
 * Voice & Conversational Intelligence Engine ("Mausam Bol")
 * Advanced Natural Language Understanding for Meteorology, Agromet (GKMS),
 * Health, Commute, and Persona Suitability in English & Hindi.
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
    if (!SpeechRecognition) {
      console.warn("Web Speech Recognition API not available natively in this browser.");
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = "en-IN";

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStateChange({ listening: true, error: null, message: "Listening... बोलिए..." });
      };

      this.recognition.onresult = (event) => {
        this.isListening = false;
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          this.onStateChange({ listening: false, transcript });
        }
      };

      this.recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        this.isListening = false;
        let userMsg = "Microphone error occurred.";
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          userMsg = "Microphone access was blocked. Please tap the lock icon in your browser address bar to allow mic permissions, or type your query below!";
        } else if (event.error === "no-speech") {
          userMsg = "No speech detected. Please tap the mic and speak clearly.";
        } else if (event.error === "network") {
          userMsg = "Speech service network timeout. You can type freely in the chat box!";
        }
        this.onStateChange({ listening: false, error: event.error, message: userMsg });
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onStateChange({ listening: false });
      };
    } catch (err) {
      console.warn("Failed to initialize SpeechRecognition:", err);
    }
  }

  async startListening(preferredLang = "en-IN") {
    // Proactively check microphone permission via mediaDevices
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release immediately once permission is verified
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.warn("Microphone permission denied:", err);
        this.onStateChange({
          listening: false,
          error: "permission_denied",
          message: "Microphone permission is blocked. Please enable it in browser settings or type your question!"
        });
        return;
      }
    }

    if (!this.recognition) {
      this.onStateChange({
        listening: false,
        error: "unsupported",
        message: "Speech-to-text is not supported in this browser. Please type your query in the box below!"
      });
      return;
    }

    try {
      this.recognition.lang = preferredLang;
      this.recognition.start();
    } catch (e) {
      console.warn("Speech recognition start issue:", e);
      try {
        this.recognition.stop();
        setTimeout(() => this.recognition.start(), 200);
      } catch (err) {
        // ignore
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }

  speak(text, lang = "en-IN") {
    if (!this.synth) return;
    try {
      this.synth.cancel(); // Stop any currently playing utterance
      // Strip markdown asterisks and icons for cleaner voice synthesis
      const cleanText = text.replace(/[*_#`~[\]]/g, "").replace(/\n+/g, ". ");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Prefer Indian English or Hindi voice if available
      const voices = this.synth.getVoices();
      const targetVoice = voices.find(v => (v.lang === lang || v.lang.startsWith(lang.split("-")[0])) && !v.name.includes("Google"));
      if (targetVoice) utterance.voice = targetVoice;

      this.synth.speak(utterance);
    } catch (e) {
      console.warn("TTS Error:", e);
    }
  }

  /**
   * Process natural language query and map to meteorological personas & data
   * @param {string} query 
   * @param {Object} location 
   * @param {Object} scores 
   * @returns {Object} { answer, persona, widgetId, isHindi }
   */
  processQuery(query, location, scores) {
    const q = query.toLowerCase().trim();
    const weather = location.weather;
    const agro = weather.agriculture || {};
    const aqi = weather.airQuality?.aqi || 50;
    const tides = weather.tides;
    const cityName = location.name;

    // Detect language: Devnagari script or Hindi romanized keywords
    const isHindi = /[\u0900-\u097F]|kya|aaj|barish|dhaud|daud|kisan|chhidkaw|chhidkao|hawa|mausam|pradushan|pani|khet|fasal|tapman|garmi|sardi|bachho|bacche|beach|samundar/i.test(q);

    // =========================================================================
    // 0. CONVERSATIONAL GREETINGS & INTRODUCTIONS (hlo, hi, hello, namaste, hey)
    // =========================================================================
    if (/^(hlo|hello|hi|hey|helo|namaste|namaskar|good\s*(morning|afternoon|evening)|kaise\s*ho|kya\s*hal|who\s*are\s*you|koun\s*ho)/i.test(q) || q === "hlo" || q === "hi" || q === "hello") {
      if (isHindi) {
        return {
          answer: `नमस्ते! 🙏 मैं **मौसम बोल (Mausam Bol)** हूँ — आपका पर्सनलाइज़्ड AI मौसम साथी।\n\nमैं आपकी गतिविधियों के अनुसार सटीक सलाह दे सकता हूँ:\n• 🏃 **दौड़ / फिटनेस:** क्या अभी दौड़ना सुरक्षित है?\n• 🌾 **कृषि (GKMS):** क्या आज कीटनाशक छिड़काव कर सकते हैं?\n• 🚗 **कम्यूट:** ऑफिस जाते समय बारिश या ट्रैफिक जाम का जोखिम?\n• 🏖️ **समुद्र तट:** आज बीच और तैरने के लिए लहरें कैसी हैं?\n• 📡 **डॉपलर रडार:** क्या अगले 1 घंटे में आंधी-तूफान आ रहा है?\n\nआप मुझसे बोलकर या लिखकर कुछ भी पूछ सकते हैं!`,
          persona: "all",
          widgetId: "hero_weather",
          isHindi: true
        };
      }
      return {
        answer: `Hello! 👋 I'm **Mausam Bol**, your persona-aware AI weather assistant for Smart India Hackathon 2026.\n\nI tailor live IMD meteorological data to your daily activities:\n• 🏃 **Runners & Fitness:** Optimal running windows, heat index & hydration.\n• 🌾 **Farmers (Agromet GKMS):** Spraying safety, irrigation & frost alerts.\n• 🚗 **Commuters:** 0–3 hour rain nowcasts, waterlogging & visibility risks.\n• 🏖️ **Coast & Tides:** High/low tide, swell height & swimming safety.\n• 📡 **Doppler Radar:** Hyper-local thunderstorm detection.\n\nAsk me anything like *"Can I go for a run right now?"* or *"Will it rain during evening commute?"*!`,
        persona: "all",
        widgetId: "hero_weather",
        isHindi: false
      };
    }

    // =========================================================================
    // 1. DOPPLER RADAR EXPLAINER & NOWCASTING QUERIES
    // =========================================================================
    if (q.includes("radar") || q.includes("doppler") || q.includes("nowcast") || q.includes("dwr") || q.includes("reflectivity") || q.includes("dbz") || q.includes("storm track")) {
      if (isHindi) {
        return {
          answer: `📡 **IMD डॉपलर वेदर रडार (DWR) क्या करता है?**\n\n1. **तात्कालिक चेतावनी (Nowcasting 0–3 घंटे):**\nडॉपलर रडार हर 10 मिनट में सूक्ष्म तरंगें भेजकर बादलों और बारिश की बूंदों की सटीक गति ट्रैक करता है।\n\n2. **रिफ्लेक्टिविटी (Reflectivity - dBZ):**\n• 20–35 dBZ: हल्की से मध्यम बारिश\n• 45–55 dBZ: तेज आंधी, तड़ित झंझा (Thunderstorm)\n• >55 dBZ: ओलावृष्टि (Hail) या क्लाउडबर्स्ट का खतरा!\n\n3. **कम्यूट और खेती में लाभ:**\nयह पारंपरिक मौसम मॉडल से पहले आपको चेतावनी देता है कि अगले 30 मिनट में आपके इलाके में तेज बारिश होगी या नहीं। नीचे 'Radar' बटन दबाकर लाइव मैप देखें!`,
          persona: "commuter",
          widgetId: "widget_commuter_card",
          isHindi: true
        };
      }
      return {
        answer: `📡 **What does Doppler Weather Radar (DWR) do in Mausam?**\n\n1. **Hyper-Local 0–3 Hour "Nowcasting":**\nUnlike general 24-hour weather models, Doppler Radar scans the atmosphere every 10 minutes to detect rain droplets, hailstorms, and squall lines as they form.\n\n2. **Reflectivity Scale (dBZ):**\n• **20–35 dBZ:** Light-to-moderate rain showers\n• **45–55 dBZ:** Severe thunderstorms with gusty winds\n• **>55 dBZ:** Dangerous hailstorms or cloudburst potential\n\n3. **Doppler Velocity:**\nMeasures the frequency shift to calculate exact wind speed and storm direction toward or away from the station.\n\nTap the **Radar** button at the bottom to explore interactive Leaflet stations in Delhi, Mumbai, Kolkata, Shimla, etc.!`,
        persona: "commuter",
        widgetId: "widget_commuter_card",
        isHindi: false
      };
    }

    // =========================================================================
    // 2. RUNNER & OUTDOOR FITNESS
    // =========================================================================
    if (q.includes("run") || q.includes("jog") || q.includes("walk") || q.includes("exercise") || q.includes("fitness") || q.includes("दौड़") || q.includes("दौड़ना") || q.includes("कसरत") || q.includes("dhaud") || q.includes("daud")) {
      const rScore = scores.runner.score;
      if (isHindi) {
        let verdict = rScore >= 75 ? "दौड़ के लिए उत्तम" : rScore >= 50 ? "मध्यम परिस्थितियां" : "दौड़ने से बचें";
        let advice = rScore >= 75 
          ? "हवा की गुणवत्ता और तापमान अनुकूल हैं। अभी दौड़ना सबसे सही रहेगा।"
          : rScore >= 50 
          ? `AQI (${aqi}) थोड़ा बढ़ा हुआ है। शाम को या मास्क के साथ दौड़ें।`
          : `प्रतिकूल परिस्थितियां (AQI: ${aqi}, आर्द्रता: ${weather.humidity}%)। इनडोर ट्रेडमिल पर कसरत करें।`;

        const response = `🏃 **${cityName} रनिंग अनुकूलता: ${rScore}/100 (${verdict})**\n\n` +
          `• 🌡️ **तापमान:** ${weather.temp}°C (महसूस: ${weather.feelsLike}°C)\n` +
          `• 💨 **हवा (AQI):** ${aqi} (${weather.airQuality.category})\n` +
          `• 💧 **आर्द्रता:** ${weather.humidity}%\n` +
          `• 🌧️ **बारिश की संभावना:** ${weather.rainChance}%\n\n` +
          `💡 **सलाह:** ${advice}`;

        return { answer: response, persona: "runner", widgetId: "widget_runner_card", isHindi: true };
      } else {
        let verdict = rScore >= 75 ? "Optimal for Running" : rScore >= 50 ? "Moderate Conditions" : "Outdoor Run Not Recommended";
        let advice = rScore >= 75 
          ? "Air quality and thermal comfort are great right now. Enjoy your run!"
          : rScore >= 50 
          ? `Slightly elevated AQI (${aqi}). Stay hydrated and consider a lighter pace.`
          : `High thermal stress or AQI (${aqi}, PM2.5: ${weather.airQuality.pm25} µg/m³). Opt for indoor treadmill training.`;

        const response = `🏃 **Running Suitability for ${cityName}: ${rScore}/100 (${verdict})**\n\n` +
          `• 🌡️ **Temperature:** ${weather.temp}°C (Feels like: ${weather.feelsLike}°C)\n` +
          `• 💨 **Air Quality:** AQI ${aqi} (${weather.airQuality.category})\n` +
          `• 💧 **Humidity:** ${weather.humidity}%\n` +
          `• 🌧️ **Rain Probability:** ${weather.rainChance}%\n\n` +
          `💡 **Advice:** ${advice}`;

        return { answer: response, persona: "runner", widgetId: "widget_runner_card", isHindi: false };
      }
    }

    // =========================================================================
    // 3. FARMER / AGROMET (GKMS Advisory)
    // =========================================================================
    if (q.includes("spray") || q.includes("crop") || q.includes("farm") || q.includes("kisan") || q.includes("pesticide") || q.includes("fertilizer") || q.includes("urea") || q.includes("irrigation") || q.includes("soil") || q.includes("frost") || q.includes("किसान") || q.includes("फसल") || q.includes("कीटनाशक") || q.includes("खेत") || q.includes("छिड़काव") || q.includes("chhidkaw") || q.includes("sinchai") || q.includes("pala")) {
      const aScore = scores.farmer.score;
      const sprayWin = agro.bestSprayWindow || "10:00 AM - 01:00 PM";

      if (isHindi) {
        let verdict = aScore >= 70 ? "छिड़काव के लिए अनुकूल समय" : "अभी छिड़काव न करें";
        const response = `🌾 **ग्रामीण कृषि मौसम सेवा (GKMS) — स्कोर: ${aScore}/100 (${verdict})**\n\n` +
          `• 💨 **हवा की गति:** ${weather.windSpeed} किमी/घंटा (${weather.windSpeed > 15 ? 'तेज हवा: छिड़काव बहने का खतरा' : 'शांत: छिड़काव सुरक्षित'})\n` +
          `• 🌧️ **बारिश की संभावना:** ${weather.rainChance}% (${weather.rainChance > 40 ? 'बारिश से दवा धुल सकती है' : 'मौसम साफ'})\n` +
          `• 🧪 **मृदा नमी (Soil Moisture):** ${agro.soilMoisture}%\n` +
          `• ⏰ **सर्वोत्तम स्प्रे विंडो:** ${sprayWin}\n\n` +
          `💡 **आईएमडी कृषि सलाह:** ${agro.pestAdvisory || "कीटनाशक स्प्रे के दौरान सुरक्षात्मक मास्क का प्रयोग करें।"}`;

        return { answer: response, persona: "farmer", widgetId: "widget_farmer_card", isHindi: true };
      } else {
        let verdict = aScore >= 70 ? "Suitable for Spraying" : "Hold Spray Operations";
        const response = `🌾 **Agromet Advisory (IMD GKMS) — Score: ${aScore}/100 (${verdict})**\n\n` +
          `• 💨 **Wind Speed:** ${weather.windSpeed} km/h (${weather.windSpeed > 15 ? 'High drift risk: hold spraying' : 'Optimal drift threshold'})\n` +
          `• 🌧️ **Rain Probability:** ${weather.rainChance}% (${weather.rainChance > 40 ? 'High risk of chemical wash-off' : 'Low wash-off risk'})\n` +
          `• 🧪 **Soil Moisture:** ${agro.soilMoisture}%\n` +
          `• ⏰ **Recommended Spray Window:** ${sprayWin}\n\n` +
          `💡 **IMD Advisory:** ${agro.pestAdvisory || "Ensure proper personal protective equipment during foliar application."}`;

        return { answer: response, persona: "farmer", widgetId: "widget_farmer_card", isHindi: false };
      }
    }

    // =========================================================================
    // 4. COMMUTE & TRAFFIC (Waterlogging / Fog / Rain)
    // =========================================================================
    if (q.includes("commute") || q.includes("traffic") || q.includes("road") || q.includes("office") || q.includes("metro") || q.includes("waterlog") || q.includes("jam") || q.includes("ट्रैफिक") || q.includes("सड़क") || q.includes("कार्यालय") || q.includes("रास्ता") || q.includes("sadak") || q.includes("gadi")) {
      const cScore = scores.commuter.score;
      const traffic = weather.trafficImpact || {};

      if (isHindi) {
        const response = `🚗 **${cityName} कम्यूट रिपोर्ट — सुरक्षित यात्रा सूचकांक (स्कोर: ${cScore}/100)**\n\n` +
          `• 💧 **जलभराव (Waterlogging) जोखिम:** ${traffic.waterloggingRisk || "निम्न"}\n` +
          `• 👁️ **दृश्यता (Visibility):** ${weather.visibility} किमी (${traffic.visibilityRisk || "साफ"})\n` +
          `• 🌧️ **बारिश का अलर्ट:** ${weather.rainChance > 50 ? 'भारी बारिश की संभावना, छाता रखें!' : 'सड़कें सामान्य'}\n\n` +
          `💡 **सलाह:** ${cScore >= 75 ? 'सामान्य आवागमन का समय।' : 'जलभराव वाले चौराहों से बचें, अतिरिक्त 15-20 मिनट लेकर निकलें।'}`;

        return { answer: response, persona: "commuter", widgetId: "widget_commuter_card", isHindi: true };
      } else {
        const response = `🚗 **Commute & Transit Forecast for ${cityName} (Score: ${cScore}/100)**\n\n` +
          `• 💧 **Waterlogging Risk:** ${traffic.waterloggingRisk || "Low"}\n` +
          `• 👁️ **Visibility:** ${weather.visibility} km (${traffic.visibilityRisk || "Clear"})\n` +
          `• 🌧️ **Precipitation Threat:** ${weather.rainChance > 50 ? 'Precipitation imminent, expect reduced speeds' : 'Clear dry tarmac'}\n\n` +
          `💡 **Transit Advice:** ${cScore >= 75 ? 'Smooth commute expected along primary corridors.' : 'Allow 15-25 mins buffer time for slow-moving junctions.'}`;

        return { answer: response, persona: "commuter", widgetId: "widget_commuter_card", isHindi: false };
      }
    }

    // =========================================================================
    // 5. RAIN / MONSOON / UMBRELLA
    // =========================================================================
    if (q.includes("rain") || q.includes("umbrella") || q.includes("shower") || q.includes("monsoon") || q.includes("बारिश") || q.includes("बरसात") || q.includes("छाता") || q.includes("barish") || q.includes("barsat") || q.includes("chata")) {
      const rain = weather.rainChance;
      
      if (isHindi) {
        const response = `🌧️ **${cityName} में बारिश की संभावना**\n\n` +
          `• ☔ **संभावना:** ${rain}%\n` +
          `• ☁️ **स्थिति:** ${weather.condition}\n` +
          `• 💧 **आर्द्रता:** ${weather.humidity}%\n\n` +
          (rain >= 50 
            ? `⚠️ **बारिश की चेतावनी:** आज बारिश होने की पूरी संभावना है। बाहर निकलते समय छाता या रेनकोट अवश्य साथ रखें!`
            : rain >= 25 
            ? `🌤️ **हल्की संभावना:** कुछ इलाकों में बूंदाबांदी हो सकती है।`
            : `☀️ **साफ मौसम:** आज तेज बारिश की संभावना नगण्य है।`);

        return { answer: response, persona: "commuter", widgetId: "widget_commuter_card", isHindi: true };
      } else {
        const response = `🌧️ **Rainfall Expectation for ${cityName}**\n\n` +
          `• ☔ **Precipitation Probability:** ${rain}%\n` +
          `• ☁️ **Current Sky:** ${weather.condition}\n` +
          `• 💧 **Relative Humidity:** ${weather.humidity}%\n\n` +
          (rain >= 50 
            ? `⚠️ **Rain Warning:** Strong likelihood of rain. Don't forget your umbrella before stepping out!`
            : rain >= 25 
            ? `🌤️ **Isolated Showers:** Brief passing sprinkles possible in parts of the city.`
            : `☀️ **Dry Conditions:** Rain is unlikely today.`);

        return { answer: response, persona: "commuter", widgetId: "widget_commuter_card", isHindi: false };
      }
    }

    // =========================================================================
    // 6. BEACH & TIDES (INCOIS Coastal Safety)
    // =========================================================================
    if (q.includes("beach") || q.includes("tide") || q.includes("ocean") || q.includes("sea") || q.includes("surf") || q.includes("swim") || q.includes("तट") || q.includes("समुद्र") || q.includes("बीच") || q.includes("लहर") || q.includes("samundar") || q.includes("lehar")) {
      if (!tides) {
        const text = isHindi
          ? `🏖️ **${cityName} एक अंतर्देशीय (inland) शहर है।** यहाँ प्रत्यक्ष रूप से समुद्र तट या ज्वार-भाटा नहीं होता। तटीय शहरों के लिए मुंबई या चेन्नई चुनें!`
          : `🏖️ **${cityName} is an inland city.** Coastal tide and marine swell metrics apply to coastal stations like Mumbai, Chennai, or Kochi!`;
        return { answer: text, persona: "beach", widgetId: "widget_beach_card", isHindi };
      }

      const bScore = scores.beach.score;
      if (isHindi) {
        const response = `🏖️ **${cityName} तटीय एवं INCOIS ज्वार-भाटा बुलेटिन**\n**तट स्कोर: ${bScore}/100 (${scores.beach.verdict})**\n\n` +
          `• 🌊 **ज्वार की स्थिति:** ${tides.status} (अगला परिवर्तन: ${tides.nextTime})\n` +
          `• 🏄 **लहरों की ऊंचाई (Wave Height):** ${tides.waveHeight} मीटर\n` +
          `• ☀️ **UV इंडेक्स:** ${weather.uvIndex} (${weather.uvIndex > 7 ? 'सनस्क्रीन जरूर लगाएं' : 'मध्यम'})\n\n` +
          `💡 **तटीय सुरक्षा:** ${tides.safetyVerdict}`;

        return { answer: response, persona: "beach", widgetId: "widget_beach_card", isHindi: true };
      } else {
        const response = `🏖️ **Marine & Coastal Safety for ${cityName} (INCOIS)**\n**Beach Index: ${bScore}/100 (${scores.beach.verdict})**\n\n` +
          `• 🌊 **Tidal Phase:** ${tides.status} (Next shift: ${tides.nextTime})\n` +
          `• 🏄 **Swell / Wave Height:** ${tides.waveHeight} m\n` +
          `• ☀️ **UV Index:** ${weather.uvIndex} (${weather.uvIndex > 7 ? 'High UV: Broad-spectrum SPF advised' : 'Moderate'})\n\n` +
          `💡 **Coastal Verdict:** ${tides.safetyVerdict}`;

        return { answer: response, persona: "beach", widgetId: "widget_beach_card", isHindi: false };
      }
    }

    // =========================================================================
    // 7. AQI, AIR POLLUTION & MASKS
    // =========================================================================
    if (q.includes("aqi") || q.includes("pollution") || q.includes("air") || q.includes("mask") || q.includes("pm2.5") || q.includes("smog") || q.includes("asthma") || q.includes("हवा") || q.includes("प्रदूषण") || q.includes("मास्क") || q.includes("hawa") || q.includes("pradushan") || q.includes("saans")) {
      const pm25 = weather.airQuality.pm25;
      const pm10 = weather.airQuality.pm10;
      
      if (isHindi) {
        let maskAdvice = aqi > 200 ? "बाहर जाते समय N95 मास्क अवश्य पहनें।" : aqi > 100 ? "संवेदनशील व्यक्तियों को मास्क का प्रयोग करना चाहिए।" : "हवा साफ है, मास्क की आवश्यकता नहीं।";
        const response = `🩺 **CPCB वायु गुणवत्ता सूचकांक (AQI) - ${cityName}**\n\n` +
          `• 😷 **AQI:** ${aqi} (${weather.airQuality.category})\n` +
          `• 🔬 **PM2.5:** ${pm25} µg/m³\n` +
          `• 🔬 **PM10:** ${pm10} µg/m³\n\n` +
          `💡 **स्वास्थ्य परामर्श:** ${maskAdvice}`;

        return { answer: response, persona: "health", widgetId: "widget_health_card", isHindi: true };
      } else {
        let maskAdvice = aqi > 200 ? "N95 respirator strongly advised for outdoor exposure." : aqi > 100 ? "Sensitive groups (asthma/elderly) should limit strenuous outdoor activity." : "Air quality is satisfactory.";
        const response = `🩺 **CPCB National Air Quality Index (AQI) - ${cityName}**\n\n` +
          `• 😷 **AQI Level:** ${aqi} (${weather.airQuality.category})\n` +
          `• 🔬 **Fine Particulate (PM2.5):** ${pm25} µg/m³\n` +
          `• 🔬 **Coarse Particulate (PM10):** ${pm10} µg/m³\n\n` +
          `💡 **Health Guidance:** ${maskAdvice}`;

        return { answer: response, persona: "health", widgetId: "widget_health_card", isHindi: false };
      }
    }

    // =========================================================================
    // 8. GENERAL METEOROLOGICAL OVERVIEW
    // =========================================================================
    if (isHindi) {
      return {
        answer: `🌤️ **${cityName} समग्र मौसम (IMD Official Overview)**\n\n` +
          `• 🌡️ **तापमान:** ${weather.temp}°C (महसूस: ${weather.feelsLike}°C)\n` +
          `• ⛅ **स्थिति:** ${weather.condition}\n` +
          `• 💧 **आर्द्रता:** ${weather.humidity}%\n` +
          `• 💨 **हवा:** ${weather.windSpeed} किमी/घंटा (${weather.windDirection})\n` +
          `• 😷 **वायु गुणवत्ता (AQI):** ${aqi} (${weather.airQuality.category})\n` +
          `• 🌧️ **बारिश संभावना:** ${weather.rainChance}%\n\n` +
          `आप किसी विशिष्ट गतिविधि जैसे 'रनिंग', 'खेती', 'कम्यूट', या 'रडार' के बारे में भी पूछ सकते हैं!`,
        persona: "all",
        widgetId: "hero_weather",
        isHindi: true
      };
    } else {
      return {
        answer: `🌤️ **Current Weather Overview for ${cityName} (IMD Official)**\n\n` +
          `• 🌡️ **Temperature:** ${weather.temp}°C (Feels like: ${weather.feelsLike}°C)\n` +
          `• ⛅ **Conditions:** ${weather.condition}\n` +
          `• 💧 **Humidity:** ${weather.humidity}%\n` +
          `• 💨 **Wind:** ${weather.windSpeed} km/h (${weather.windDirection})\n` +
          `• 😷 **Air Quality:** AQI ${aqi} (${weather.airQuality.category})\n` +
          `• 🌧️ **Precipitation Risk:** ${weather.rainChance}%\n\n` +
          `Feel free to ask for specific persona advice, e.g., *"Can I run?"*, *"Should I spray pesticides?"*, or *"Check Doppler radar"*!`,
        persona: "all",
        widgetId: "hero_weather",
        isHindi: false
      };
    }
  }
}