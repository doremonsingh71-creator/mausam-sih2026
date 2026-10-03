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
      console.warn("Speech Recognition API not available natively in this browser.");
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
        this.onStateChange({ listening: true, error: null, message: "Listening... बोलिए, मैं सुन रहा हूँ..." });
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
          userMsg = "Microphone access was blocked. Please allow mic permissions in your browser address bar.";
        } else if (event.error === "no-speech") {
          userMsg = "No speech detected. Please tap the mic and speak clearly.";
        } else if (event.error === "network") {
          userMsg = "Network error connecting to speech services. You can type freely in the chat!";
        }
        this.onStateChange({ listening: false, error: event.error, message: userMsg });
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onStateChange({ listening: false });
      };
    } catch (e) {
      console.warn("Error creating SpeechRecognition instance:", e);
    }
  }

  async startListening(lang = "en-IN") {
    // 1. Explicitly check / prompt for user media to guarantee mic permission in Chrome/Brave/Edge
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (micErr) {
      console.warn("Mic permission error:", micErr);
      this.onStateChange({ 
        listening: false, 
        error: "permission_denied",
        message: "Microphone permission was denied. Please allow microphone access in your browser or type your question below!"
      });
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.onStateChange({
        listening: false,
        error: "not_supported",
        message: "Your browser does not support Web Speech Recognition. You can type your question in English or हिंदी below!"
      });
      return false;
    }

    try {
      if (!this.recognition) {
        this.initRecognition();
      }
      this.recognition.lang = lang;
      this.recognition.start();
      return true;
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
      this.onStateChange({ 
        listening: false, 
        error: e.name, 
        message: "Microphone is initializing. You can tap again or type your question." 
      });
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }

  /**
   * Speak out the answer using Web Speech Synthesis
   */
  speak(text, lang = "en-IN") {
    if (!this.synth) return;
    try {
      this.synth.cancel(); // Stop any ongoing speech

      // Clean markdown tags for spoken audio
      const cleanText = text
        .replace(/[#*_`~>•]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\n+/g, " ")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang.startsWith("hi") ? "hi-IN" : "en-IN";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select best voice if available
      const voices = this.synth.getVoices();
      if (voices && voices.length > 0) {
        const targetLang = lang.startsWith("hi") ? "hi" : "en";
        const matchedVoice = voices.find(v => v.lang.toLowerCase().includes(targetLang) && (v.name.includes("India") || v.name.includes("Google") || v.name.includes("Natural")));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      this.synth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  /**
   * Deep, intelligent natural language understanding engine
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
    const aqiCat = weather.airQuality?.category || "Moderate";
    const tides = weather.tides;
    const cityName = location.name;

    // Detect language: Devnagari script or Hindi romanized keywords
    const isHindi = /[\u0900-\u097F]|kya|aaj|barish|dhaud|daud|kisan|chhidkaw|chhidkao|hawa|mausam|pradushan|pani|khet|fasal|tapman|garmi|sardi|bachho|bacche|beach|samundar/i.test(q);

    // =========================================================================
    // 1. FITNESS / RUNNING / CARDIO / JOGGING / CYCLING
    // =========================================================================
    if (q.includes("run") || q.includes("jog") || q.includes("fitness") || q.includes("cycling") || q.includes("walk") || q.includes("cardio") || q.includes("दौड़") || q.includes("daud") || q.includes("dhaud") || q.includes("vyayam")) {
      const rScore = scores.runner.score;
      const bestHour = scores.runner.bestHour || "06:00 AM - 07:30 AM";
      
      if (isHindi) {
        let verdict = rScore >= 75 ? "दौड़ने के लिए बहुत बढ़िया" : rScore >= 50 ? "मध्यम परिस्थितियां" : "दौड़ने से बचें";
        let advice = rScore >= 75 
          ? `सुबह का मौसम दौड़ने और कसरत के लिए बहुत अच्छा रहेगा। AQI स्तर ${aqi} (${aqiCat}) है।` 
          : `हवा में प्रदूषण (AQI ${aqi}) और उमस के कारण खुली हवा में तेज दौड़ने से सांस की समस्या हो सकती है। इनडोर ट्रेडमिल या हल्का योग बेहतर रहेगा।`;

        const response = `🏃‍♂️ **${cityName} में रन स्कोर: ${rScore}/100 (${verdict})**

• **सर्वोत्तम समय:** ${bestHour}
• **तापमान:** ${weather.temp}°C (महसूस: ${weather.feelsLike}°C)
• **वायु गुणवत्ता (AQI):** ${aqi} - ${aqiCat} (मुख्य प्रदूषक: ${weather.airQuality.primaryPollutant})
• **बारिश की संभावना:** ${weather.rainChance}%

💡 **परामर्श:** ${advice} धूप और उमस बढ़ने से पहले कसरत पूरी करें और पर्याप्त पानी पिएं।`;

        return { answer: response, persona: "runner", widgetId: "run_score", isHindi: true };
      } else {
        let verdict = rScore >= 75 ? "Optimal Running Conditions" : rScore >= 50 ? "Fair / Moderate Conditions" : "Outdoor Exertion Not Advised";
        let advice = rScore >= 75
          ? `Air conditions and morning breeze are favorable for outdoor cardio. Temperature is a comfortable ${weather.temp}°C.`
          : `Elevated PM2.5 levels (AQI: ${aqi}) and ambient heat index impose cardiopulmonary strain. Prefer an indoor treadmill or low-intensity recovery walk.`;

        const response = `🏃‍♂️ **Run & Fitness Suitability for ${cityName}: ${rScore}/100 · ${verdict}**

• **Recommended Window:** 🌅 ${bestHour}
• **Current Temperature:** ${weather.temp}°C (Apparent: ${weather.feelsLike}°C)
• **CPCB Air Quality:** AQI ${aqi} (${aqiCat}) · PM2.5: ${weather.airQuality.pm25} µg/m³
• **Precipitation Risk:** ${weather.rainChance}% · Wind: ${weather.windSpeed} km/h ${weather.windDirection}

💡 **Actionable Advice:** ${advice}`;

        return { answer: response, persona: "runner", widgetId: "run_score", isHindi: false };
      }
    }

    // =========================================================================
    // 2. AGRICULTURE / FARMING / SPRAYING / CROPS / FERTILIZER / GKMS
    // =========================================================================
    if (q.includes("spray") || q.includes("crop") || q.includes("farm") || q.includes("kisan") || q.includes("pesticide") || q.includes("fertilizer") || q.includes("urea") || q.includes("irrigation") || q.includes("soil") || q.includes("frost") || q.includes("छिड़काव") || q.includes("फसल") || q.includes("किसान") || q.includes("खाद") || q.includes("सिंचाई") || q.includes("chhidkaw") || q.includes("sinchai") || q.includes("pala")) {
      const aScore = scores.farmer.score;
      const sprayWin = agro.bestSprayWindow || "10:00 AM - 01:00 PM";
      const gkms = agro.gkmsAdvisory || "Advisory based on district agromet data.";

      if (isHindi) {
        let verdict = aScore >= 70 ? "छिड़काव के लिए अनुकूल समय" : "आज छिड़काव से बचें";
        const response = `🌾 **किसान मौसम सलाह (GKMS) · स्कोर: ${aScore}/100 (${verdict})**

• **छिड़काव खिड़की:** ${sprayWin}
• **हवा की गति:** ${weather.windSpeed} किमी/घंटा (${weather.windDirection}) ${weather.windSpeed > 15 ? '⚠️ तेज हवा से दवाई बह सकती है' : '✅ शांत हवा, सुरक्षित छिड़काव'}
• **बारिश का जोखिम:** ${weather.rainChance}%
• **मिट्टी की नमी:** ${agro.soilMoisture}% (${agro.soilMoisture > 60 ? 'पर्याप्त नमी' : 'हल्की सिंचाई आवश्यक'})
• **पाला / तुषार जोखिम:** ${agro.frostRisk}

📢 **IMD कृषि परामर्श:** "${gkms}"`;

        return { answer: response, persona: "farmer", widgetId: "gkms_advisory", isHindi: true };
      } else {
        let verdict = aScore >= 70 ? "Safe Window for Field Spraying" : "Unfavorable for Chemical Spraying";
        const response = `🌾 **Gramin Krishi Mausam Sewa (GKMS) Advisory for ${cityName}**
**Agro Spraying Score: ${aScore}/100 · ${verdict}**

• **Optimal Spray Window:** ⏰ ${sprayWin}
• **Wind Factor:** ${weather.windSpeed} km/h ${weather.windDirection} (${weather.windSpeed < 12 ? 'Calm, minimal spray drift' : 'Breezy, risk of chemical drift'})
• **Precipitation Probability:** ${weather.rainChance}% (Washout risk: ${weather.rainChance > 40 ? 'High' : 'Negligible'})
• **Soil Moisture Index:** ${agro.soilMoisture}% · Frost Risk: ${agro.frostRisk}

📢 **Official Agromet Directive:**
"${gkms}"`;

        return { answer: response, persona: "farmer", widgetId: "gkms_advisory", isHindi: false };
      }
    }

    // =========================================================================
    // 3. COMMUTE / TRAFFIC / OFFICE RUSH / WATERLOGGING / RAIN TIMING
    // =========================================================================
    if (q.includes("commute") || q.includes("traffic") || q.includes("road") || q.includes("office") || q.includes("metro") || q.includes("waterlog") || q.includes("jam") || q.includes("गाड़ी") || q.includes("सड़क") || q.includes("ट्रैफिक") || q.includes("ऑफिस") || q.includes("sadak") || q.includes("gadi")) {
      const cScore = scores.commuter.score;
      const traffic = weather.trafficImpact || {};

      if (isHindi) {
        const response = `🚗 **${cityName} दैनिक यात्रा व ट्रैफिक मौसम रिपोर्ट (स्कोर: ${cScore}/100)**

• **ट्रैफिक स्थिति:** ${traffic.congestionLevel || 'सामान्य'}
• **प्रमुख प्रभावित मार्ग:** ${traffic.hotspot || 'मुख्य रिंग रोड व शहर के प्रमुख चौराहे'}
• **बारिश व जलभराव चेतावनी:** ${traffic.peakRainRisk || 'आज जलभराव का खतरा कम है'}
• **दृश्यता (Visibility):** ${weather.visibility} किमी ${weather.visibility < 3 ? '(धुंध/स्मॉग का असर)' : '(स्पष्ट दृश्यता)'}

💡 **सलाह:** ${weather.rainChance > 40 ? 'शाम के समय छाता साथ रखें और जलभराव वाले रास्तों से बचें।' : 'सड़कें सूखी और यात्रा के अनुकूल हैं।'}`;

        return { answer: response, persona: "commuter", widgetId: "traffic_weather", isHindi: true };
      } else {
        const response = `🚗 **Commuter Traffic-Weather Fusion Report for ${cityName}**
**Commute Comfort Index: ${cScore}/100 · ${scores.commuter.verdict}**

• **Transit Friction Level:** ${traffic.congestionLevel || 'Moderate'}
• **Key Bottlenecks:** ${traffic.hotspot || 'Main arterial transit corridors'}
• **Precipitation & Waterlogging:** ${traffic.peakRainRisk || 'Low probability of localized road flooding'}
• **Road Visibility:** ${weather.visibility} km (${weather.visibility < 3 ? 'Caution: Reduced visibility due to haze/fog' : 'Good visibility'})

💡 **Recommendation:** ${weather.rainChance > 40 ? 'Expect commuter delays around peak hours. Monitor localized rain radar before departure.' : 'Favorable road transit conditions with dry pavement.'}`;

        return { answer: response, persona: "commuter", widgetId: "traffic_weather", isHindi: false };
      }
    }

    // =========================================================================
    // 4. RAIN / PRECIPITATION / UMBRELLA / MONSOON
    // =========================================================================
    if (q.includes("rain") || q.includes("umbrella") || q.includes("shower") || q.includes("monsoon") || q.includes("बारिश") || q.includes("बरसात") || q.includes("छाता") || q.includes("barish") || q.includes("barsat") || q.includes("chata")) {
      const rain = weather.rainChance;
      
      if (isHindi) {
        const response = `🌧️ **${cityName} में वर्षा का पूर्वानुमान**

• **बारिश की संभावना:** ${rain}%
• **अपेक्षित समय:** ${rain >= 50 ? 'दोपहर बाद 04:00 PM से शाम 07:00 PM के बीच' : 'आज बारिश की संभावना बहुत कम है'}
• **आर्द्रता (Humidity):** ${weather.humidity}%
• **मौसम की स्थिति:** ${weather.condition}

💡 **सुझाव:** ${rain >= 50 ? 'हाँ, आज छाता या रेनकोट अवश्य साथ रखें। तेज बौछारों की संभावना है।' : 'आज छाते की विशेष आवश्यकता नहीं है। मौसम मुख्य रूप से खुला रहेगा।'}`;

        return { answer: response, persona: "commuter", widgetId: "rain_alert", isHindi: true };
      } else {
        const response = `🌧️ **Precipitation & Radar Forecast for ${cityName}**

• **Rain Probability:** ${rain}%
• **Projected Onset:** ${rain >= 50 ? 'Likely around 04:00 PM - 07:00 PM' : 'No significant rainfall anticipated today'}
• **Relative Humidity:** ${weather.humidity}% · Pressure: ${weather.pressure} hPa
• **Skies:** ${weather.condition}

💡 **Guidance:** ${rain >= 50 ? 'Carry rain protection (umbrella/waterproof jacket). Surface roads may experience localized pooling.' : 'Dry conditions expected to prevail throughout the day.'}`;

        return { answer: response, persona: "commuter", widgetId: "rain_alert", isHindi: false };
      }
    }

    // =========================================================================
    // 5. BEACH / COASTAL / TIDES / SURF / SWIMMING / OCEAN
    // =========================================================================
    if (q.includes("beach") || q.includes("tide") || q.includes("ocean") || q.includes("sea") || q.includes("surf") || q.includes("swim") || q.includes("तट") || q.includes("समुद्र") || q.includes("बीच") || q.includes("लहर") || q.includes("samundar") || q.includes("lehar")) {
      if (!tides) {
        const text = isHindi
          ? `📍 **${cityName} एक अंतर्देशीय (inland) क्षेत्र है।** यहां समुद्री तट या ज्वार-भाटा (tides) लागू नहीं होता। यदि आप तटीय मौसम देखना चाहते हैं, तो ऊपर लोकेशन में 'Mumbai' चुनें!`
          : `📍 **${cityName} is an inland geographical region** without marine shorelines or oceanic tides. Select 'Mumbai' from the regional location dropdown to explore coastal tides and surf analysis!`;
        return { answer: text, persona: "beach", widgetId: "beach_score", isHindi };
      }

      const bScore = scores.beach.score;
      if (isHindi) {
        const response = `🏖️ **${cityName} समुद्र तट व INCOIS ज्वार-भाटा बुलेटिन**
**बीच स्कोर: ${bScore}/100 (${scores.beach.verdict})**

• **🌊 उच्च ज्वार (High Tide):** ${tides.highTide}
• **🏖️ निम्न ज्वार (Low Tide):** ${tides.lowTide}
• **लहरों की ऊंचाई:** ${tides.waveHeight}
• **समुद्री सतह का तापमान:** ${tides.seaSurfaceTemp}°C
• **सुरक्षा सलाह:** ${tides.waterSafety}

💡 **परामर्श:** शाम 04:00 PM के बाद समुद्र की ठंडी हवा का आनंद लिया जा सकता है। उच्च ज्वार के समय गहरे पानी में न जाएं।`;

        return { answer: response, persona: "beach", widgetId: "tide_card", isHindi: true };
      } else {
        const response = `🏖️ **INCOIS Marine & Coastal Bulletin for ${cityName}**
**Beach Suitability Index: ${bScore}/100 · ${scores.beach.verdict}**

• **🌊 High Tide Window:** ${tides.highTide}
• **🏖️ Low Tide Window:** ${tides.lowTide}
• **Swell Characteristics:** ${tides.waveHeight}
• **Sea Surface Temperature:** ${tides.seaSurfaceTemp}°C · Solar UV: ${weather.uvIndex}
• **Marine Advisory:** ${tides.waterSafety}

💡 **Recommendation:** Evening coastal breeze after 4:30 PM is pleasant. Heed lifeguard advisories around rocky headlands during peak tidal surge.`;

        return { answer: response, persona: "beach", widgetId: "tide_card", isHindi: false };
      }
    }

    // =========================================================================
    // 6. AIR QUALITY / AQI / SMOG / POLLUTION / MASK / HEALTH
    // =========================================================================
    if (q.includes("aqi") || q.includes("pollution") || q.includes("air") || q.includes("mask") || q.includes("pm2.5") || q.includes("smog") || q.includes("asthma") || q.includes("हवा") || q.includes("प्रदूषण") || q.includes("मास्क") || q.includes("hawa") || q.includes("pradushan") || q.includes("saans")) {
      const pm25 = weather.airQuality.pm25;
      const pm10 = weather.airQuality.pm10;
      
      if (isHindi) {
        let maskAdvice = aqi > 200 ? "⚠️ बाहर जाने पर N95 मास्क पहनना अनिवार्य है।" : aqi > 100 ? "संवेदनशील व्यक्तियों को मास्क का उपयोग करना चाहिए।" : "हवा सांस लेने के लिए सुरक्षित है।";
        const response = `🩺 **CPCB वायु गुणवत्ता सूचकांक (AQI) - ${cityName}**

• **वर्तमान AQI:** **${aqi}** (${aqiCat})
• **PM2.5 सांद्रता:** ${pm25} µg/m³ (मानक से ${pm25 > 60 ? 'अधिक' : 'सुरक्षित'})
• **PM10 सांद्रता:** ${pm10} µg/m³
• **ओजोन (O3):** ${weather.airQuality.o3} ppb · NO2: ${weather.airQuality.no2} ppb

🛡️ **स्वास्थ्य सुरक्षा निर्देश:**
${maskAdvice} बुजुर्गों और दमा के मरीजों को सुबह के समय खुले में भारी शारीरिक श्रम से बचना चाहिए।`;

        return { answer: response, persona: "health", widgetId: "aqi_breakdown", isHindi: true };
      } else {
        let maskAdvice = aqi > 200 
          ? "⚠️ High respiratory hazard: N95/FFP2 respirator mask strongly recommended outdoors." 
          : aqi > 100 
            ? "Sensitive individuals (asthma, COPD, children) should limit prolonged outdoor exertion." 
            : "Air quality meets standard health safety guidelines.";

        const response = `🩺 **Central Pollution Control Board (CPCB) Air Monitoring: ${cityName}**

• **Current AQI:** **${aqi}** · Category: **${aqiCat}**
• **Fine Particulates (PM2.5):** ${pm25} µg/m³
• **Coarse Dust (PM10):** ${pm10} µg/m³
• **Ozone (O3):** ${weather.airQuality.o3} ppb · NO2: ${weather.airQuality.no2} ppb

🛡️ **Clinical Guidance:**
${maskAdvice} Keep indoor air filtration active if sensitive to particulate matter.`;

        return { answer: response, persona: "health", widgetId: "aqi_breakdown", isHindi: false };
      }
    }

    // =========================================================================
    // 7. PARENTS / KIDS / SCHOOL / PLAYGROUND
    // =========================================================================
    if (q.includes("kid") || q.includes("child") || q.includes("parent") || q.includes("playground") || q.includes("park") || q.includes("school") || q.includes("बच्चे") || q.includes("पार्क") || q.includes("स्कूल") || q.includes("bacche") || q.includes("bacho") || q.includes("khel")) {
      const pScore = scores.parent.score;
      if (isHindi) {
        const response = `👶 **बच्चों और खेल के मैदान का मौसम सूचकांक: ${pScore}/100**

• **स्थिति:** ${scores.parent.verdict}
• **तापमान:** ${weather.temp}°C · आर्द्रता: ${weather.humidity}%
• **हवा की शुद्धता (AQI):** ${aqi} (${aqiCat})
• **धूप व UV इंडेक्स:** ${weather.uvIndex} (मध्यम)

💡 **माता-पिता के लिए सुझाव:** ${pScore >= 70 ? 'शाम 5 बजे के बाद बच्चे पार्क में सुरक्षित खेल सकते हैं। पानी की बोतल साथ भेजें।' : 'प्रदूषण और तेज मौसम के कारण बच्चों को अधिक समय खुले में खेलने न दें। इनडोर खेलों को प्राथमिकता दें।'}`;

        return { answer: response, persona: "parent", widgetId: "parent_score", isHindi: true };
      } else {
        const response = `👶 **Family & Playground Comfort Index for ${cityName}: ${pScore}/100**

• **Evaluation:** ${scores.parent.verdict}
• **Thermal Conditions:** ${weather.temp}°C (Apparent: ${weather.feelsLike}°C)
• **Atmospheric Purity:** AQI ${aqi} (${aqiCat})
• **Solar UV Index:** ${weather.uvIndex} · Precipitation: ${weather.rainChance}%

💡 **Parental Advice:** ${pScore >= 70 ? 'Favorable for park play and school sports after 4:30 PM. Ensure proper hydration.' : 'Consider indoor play activities or shorten park playtime due to ambient air quality.'}`;

        return { answer: response, persona: "parent", widgetId: "parent_score", isHindi: false };
      }
    }

    // =========================================================================
    // 8. CLOTHING / ATTIRE / WHAT TO WEAR
    // =========================================================================
    if (q.includes("wear") || q.includes("cloth") || q.includes("jacket") || q.includes("dress") || q.includes("कपड़े") || q.includes("क्या पहनें") || q.includes("kapde") || q.includes("pehne")) {
      const temp = weather.temp;
      if (isHindi) {
        let advice = temp > 30 ? "हल्के सूती (cotton) कपड़े पहनें और धूप का चश्मा साथ रखें।" : temp < 15 ? "गर्म स्वेटर या हल्की जैकेट आवश्यक है, सुबह और शाम ठंड रहेगी।" : "सामान्य आरामदायक कपड़े उपयुक्त हैं।";
        if (weather.rainChance > 40) advice += " साथ ही छाता या रेनकोट भी साथ रखें।";
        return {
          answer: `👕 **${cityName} के लिए पोशाक व पहनावा सुझाव:**\n\n• तापमान: ${temp}°C\n• मौसम: ${weather.condition}\n\n💡 **सलाह:** ${advice}`,
          persona: "parent",
          widgetId: "uv_heat",
          isHindi: true
        };
      } else {
        let advice = temp > 30 ? "Light, breathable cotton or linen fabrics. Sunglasses recommended." : temp < 15 ? "Layer with a light jacket or fleece, particularly during morning and evening drops." : "Comfortable casual attire.";
        if (weather.rainChance > 40) advice += " Pack an umbrella or rain-resistant outer shell.";
        return {
          answer: `👕 **Attire Recommendations for ${cityName}:**\n\n• Temperature: ${temp}°C (Feels like: ${weather.feelsLike}°C)\n• Conditions: ${weather.condition}\n\n💡 **Advice:** ${advice}`,
          persona: "parent",
          widgetId: "uv_heat",
          isHindi: false
        };
      }
    }

    // =========================================================================
    // 9. GENERAL / DEFAULT WEATHER OVERVIEW
    // =========================================================================
    if (isHindi) {
      return {
        answer: `🌤️ **${cityName} मौसम सारांश (IMD Official Overview)**

• **तापमान:** ${weather.temp}°C (महसूस: ${weather.feelsLike}°C)
• **मौसम का हाल:** ${weather.condition}
• **आर्द्रता (Humidity):** ${weather.humidity}%
• **हवा की गति:** ${weather.windSpeed} किमी/घंटा (${weather.windDirection})
• **वायु गुणवत्ता (AQI):** ${aqi} (${aqiCat})
• **बारिश की संभावना:** ${weather.rainChance}%
• **वायुदाब:** ${weather.pressure} hPa · दृश्यता: ${weather.visibility} किमी

आप मुझसे दौड़ने, फसल में छिड़काव, ट्रैफिक, या बीच के बारे में भी पूछ सकते हैं!`,
        persona: "runner",
        widgetId: "weather_overview",
        isHindi: true
      };
    }

    return {
      answer: `🌤️ **Official Meteorological Snapshot for ${cityName}**

• **Temperature:** ${weather.temp}°C (Apparent: ${weather.feelsLike}°C)
• **Current Conditions:** ${weather.condition}
• **Relative Humidity:** ${weather.humidity}% · Pressure: ${weather.pressure} hPa
• **Wind Speed:** ${weather.windSpeed} km/h ${weather.windDirection}
• **Air Quality:** AQI ${aqi} (${aqiCat}) · PM2.5: ${weather.airQuality.pm25} µg/m³
• **Precipitation Probability:** ${weather.rainChance}% · Visibility: ${weather.visibility} km

Feel free to ask specific questions about running windows, pesticide spraying, commuter rush hours, or coastal tides!`,
      persona: "runner",
      widgetId: "weather_overview",
      isHindi: false
    };
  }
}
