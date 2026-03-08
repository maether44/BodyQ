import { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function StatBox({ label, value, unit, color = "#9D85F5" }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function WorkoutSummary({ route, navigation }) {
  const { result, workoutName, workout } = route.params || {};

  // Default mock result if none passed
  const R = result || {
    elapsed: 2820, // 47 min
    completedSets: 15,
    totalSets: 15,
    caloriesBurned: 390,
    newPRs: [{ exercise: "Bench Press", value: "90 kg" }],
    xpEarned: 80,
  };

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const completionPct = Math.round((R.completedSets / R.totalSets) * 100);
  const mins = Math.floor(R.elapsed / 60);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy animation */}
        <Animated.View
          style={[styles.trophyWrap, { transform: [{ scale: scaleAnim }] }]}
        >
          <Text style={styles.trophy}>🏆</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>Workout Complete!</Text>
          <Text style={styles.workoutName}>
            {workoutName || "Upper Body Strength"}
          </Text>

          {/* Main stats */}
          <View style={styles.statsRow}>
            <StatBox label="Duration" value={mins} unit="min" color="#C8F135" />
            <StatBox
              label="Calories"
              value={R.caloriesBurned}
              unit="kcal"
              color="#FF9500"
            />
            <StatBox
              label="Sets Done"
              value={`${R.completedSets}/${R.totalSets}`}
              unit="sets"
              color="#7C5CFC"
            />
          </View>

          {/* Completion ring */}
          <View style={styles.completionCard}>
            <View style={styles.completionLeft}>
              <Text style={styles.completionPct}>{completionPct}%</Text>
              <Text style={styles.completionLabel}>Completed</Text>
            </View>
            <View style={styles.completionRight}>
              <View style={styles.completionBarBg}>
                <View
                  style={[
                    styles.completionBarFill,
                    { width: `${completionPct}%` },
                  ]}
                />
              </View>
              <Text style={styles.completionNote}>
                {completionPct === 100
                  ? "Perfect session — every set done! 💪"
                  : `${R.totalSets - R.completedSets} sets skipped — still a great effort`}
              </Text>
            </View>
          </View>

          {/* XP earned */}
          <View style={styles.xpCard}>
            <Text style={styles.xpIcon}>⭐</Text>
            <View>
              <Text style={styles.xpLabel}>XP Earned</Text>
              <Text style={styles.xpValue}>+{R.xpEarned} XP</Text>
            </View>
            <Text style={styles.xpNote}>Level 12 · 420/500 XP</Text>
          </View>

          {/* New PRs */}
          {R.newPRs && R.newPRs.length > 0 && (
            <View style={styles.prsCard}>
              <Text style={styles.prsTitle}>🎉 New Personal Records</Text>
              {R.newPRs.map((pr, i) => (
                <View key={i} style={styles.prRow}>
                  <Text style={styles.prExercise}>{pr.exercise}</Text>
                  <Text style={styles.prValue}>{pr.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Yara message */}
          <View style={styles.yaraCard}>
            <View style={styles.yaraAvatar}>
              <Text>🤖</Text>
            </View>
            <Text style={styles.yaraMsg}>
              {completionPct === 100
                ? "You crushed it! Full completion is rare — you're in the top tier today. Rest up and come back strong."
                : "Great work getting it done. Consistency beats perfection — showing up is what counts most."}
            </Text>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate("MainTabs")}
          >
            <Text style={styles.homeBtnTxt}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.againBtn}
            onPress={() => {
              if (workout) {
                navigation.replace("WorkoutActive", { workout });
              }
            }}
          >
            <Text style={styles.againBtnTxt}>Repeat Workout</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const C = {
  bg: "#0F0B1E",
  card: "#181430",
  border: "#251E42",
  purple: "#7C5CFC",
  lime: "#C8F135",
  sub: "#6B5F8A",
  text: "#fff",
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: "center",
  },

  trophyWrap: { alignItems: "center", marginBottom: 20 },
  trophy: { fontSize: 72 },

  title: {
    color: C.text,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  workoutName: {
    color: C.sub,
    fontSize: 15,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  statValue: { fontSize: 26, fontWeight: "900", letterSpacing: -1 },
  statUnit: { color: C.sub, fontSize: 11, marginTop: 1 },
  statLabel: { color: C.sub, fontSize: 11, marginTop: 6 },

  completionCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: C.border,
    width: "100%",
    marginBottom: 12,
  },
  completionLeft: { alignItems: "center" },
  completionPct: { color: C.lime, fontSize: 30, fontWeight: "900" },
  completionLabel: { color: C.sub, fontSize: 11 },
  completionRight: { flex: 1 },
  completionBarBg: {
    height: 8,
    backgroundColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  completionBarFill: { height: 8, backgroundColor: C.lime, borderRadius: 4 },
  completionNote: { color: C.sub, fontSize: 12, lineHeight: 17 },

  xpCard: {
    backgroundColor: "#7C5CFC18",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#7C5CFC40",
    width: "100%",
    marginBottom: 12,
  },
  xpIcon: { fontSize: 28 },
  xpLabel: { color: C.sub, fontSize: 11 },
  xpValue: { color: C.lime, fontSize: 22, fontWeight: "900" },
  xpNote: { color: C.sub, fontSize: 12, marginLeft: "auto" },

  prsCard: {
    backgroundColor: "#C8F13518",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#C8F13540",
    width: "100%",
    marginBottom: 12,
  },
  prsTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  prExercise: { color: C.sub, fontSize: 14 },
  prValue: { color: C.lime, fontSize: 14, fontWeight: "800" },

  yaraCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    width: "100%",
    marginBottom: 24,
  },
  yaraAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  yaraMsg: { flex: 1, color: "#B0A8CC", fontSize: 13, lineHeight: 20 },

  homeBtn: {
    backgroundColor: C.purple,
    borderRadius: 16,
    paddingVertical: 17,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  homeBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
  againBtn: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingVertical: 17,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  againBtnTxt: { color: C.sub, fontSize: 15, fontWeight: "700" },
});
