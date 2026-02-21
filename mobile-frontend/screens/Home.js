import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const StatCard = ({ title, value, unit, icon, gradient, percentage }) => {
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
};

export default function DashboardScreen() {
  // Sample state - replace with actual data from your backend/API
  const [stats, setStats] = useState({
    calories: { value: 1850, goal: 2500, unit: "kcal" },
    steps: { value: 8234, goal: 10000, unit: "steps" },
    exerciseTime: { value: 45, goal: 60, unit: "min" },
  });

  const calculatePercentage = (value, goal) => {
    return Math.min(Math.round((value / goal) * 100), 100);
  };

  // TODO: Fetch real data from your backend
  useEffect(() => {
    // Example: fetchDailyStats()
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Today's Progress</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Calories Burned"
          value={stats.calories.value.toLocaleString()}
          unit={stats.calories.unit}
          icon="flame"
          gradient={["#FF6B6B", "#FF8E53"]}
          percentage={calculatePercentage(
            stats.calories.value,
            stats.calories.goal,
          )}
        />

        <StatCard
          title="Steps Taken"
          value={stats.steps.value.toLocaleString()}
          unit={stats.steps.unit}
          icon="footsteps"
          gradient={["#4ECDC4", "#44A08D"]}
          percentage={calculatePercentage(stats.steps.value, stats.steps.goal)}
        />

        <StatCard
          title="Exercise Time"
          value={stats.exerciseTime.value}
          unit={stats.exerciseTime.unit}
          icon="time"
          gradient={["#6F4BF2", "#A38DF2"]}
          percentage={calculatePercentage(
            stats.exerciseTime.value,
            stats.exerciseTime.goal,
          )}
        />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Daily Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Goal Achievement</Text>
          <Text style={styles.summaryValue}>
            {Math.round(
              (calculatePercentage(stats.calories.value, stats.calories.goal) +
                calculatePercentage(stats.steps.value, stats.steps.goal) +
                calculatePercentage(
                  stats.exerciseTime.value,
                  stats.exerciseTime.goal,
                )) /
                3,
            )}
            %
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "white",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  statsGrid: {
    padding: 15,
    gap: 15,
  },
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
  summaryCard: {
    margin: 15,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6F4BF2",
  },
});
