-- ============================================================================
-- MAUSAM - Personalized Weather Homepage (SIH 2026 - PS-SIH26076)
-- PostgreSQL Database Schema
-- Architecture: PostgreSQL 16 + PostGIS Geolocation Extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (OTP & JWT Authenticated)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'en', -- 'en' or 'hi'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Persona Profiles & Custom Preferences
CREATE TABLE IF NOT EXISTS user_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    primary_persona VARCHAR(50) NOT NULL, -- 'runner', 'farmer', 'commuter', 'beach', 'parent', 'event', 'health', 'travel'
    secondary_personas TEXT[] DEFAULT '{}',
    home_lat NUMERIC(8, 5),
    home_lon NUMERIC(8, 5),
    home_city VARCHAR(100) DEFAULT 'New Delhi',
    commute_origin VARCHAR(100),
    commute_destination VARCHAR(100),
    crop_types TEXT[] DEFAULT '{"wheat", "mustard"}',
    health_conditions TEXT[] DEFAULT '{"asthma", "dust_allergy"}',
    notification_fcm_token VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. IMD Doppler Weather Radar (DWR) Stations Registry
CREATE TABLE IF NOT EXISTS radar_stations (
    station_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    latitude NUMERIC(8, 5) NOT NULL,
    longitude NUMERIC(8, 5) NOT NULL,
    radar_band VARCHAR(10) NOT NULL, -- 'S-Band' (coastal/heavy rain), 'C-Band' (plains), 'X-Band' (hilly)
    frequency_ghz NUMERIC(4, 2),
    range_km INTEGER DEFAULT 250,
    max_reflectivity_dbz NUMERIC(5, 2) DEFAULT 0.0,
    status VARCHAR(20) DEFAULT 'OPERATIONAL',
    last_scan_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. IMD Severe Weather Warnings & FCM Priority Alerts
CREATE TABLE IF NOT EXISTS imd_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id VARCHAR(50) REFERENCES radar_stations(station_id),
    severity VARCHAR(20) NOT NULL, -- 'RED' (take action), 'ORANGE' (be prepared), 'YELLOW' (be updated)
    event_type VARCHAR(50) NOT NULL, -- 'Thunderstorm', 'Hailstorm', 'Cloudburst', 'Heatwave', 'Cyclone'
    headline VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_pincodes TEXT[] DEFAULT '{}',
    target_personas TEXT[] DEFAULT '{"commuter", "farmer"}',
    fcm_priority VARCHAR(10) DEFAULT 'HIGH', -- 'HIGH' (P1, instant wake-up) or 'NORMAL' (P2)
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Village Offline Forecast Packs (Gram Panchayat Low-Bandwidth Mode)
CREATE TABLE IF NOT EXISTS village_offline_packs (
    pincode VARCHAR(10) PRIMARY KEY,
    village_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    agromet_gkma_bulletin TEXT,
    seven_day_forecast JSONB NOT NULL,
    pest_disease_advisory JSONB NOT NULL,
    bundle_hash VARCHAR(64) NOT NULL,
    compressed_size_bytes INTEGER,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Telemetry & User Feedback for Adaptive Widget ML Ranking
CREATE TABLE IF NOT EXISTS widget_interaction_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    persona_context VARCHAR(50) NOT NULL,
    time_of_day_bucket VARCHAR(20) NOT NULL, -- 'early_morning', 'morning_rush', 'afternoon', 'evening_commute', 'night'
    weather_severity VARCHAR(20) NOT NULL,
    widget_id VARCHAR(100) NOT NULL,
    dwell_time_seconds INTEGER DEFAULT 0,
    is_clicked BOOLEAN DEFAULT FALSE,
    ranking_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance & hyper-local spatial lookups
CREATE INDEX IF NOT EXISTS idx_radar_coords ON radar_stations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON imd_alerts(valid_to, severity);
CREATE INDEX IF NOT EXISTS idx_telemetry_widget ON widget_interaction_telemetry(persona_context, widget_id);
