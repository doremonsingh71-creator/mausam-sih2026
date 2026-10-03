-- Seed Data: IMD Doppler Weather Radar Network & Sample Bulletins

INSERT INTO radar_stations (station_id, name, state, latitude, longitude, radar_band, range_km, status)
VALUES
('DWR_DELHI', 'Delhi (Safdarjung)', 'Delhi', 28.5892, 77.2223, 'S-Band', 250, 'OPERATIONAL'),
('DWR_MUMBAI', 'Mumbai (Colaba)', 'Maharashtra', 18.9067, 72.8147, 'S-Band', 250, 'OPERATIONAL'),
('DWR_KOLKATA', 'Kolkata (Alipore)', 'West Bengal', 22.5333, 88.3283, 'S-Band', 250, 'OPERATIONAL'),
('DWR_CHENNAI', 'Chennai (Port)', 'Tamil Nadu', 13.0827, 80.2933, 'S-Band', 250, 'OPERATIONAL'),
('DWR_BENGALURU', 'Bengaluru (GKVK)', 'Karnataka', 13.0768, 77.5753, 'C-Band', 250, 'OPERATIONAL'),
('DWR_SHIMLA', 'Shimla (Kufri)', 'Himachal Pradesh', 31.0979, 77.2678, 'X-Band', 100, 'OPERATIONAL'),
('DWR_LUDHIANA', 'Ludhiana (PAU Campus)', 'Punjab', 30.9010, 75.8573, 'C-Band', 250, 'OPERATIONAL'),
('DWR_PATNA', 'Patna (Bariatu)', 'Bihar', 25.5941, 85.1376, 'C-Band', 250, 'OPERATIONAL'),
('DWR_HYDERABAD', 'Hyderabad (Begumpet)', 'Telangana', 17.4475, 78.4719, 'S-Band', 250, 'OPERATIONAL'),
('DWR_KOCHI', 'Kochi (Naval Base)', 'Kerala', 9.9312, 76.2673, 'S-Band', 250, 'OPERATIONAL')
ON CONFLICT (station_id) DO NOTHING;

INSERT INTO imd_alerts (severity, event_type, headline, description, affected_pincodes, target_personas, fcm_priority, valid_to)
VALUES
('ORANGE', 'Thunderstorm with Gusty Winds', 'Nowcast Warning for Delhi-NCR: Gusty winds (45-55 km/h) & Moderate Rain', 'Active convective storm cell tracking NE from Rewari. Commuters should expect waterlogging on low-lying arterial routes and avoid parking under weak trees.', '{"110001", "110021", "201301", "122001"}', '{"commuter", "event", "parent"}', 'HIGH', NOW() + INTERVAL '3 hours'),
('YELLOW', 'Agromet Spraying Advisory', 'Punjab & Haryana: Postpone pesticide application due to approaching rain band', 'Doppler Radar Ludhiana shows isolated rain echoes at 60 km radius. Postpone urea top-dressing and chemical sprays for next 12 hours.', '{"141001", "141002"}', '{"farmer"}', 'NORMAL', NOW() + INTERVAL '12 hours');
