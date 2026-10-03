/**
 * React Native Implementation: Mausam Widget-Based UI
 * Smart India Hackathon 2026 - Problem Statement SIH26076
 */

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function App(): React.JSX.Element {
  const [activePersona, setActivePersona] = useState<string>("runner");
  const [score, setScore] = useState<number>(84);

  const personas = [
    { id: "runner", name: "Runner", color: "#FF6B35" },
    { id: "farmer", name: "Agromet", color: "#10B981" },
    { id: "commuter", name: "Commuter", color: "#7209B7" },
    { id: "beach", name: "Coast/Tide", color: "#0284C7" },
    { id: "parent", name: "Playground", color: "#F43F5E" },
    { id: "health", name: "Asthma/AQI", color: "#2563EB" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>मौसम Mausam (IMD)</Text>
        <Text style={styles.headerSub}>SIH 2026 · PS-SIH26076</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Persona Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.personaStrip}>
          {personas.map((p) => {
            const active = p.id === activePersona;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.personaPill,
                  active && { backgroundColor: p.color, borderColor: p.color },
                ]}
                onPress={() => {
                  setActivePersona(p.id);
                  setScore(Math.floor(70 + Math.random() * 25));
                }}
              >
                <Text style={[styles.personaText, active && styles.personaTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Hero Suitability Card */}
        <View style={styles.heroCard}>
          <Text style={styles.cardHeader}>Compound Suitability Score</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreBig}>{score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <Text style={styles.verdictText}>
            {score >= 80 ? "Condition: Highly Favorable" : "Condition: Moderate Caution"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#1E3A8A", padding: 16 },
  headerTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold" },
  headerSub: { color: "#93C5FD", fontSize: 12 },
  content: { padding: 12 },
  personaStrip: { marginVertical: 8 },
  personaPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
  },
  personaText: { fontSize: 13, fontWeight: "600", color: "#334155" },
  personaTextActive: { color: "#FFFFFF" },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: { fontSize: 14, color: "#64748B", fontWeight: "600" },
  scoreRow: { flexDirection: "row", alignItems: "baseline", marginVertical: 6 },
  scoreBig: { fontSize: 44, fontWeight: "800", color: "#10B981" },
  scoreMax: { fontSize: 18, color: "#94A3B8", marginLeft: 4 },
  verdictText: { fontSize: 14, color: "#0F172A", fontWeight: "500" },
});
