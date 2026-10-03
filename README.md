# 🌦️ मौसम Mausam: Persona-Aware Personalized Weather Platform
### Smart India Hackathon 2026 | Problem Statement: `SIH26076`
**Theme:** Smart Automation | **Team:** Byte Force 02  
**Live GitHub Pages Demo:** [https://doremonsingh71-creator.github.io/mausam-sih2026/](https://doremonsingh71-creator.github.io/mausam-sih2026/)

---

## 🎯 Executive Summary
The official Indian Meteorological Department (IMD) app provides authoritative data, but delivers the same generic weather overview to every citizen. **Mausam (SIH26076)** revolutionizes this with an intelligent, **persona-aware homepage engine** that translates complex meteorological data into personalized, actionable 0–100 suitability scores.

Whether you are a **farmer** deciding whether to spray pesticides, a **daily commuter** evading waterlogged underpasses, an **asthma patient** monitoring PM2.5, or a **runner** timing morning cardio, Mausam dynamically re-ranks widgets, triggers priority alerts, and speaks in natural Hindi or English.

---

## 🏗️ Technologies Used (As Mandated by SIH26076)

| Layer | Technologies Mandated & Implemented |
|---|---|
| **Frontend** | Flutter / React Native architecture (`mobile_app/`), responsive PWA (`index.html`, `css/style.css`, `js/`), modular widget-based UI |
| **Backend** | Node.js & Express REST APIs (`backend/server.js`), Spring Boot architecture patterns, OTP authentication & signed JWT sessions |
| **Data & Cache** | PostgreSQL 16 + PostGIS spatial schema (`database/schema.sql`, `seed.sql`), Redis 7 distributed cache (`backend/services/redisService.js`) |
| **AI / ML** | Python rule-based scoring engine (`ml_service/scoring_engine.py`), Softmax adaptive ranking, context inference models |
| **Data Sources** | IMD Doppler Weather Radar Network, CPCB AQI (PM2.5/PM10), Open-Meteo live API, INCOIS Marine Tides, Agromet GKMS bulletins |
| **Voice & Maps** | Web Speech API bilingual assistant ("Mausam Bol"), Leaflet + OpenStreetMap Doppler Radar with live station switching |
| **Alerts & Security** | Firebase Cloud Messaging (FCM) priority queues (P1 high-urgency wake-up vs P2 normal), OTP verification & JWT bearer tokens |
| **Cloud & DevOps** | Docker Compose microservices (`docker-compose.yml`), containerized services (`backend/Dockerfile`, `ml_service/Dockerfile`) |

---

## 📡 What Doppler Weather Radar Does in Weather Forecasting & in Mausam

### 1. The Core Scientific Principle (Doppler Effect)
Traditional satellites capture cloud-top images from space, but cannot see inside rain clouds. A **Doppler Weather Radar (DWR)** emits targeted microwave pulses (S-band, C-band, or X-band) into the atmosphere:
- **Reflectivity (dBZ):** Measures the quantity of microwave energy reflected by raindrops, snowflakes, or hailstones. The higher the decibel of reflectivity ($Z$), the heavier the rain rate:
  - `5–20 dBZ`: Light drizzle or mist
  - `20–35 dBZ`: Moderate continuous rain
  - `35–45 dBZ`: Heavy precipitation
  - `45–55 dBZ`: Severe thunderstorms, squall lines, downpours
  - `> 55 dBZ`: Extreme hailstorms, cloudbursts, and supercells
- **Radial Velocity:** By measuring the *frequency shift* of returning pulses, the radar calculates the exact speed and direction of wind and rain droplets moving toward or away from the radar antenna. This detects **microbursts, wind shear, gust fronts, and cyclone vortices** before they touch ground.

### 2. Why Radar is Essential for "Nowcasting" (0–3 Hours)
Numerical Weather Prediction (NWP) models (like GFS or WRF) take hours to run on supercomputers. A localized thunderstorm or flash flood forms in 20 minutes. Doppler Weather Radar scans every 10 minutes, making it the **only tool capable of hyper-local 0–3 hour nowcasting**.

### 3. How Mausam Integrates Radar into Personas
- **Daily Commuters:** When a storm cell exceeds 40 dBZ within a 25 km radius of an urban center, Mausam automatically triggers a **Waterlogging Alert** and advises leaving early.
- **Farmers (GKMS):** Radar rain echoes immediately trigger an **Agromet Spray Hold Advisory** to prevent expensive fertilizers and pesticides from washing off into the soil.
- **Runners & Playground:** Alerts parents and runners 30 minutes before convective storm cells arrive.

---

## 🚀 Running the Full Stack

### Option A: Immediate Local Demo (No installation required)
Double-click `start.bat` or run:
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```
Open [http://localhost:8080](http://localhost:8080) in any browser.

### Option B: Dockerized Microservices Stack
```bash
docker-compose up --build
```
This boots all 5 containers:
1. `frontend`: Nginx serving the responsive PWA on `http://localhost:8080`
2. `backend-api`: Node.js REST API on `http://localhost:5000`
3. `ml-engine`: Python AI/ML service on `http://localhost:8000`
4. `postgres`: PostgreSQL 16 on `localhost:5432`
5. `redis`: Redis 7 cache on `localhost:6379`

---

## 👥 Smart India Hackathon 2026
- **Problem Statement ID:** SIH26076
- **Title:** Development of personalized homepage for "Mausam" mobile application
- **Organization:** Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)
- **Team:** Byte Force 02
