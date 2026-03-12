import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function StatCard({
  // New lightweight API (used by Food Scanner)
  label,
  sub,
  color,
  style,

  // Legacy API
  title,
  value,
  unit,
  icon,
  gradient,
  percentage,
}) {
  // If no `gradient` is provided, render the lightweight card variant.
  if (!gradient) {
    return (
      <View style={[mini.card, style, { borderColor: (color || "#7C5CFC") + "33" }]}>
        <View style={mini.top}>
          {!!icon && <Text style={[mini.emoji, { color: color || "#7C5CFC" }]}>{icon}</Text>}
          <Text style={mini.label}>{label}</Text>
        </View>
        <Text style={[mini.value, { color: color || "#fff" }]} numberOfLines={1}>
          {value}
        </Text>
        {!!sub && <Text style={mini.sub}>{sub}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={24} color="white" />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>

        {percentage !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${percentage}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{percentage}% of goal</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 5,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    opacity: 0.95,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 15,
  },
  value: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginRight: 8,
  },
  unit: {
    fontSize: 18,
    color: "white",
    opacity: 0.8,
  },
  progressContainer: {
    marginTop: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
    fontWeight: "500",
  },
});

const mini = StyleSheet.create({
  card: {
    backgroundColor: "#161230",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  emoji: { fontSize: 14, fontWeight: "900" },
  label: { flex: 1, color: "#6B5F8A", fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  value: { color: "#fff", fontSize: 18, fontWeight: "900" },
  sub: { marginTop: 2, color: "#9D85F5", fontSize: 11, fontWeight: "700" },
});
