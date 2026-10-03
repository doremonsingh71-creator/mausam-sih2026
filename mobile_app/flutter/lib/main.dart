// ==============================================================================
// MAUSAM FLUTTER APP - MOBILE CLIENT IMPLEMENTATION
// Smart India Hackathon 2026 - Problem Statement SIH26076
// Widget-Based Adaptive Architecture
// ==============================================================================

import 'package:flutter/material.dart';

void main() {
  runApp(const MausamApp());
}

class MausamApp extends StatelessWidget {
  const MausamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mausam - Persona Weather',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
        fontFamily: 'Plus Jakarta Sans',
      ),
      home: const MausamHomePage(),
    );
  }
}

class MausamHomePage extends StatefulWidget {
  const MausamHomePage({super.key});

  @override
  State<MausamHomePage> createState() => _MausamHomePageState();
}

class _MausamHomePageState extends State<MausamHomePage> {
  String _activePersona = 'runner';
  int _suitabilityScore = 84;

  final List<Map<String, dynamic>> _personas = [
    {'id': 'runner', 'name': 'Runner', 'icon': Icons.directions_run, 'color': Color(0xFFFF6B35)},
    {'id': 'farmer', 'name': 'Agromet', 'icon': Icons.agriculture, 'color': Color(0xFF10B981)},
    {'id': 'commuter', 'name': 'Commuter', 'icon': Icons.directions_car, 'color': Color(0xFF7209B7)},
    {'id': 'beach', 'name': 'Coast/Tides', 'icon': Icons.beach_access, 'color': Color(0xFF0284C7)},
    {'id': 'parent', 'name': 'Playground', 'icon': Icons.child_care, 'color': Color(0xFFF43F5E)},
    {'id': 'event', 'name': 'Event', 'icon': Icons.celebration, 'color': Color(0xFFF97316)},
    {'id': 'health', 'name': 'Asthma/AQI', 'icon': Icons.favorite, 'color': Color(0xFF2563EB)},
    {'id': 'travel', 'name': 'Traveler', 'icon': Icons.flight, 'color': Color(0xFF0D9488)},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E3A8A),
        title: Row(
          children: const [
            Icon(Icons.cloud_sync, color: Colors.white),
            SizedBox(width: 8),
            Text('मौसम Mausam (IMD)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.satellite_alt, color: Colors.white),
            onPressed: () => _openRadarModal(context),
            tooltip: 'Live Doppler Radar',
          ),
          IconButton(
            icon: const Icon(Icons.mic, color: Colors.white),
            onPressed: () => _openVoiceAssistant(context),
            tooltip: 'Mausam Bol Voice',
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Persona Selector Strip
            Container(
              height: 52,
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _personas.length,
                itemBuilder: (context, index) {
                  final p = _personas[index];
                  final isSelected = p['id'] == _activePersona;
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: FilterChip(
                      selected: isSelected,
                      label: Text(p['name']),
                      avatar: Icon(p['icon'], size: 16, color: isSelected ? Colors.white : p['color']),
                      backgroundColor: Colors.white,
                      selectedColor: p['color'],
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : Colors.black87,
                        fontWeight: FontWeight.bold,
                      ),
                      onSelected: (val) {
                        setState(() {
                          _activePersona = p['id'];
                          _suitabilityScore = (val ? (70 + index * 4) % 100 : 75);
                        });
                      },
                    ),
                  );
                },
              ),
            ),
            // Hero Score Widget
            Card(
              margin: const EdgeInsets.all(12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Suitability Score', style: TextStyle(fontSize: 16, color: Colors.grey[700])),
                        Chip(
                          label: Text('$_suitabilityScore / 100', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          backgroundColor: _suitabilityScore > 75 ? Colors.green : Colors.orange,
                        )
                      ],
                    ),
                    const SizedBox(height: 12),
                    LinearProgressIndicator(
                      value: _suitabilityScore / 100.0,
                      color: Colors.green,
                      backgroundColor: Colors.grey[200],
                      minHeight: 8,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openRadarModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.75,
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('IMD Doppler Weather Radar (Leaflet/OSM)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('Real-time reflectivity and storm motion tracking across Indian stations.'),
          ],
        ),
      ),
    );
  }

  void _openVoiceAssistant(BuildContext context) {
    // Web Speech API / Native Speech-to-Text modal
  }
}
