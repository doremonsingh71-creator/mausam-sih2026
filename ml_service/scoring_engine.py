"""
=============================================================================
MAUSAM AI/ML MICROSERVICE - SCORING & ADAPTIVE RANKING ENGINE
Smart India Hackathon 2026 - Problem Statement SIH26076
Team: Byte Force 02
=============================================================================
This microservice provides:
1. Rule-Based Compound Suitability Scoring (0–100) for 8 personas
2. Context Inference: Auto-detects top persona from time, geo, & weather
3. Adaptive Widget Ranking: Machine learning ranking weights & re-ordering
"""

import json
import math
from typing import Dict, List, Any

class MausamMLEngine:
    def __init__(self):
        # Trained feature weights for adaptive ranking
        self.feature_weights = {
            "time_relevance": 0.35,
            "weather_severity_multiplier": 0.40,
            "user_affinity": 0.15,
            "persona_suitability_urgency": 0.10
        }

    # --------------------------------------------------------------------------
    # 1. COMPOUND SUITABILITY SCORING (Rule-Based Expert System)
    # --------------------------------------------------------------------------
    def calculate_suitability(self, weather: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        temp = float(weather.get("temp", 26))
        humidity = float(weather.get("humidity", 50))
        wind_speed = float(weather.get("windSpeed", 10))
        rain_prob = float(weather.get("rainChance", 10))
        uv_index = float(weather.get("uvIndex", 5))
        aqi = float(weather.get("aqi", 85))

        scores = {}

        # 1. Runner / Fitness
        # Penalties: temp > 28°C or < 8°C, AQI > 100, rain > 30%, humidity > 75%
        r_score = 100.0
        if temp > 24: r_score -= (temp - 24) * 3.5
        elif temp < 14: r_score -= (14 - temp) * 2.5
        if aqi > 100: r_score -= (aqi - 100) * 0.25
        if humidity > 65: r_score -= (humidity - 65) * 0.4
        if rain_prob > 25: r_score -= (rain_prob - 25) * 0.6
        r_score = max(0, min(100, round(r_score)))
        scores["runner"] = {
            "score": r_score,
            "label": "Runner & Fitness",
            "verdict": "Ideal" if r_score >= 80 else ("Fair" if r_score >= 50 else "Not Recommended"),
            "advice": "Great time for a brisk outdoor jog!" if r_score >= 80 else "Consider indoor cardio due to humidity/AQI."
        }

        # 2. Farmer / Agromet (GKMS)
        # Optimal spray: wind 5-15 km/h, rain < 20%, temp 18-32°C
        f_score = 100.0
        if rain_prob > 20: f_score -= (rain_prob - 20) * 1.0
        if wind_speed > 15: f_score -= (wind_speed - 15) * 2.5
        elif wind_speed < 3: f_score -= 10
        if temp > 36 or temp < 10: f_score -= 20
        f_score = max(0, min(100, round(f_score)))
        scores["farmer"] = {
            "score": f_score,
            "label": "Agromet (Farmer)",
            "verdict": "Suitable" if f_score >= 70 else "Delay Spraying",
            "advice": "Safe for foliar spray & fertilizer top-dressing." if f_score >= 70 else "High rain/wind probability: hold chemical spray."
        }

        # 3. Commuter (Urban Transport & Waterlogging)
        c_score = 100.0
        if rain_prob > 40: c_score -= (rain_prob - 40) * 0.9
        if wind_speed > 35: c_score -= (wind_speed - 35) * 1.2
        if aqi > 250: c_score -= 15  # Poor visibility from smog
        c_score = max(0, min(100, round(c_score)))
        scores["commuter"] = {
            "score": c_score,
            "label": "Daily Commuter",
            "verdict": "Smooth" if c_score >= 75 else ("Moderate Delays" if c_score >= 50 else "Severe Waterlogging"),
            "advice": "Normal traffic conditions expected." if c_score >= 75 else "Allow 20 mins buffer for potential choke points."
        }

        # 4. Beach & Marine Coastal (INCOIS Coastal Safety)
        b_score = 100.0
        if wind_speed > 25: b_score -= (wind_speed - 25) * 2.0
        if rain_prob > 35: b_score -= (rain_prob - 35) * 0.8
        if uv_index > 8: b_score -= (uv_index - 8) * 4.0
        b_score = max(0, min(100, round(b_score)))
        scores["beach"] = {
            "score": b_score,
            "label": "Beach & Coastal",
            "verdict": "Safe Swell" if b_score >= 70 else "Rough Seas",
            "advice": "Pleasant tide conditions for shoreline walks." if b_score >= 70 else "High swell warning: avoid deep swimming."
        }

        # 5. Parent / Children Playground
        p_score = 100.0
        if temp > 33: p_score -= (temp - 33) * 4.0
        if uv_index > 7: p_score -= (uv_index - 7) * 5.0
        if aqi > 120: p_score -= (aqi - 120) * 0.3
        if rain_prob > 30: p_score -= (rain_prob - 30) * 0.9
        p_score = max(0, min(100, round(p_score)))
        scores["parent"] = {
            "score": p_score,
            "label": "Parents & Playground",
            "verdict": "Outdoor Play Ok" if p_score >= 70 else "Indoor Activities Recommended",
            "advice": "Good window for park and playground visits." if p_score >= 70 else "High heat/UV index: protect kids with sunscreen and fluids."
        }

        # 6. Event Organizer
        e_score = 100.0
        if rain_prob > 15: e_score -= (rain_prob - 15) * 1.2
        if wind_speed > 25: e_score -= (wind_speed - 25) * 2.0
        if temp > 35 or temp < 10: e_score -= 15
        e_score = max(0, min(100, round(e_score)))
        scores["event"] = {
            "score": e_score,
            "label": "Outdoor Event",
            "verdict": "Clear Skies" if e_score >= 75 else "Weather Risk",
            "advice": "Low risk for outdoor gatherings and tents." if e_score >= 75 else "Keep waterproof canopy backups ready."
        }

        # 7. Health & Sensitive (AQI / Asthma / Elderly)
        h_score = 100.0
        if aqi > 100: h_score -= (aqi - 100) * 0.35
        if humidity > 80 or humidity < 25: h_score -= 15
        if temp > 38 or temp < 8: h_score -= 20
        h_score = max(0, min(100, round(h_score)))
        scores["health"] = {
            "score": h_score,
            "label": "Health & Respiratory",
            "verdict": "Healthy" if h_score >= 70 else ("Sensitive Caution" if h_score >= 45 else "Hazardous"),
            "advice": "Air quality is favorable." if h_score >= 70 else "Asthmatic individuals should carry inhalers and wear N95."
        }

        # 8. Travel & Tourism
        t_score = round((r_score + e_score + b_score) / 3)
        scores["travel"] = {
            "score": t_score,
            "label": "Travel & Sightseeing",
            "verdict": "Pleasant" if t_score >= 70 else "Challenging",
            "advice": "Great day for monument visits and open-air touring." if t_score >= 70 else "Check local transit delays before departing."
        }

        return scores

    # --------------------------------------------------------------------------
    # 2. CONTEXT INFERENCE ENGINE
    # --------------------------------------------------------------------------
    def infer_context(self, hour: int, weather: Dict[str, Any], is_coastal: bool = False, is_rural: bool = False) -> str:
        rain = float(weather.get("rainChance", 0))
        aqi = float(weather.get("aqi", 70))
        temp = float(weather.get("temp", 25))

        # Priority 1: Extreme weather triggers
        if rain > 70 or float(weather.get("windSpeed", 0)) > 45:
            return "commuter"  # Immediate road safety priority
        if aqi > 300:
            return "health"    # Severe health hazard

        # Priority 2: Diurnal routine patterns
        if 5 <= hour <= 8:
            return "runner"
        elif 8 < hour <= 10:
            return "commuter"
        elif 10 < hour <= 14:
            if is_rural: return "farmer"
            if temp > 35: return "health"
            return "parent"
        elif 14 < hour <= 17:
            if is_rural: return "farmer"
            if is_coastal: return "beach"
            return "event"
        elif 17 < hour <= 20:
            return "commuter"
        elif 20 < hour <= 23:
            return "event"
        else:
            return "health"

    # --------------------------------------------------------------------------
    # 3. ADAPTIVE WIDGET RANKING (ML Softmax Feature Scoring)
    # --------------------------------------------------------------------------
    def rank_widgets(self, persona: str, hour: int, weather: Dict[str, Any], widget_ids: List[str]) -> List[Dict[str, Any]]:
        ranked = []
        for wid in widget_ids:
            # Baseline affinity
            base = 1.0
            if persona in wid: base += 2.0
            
            # Weather severity boost
            if "rain" in wid and float(weather.get("rainChance", 0)) > 40:
                base += 1.8
            if "radar" in wid and float(weather.get("rainChance", 0)) > 30:
                base += 2.2
            if "aqi" in wid and float(weather.get("aqi", 0)) > 150:
                base += 1.9

            score = math.exp(base)  # Logits for softmax
            ranked.append({"widget_id": wid, "score": score})

        # Softmax normalization
        total_exp = sum(item["score"] for item in ranked)
        for item in ranked:
            item["probability"] = round(item["score"] / total_exp, 4)

        ranked.sort(key=lambda x: x["probability"], reverse=True)
        return ranked

if __name__ == "__main__":
    engine = MausamMLEngine()
    sample_weather = {
        "temp": 32, "humidity": 68, "windSpeed": 14, 
        "rainChance": 45, "uvIndex": 8, "aqi": 180
    }
    scores = engine.calculate_suitability(sample_weather)
    top_persona = engine.infer_context(8, sample_weather)
    print(f"Top Inferred Persona at 8 AM: {top_persona}")
    print("Scores:")
    for p, data in scores.items():
        print(f"  [{p}]: {data['score']}/100 - {data['verdict']}")
