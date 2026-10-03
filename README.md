# MAUSAM: Persona-Aware Homepage (SIH 2026)

**Smart India Hackathon 2026**  
**Problem Statement ID:** `SIH26076`  
**Problem Statement Title:** Development of personalized homepage for 'Mausam' mobile application  
**Theme:** Smart Automation | **Category:** Software  
**Team Name:** Byte Force 02  

---

## 🌟 Executive Summary & Problem Addressed

Traditional weather applications provide a single, static layout for every user. A farmer in rural Punjab, a marathon runner in Delhi, and a coastal resident in Mumbai all receive identical meteorological tables. Essential insights—such as **chemical spray windows**, **optimal run hours**, **tide cycles**, or **commute rain onset**—remain buried deep beneath irrelevant statistics.

**Mausam: Persona-Aware Homepage** transforms the official IMD experience through an intelligent, modular architecture that dynamically assembles, scores, and prioritizes the exact weather signals that matter to each persona.

---

## 🚀 Key Modules Implemented

### 1. Persona-Driven Suitability & Comfort Engine
Instead of raw numbers, users receive an actionable **0–100 Compound Index**:
* 🏃 **Runner / Fitness Score**: Synthesizes temperature comfort, relative humidity, CPCB PM2.5 AQI, and UV stress to pinpoint ideal running hours (e.g., `82/100 · Prime run window at 6:00 AM`).
* 🌾 **Agro Spraying & Field Index (GKMS)**: Evaluates wind drift velocity (<12 km/h), rain washout risk (<20%), and soil moisture to recommend safe chemical spray windows.
* 🏖️ **Beach & Marine Score**: Combines INCOIS high/low tide timing, wave swell heights, sea surface temperature, and coastal gusts.
* 🚗 **Commuter Traffic-Weather Fusion**: Correlates precipitation onset, arterial road waterlogging risk, and atmospheric visibility.
* 👶 **Parents & Playground Score**: Assesses child thermal comfort, ground allergens, and school commute safety.
* 🎪 **Outdoor Event Go / No-Go Index**: Predicts tent/canopy wind gust thresholds and hourly disruption probability.
* 🩺 **Respiratory & Health Index**: Real-time CPCB particulate breakdown (PM2.5, PM10, O3, NO2) and N95 mask advisories.

### 2. Context Inference Engine (Smart Automation)
Automatically infers and refines user personas based on:
* **Geographic Topography**: Coastal (boosts Beach & Tides) vs. Agricultural Plain (boosts GKMS & Soil Moisture) vs. Metro (boosts Commute & AQI).
* **Time of Day**: Early morning (boosts Fitness), peak transit hours (boosts Commute), midday (boosts Solar UV & Agromet spraying).
* **Severe Weather Overrides**: Extreme AQI (>200) or imminent torrential rain immediately elevates health/transit safety alerts above all other content.

### 3. Adaptive Widget Ranking (Slide 4 Strategy)
* Overcomes the **clutter challenge** by dynamically sorting widgets.
* The top 4–5 most urgent and relevant insights occupy the **Featured Hero Section**.
* Lower-priority widgets seamlessly tuck into the **"More Insights"** collapsible drawer.
* Interaction telemetry tracks user clicks and pins to continuously adapt the layout to personal habits.

### 4. Alert Prioritization (Eliminating Notification Fatigue)
* Ranks alerts by urgency: **Severe (Emergency)** > **Warning** > **Advisory** > **Info**.
* Filters notifications based on the active persona profile so farmers don't get surf warnings, and beachgoers don't get crop frost notices.

### 5. "Mausam Bol" (मौसम बोल) - Voice & Multilingual Query
* Powered by the **Web Speech API** (Speech Recognition & Speech Synthesis).
* Understands natural language queries in **English** and **Hindi**:
  * *"Can I go for a run right now?"*
  * *"क्या आज फसल में कीटनाशक का छिड़काव कर सकते हैं?"*
  * *"Will it rain during my evening commute?"*
  * *"क्या आज बीच जाना सुरक्षित है?"*
* Returns direct, spoken audio answers calculated from live weather indices.

### 6. Offline-First Architecture for Rural Farmers (GKMS)
* Full local caching fallback via `LocalStorage` and `Cache API`.
* Visual indicator badge toggles between **"Live IMD Sync"** and **"Offline Cache Active (GKMS)"**.
* Ensures rural farmers in remote Gram Panchayats retain access to critical advisories during connectivity dropouts.

---

## 📱 Running the Application

The application is completely self-contained with no external build tools required.

### Option A: Open directly in your browser
Double-click or open `index.html` in any modern browser (Brave, Chrome, Edge, Firefox, Safari):
```powershell
Start-Process "C:\Users\Rishav kishore\.gemini\antigravity\scratch\mausam-app\index.html"
```

### Option B: Run via a local web server (Recommended for Web Speech API)
You can serve it with any lightweight HTTP server, or using PowerShell:
```powershell
cd "C:\Users\Rishav kishore\.gemini\antigravity\scratch\mausam-app"
# Or using python if installed:
python -m http.server 3000
```
Open `http://localhost:3000` in your web browser.

---

## 🛠️ Interactive Evaluator Controls (Top Toolbar)
The top header provides built-in tools designed specifically for demonstration:
1. **Cycle Context Simulation** (`Early Morning 6 AM` → `Commute Rush` → `Agro Midday` → `Monsoon Showers`): Demonstrates the Context Inference Engine dynamically reorganizing the UI.
2. **Test Offline Mode**: Demonstrates low-connectivity village fallback and instant cache restoration.
3. **Fullscreen / Phone View Toggle**: Switch between the native mobile device chassis view and responsive desktop view.
