/**
 * components/FoodScanner/FoodResultSheet.js
 * Uses existing MacroBar, RingProgress, StatCard components.
 * Matches BodyQ color system: #0F0B1E / #7C5CFC / #C8F135
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MacroBar from "../MacroBar";

const C = {
  bg: "#0F0B1E",
  card: "#161230",
  border: "#1E1A35",
  purple: "#7C5CFC",
  lime: "#C8F135",
  accent: "#9D85F5",
  text: "#FFFFFF",
  sub: "#6B5F8A",
  green: "#34C759",
  red: "#FF3B30",
};

const MEAL_OPTIONS = [
  { id: "breakfast", label: "Breakfast", icon: "☀️" },
  { id: "lunch", label: "Lunch", icon: "🌤️" },
  { id: "dinner", label: "Dinner", icon: "🌙" },
  { id: "snack", label: "Snack", icon: "🍎" },
];

function SuggRow({ text, delay }) {
  const ty = useRef(new Animated.Value(14)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(ty, {
        toValue: 0,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(op, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, op, ty]);

  return (
    <Animated.View
      style={[s.suggRow, { transform: [{ translateY: ty }], opacity: op }]}
    >
      <View style={s.suggDot} />
      <Text style={s.suggTxt}>{text}</Text>
    </Animated.View>
  );
}

export default function FoodResultSheet({ result = {}, onLog, onDismiss }) {
  const [logged, setLogged] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("snack");
  const logScale = useRef(new Animated.Value(1)).current;

  const {
    name = "Unknown food",
    brand = "",
    calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0,
    fiber = 0,
    servingSize = 100,
    servingUnit = "g",
    healthScore = 50,
    suggestions = [],
    confidence = 0.9,
    source = "barcode",
    goalType = "general_health",
    goalCalories = 2000,
    goalProtein = 150,
    goalCarbs = 250,
    goalFat = 65,
    currentCalories = 0,
    currentProtein = 0,
    currentCarbs = 0,
    currentFat = 0,
  } = result;

  const calAfter = currentCalories + calories;
  const over = calAfter > goalCalories;
  const remaining = goalCalories - calAfter;
  const scoreColor = healthScore > 70 ? C.green : healthScore > 45 ? C.lime : C.red;

  const confidencePct = Math.round(
    Math.max(0, Math.min(1, confidence || 0)) * 100,
  );

  function goalFitLabel() {
    const highProtein = protein >= 20;
    const highFat = fat >= 18;
    const highCarb = carbs >= 40;
    const mediumCal = calories >= 250 && calories <= 500;
    const lowCal = calories < 250;

    if (goalType === "lose_fat") {
      if (lowCal && highProtein && !highFat)
        return "Great for fat loss (high protein, lighter calories).";
      if (highFat || calories > 550)
        return "Heavier choice — enjoy occasionally if you’re cutting.";
      return "Fine in moderation — balance it with lighter meals.";
    }

    if (goalType === "gain_muscle") {
      if (highProtein && (mediumCal || calories > 400))
        return "Solid for muscle gain and recovery.";
      if (!highProtein)
        return "Add a lean protein source to better support muscle gain.";
      return "Good fuel — pair with carbs around your workouts.";
    }

    if (highProtein && !highFat && !highCarb)
      return "Balanced option for everyday health.";
    if (highCarb && !highFat)
      return "Carb-focused — ideal around training or active days.";
    if (highFat && calories > 450)
      return "Energy-dense — keep portions mindful for balance.";
    return "Reasonable choice — keep an eye on total daily calories.";
  }

  const fitText = goalFitLabel();

  const onLogPress = () => {
    Animated.sequence([
      Animated.spring(logScale, { toValue: 0.93, useNativeDriver: true }),
      Animated.spring(logScale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => {
      setLogged(true);
      onLog && onLog(selectedMeal);
    });
  };

  return (
    <View style={s.sheet}>
      <View style={s.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.foodName} numberOfLines={2}>
            {name}
          </Text>
          {!!brand && <Text style={s.brand}>{brand}</Text>}
          <View style={s.servingRow}>
            <Ionicons name="restaurant-outline" size={12} color={C.accent} />
            <Text style={s.servingTxt}>
              {servingSize}
              {servingUnit} per serving
            </Text>
          </View>
        </View>
        <View style={s.scoreColumn}>
          <View style={[s.scoreBadge, { borderColor: scoreColor }]}>
            <Text style={[s.scoreNum, { color: scoreColor }]}>{healthScore}</Text>
            <Text style={s.scoreLabel}>score</Text>
          </View>
          <View style={s.metaPills}>
            <View style={s.metaPill}>
              <Text style={s.metaPillTxt}>
                {source === "photo_ai" || source === "demo"
                  ? "AI vision"
                  : source === "estimate"
                    ? "Estimated"
                    : "Barcode DB"}
              </Text>
            </View>
            <View style={s.metaPill}>
              <Text style={s.metaPillTxt}>{confidencePct}% match</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={s.simpleCalCard}>
        <Text style={s.sectionHead}>Calories</Text>
        <View style={s.simpleRow}>
          <Text style={s.simpleLabel}>This food</Text>
          <Text style={s.simpleValue}>{calories} kcal</Text>
        </View>
        <View style={s.simpleRow}>
          <Text style={s.simpleLabel}>After logging</Text>
          <Text style={s.simpleValue}>{calAfter} kcal today</Text>
        </View>
        <View style={s.simpleRow}>
          <Text style={s.simpleLabel}>
            {over ? "Above daily target" : "Left to daily target"}
          </Text>
          <Text
            style={[
              s.simpleValue,
              { color: over ? C.red : C.lime, fontWeight: "800" },
            ]}
          >
            {Math.abs(remaining)} kcal
          </Text>
        </View>
      </View>

      <Text style={s.sectionHead}>Macros today</Text>
      <View style={s.macroWrap}>
        <MacroBar
          label="Protein"
          eaten={currentProtein + protein}
          goal={goalProtein}
          color={C.purple}
        />
        <MacroBar
          label="Carbs"
          eaten={currentCarbs + carbs}
          goal={goalCarbs}
          color={C.accent}
        />
        <MacroBar label="Fat" eaten={currentFat + fat} goal={goalFat} color={C.lime} />
        {fiber > 0 && <MacroBar label="Fiber" eaten={fiber} goal={30} color={C.green} />}
      </View>

      {!!fitText && (
        <View style={s.goalFitCard}>
          <Text style={s.goalFitTitle}>Fit for your goal</Text>
          <Text style={s.goalFitText}>{fitText}</Text>
        </View>
      )}

      <Text style={s.sectionHead}>Per serving</Text>
      <View style={s.servingRowSimple}>
        <View style={s.servingCol}>
          <Text style={s.servingLabel}>Protein</Text>
          <Text style={[s.servingVal, { color: C.purple }]}>{protein} g</Text>
        </View>
        <View style={s.servingCol}>
          <Text style={s.servingLabel}>Carbs</Text>
          <Text style={[s.servingVal, { color: C.accent }]}>{carbs} g</Text>
        </View>
        <View style={s.servingCol}>
          <Text style={s.servingLabel}>Fat</Text>
          <Text style={[s.servingVal, { color: C.lime }]}>{fat} g</Text>
        </View>
      </View>

      <Text style={s.sectionHead}>Log to meal</Text>
      <View style={s.mealPicker}>
        {MEAL_OPTIONS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[s.mealChip, selectedMeal === m.id && s.mealChipActive]}
            onPress={() => setSelectedMeal(m.id)}
          >
            <Text style={s.mealChipIcon}>{m.icon}</Text>
            <Text
              style={[
                s.mealChipTxt,
                selectedMeal === m.id && s.mealChipTxtActive,
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {suggestions.length > 0 && (
        <>
          <View style={s.suggHeader}>
            <Text style={{ fontSize: 14 }}>🤖</Text>
            <Text style={s.sectionHead}>AI Suggestions</Text>
          </View>
          {suggestions.map((sug, i) => (
            <SuggRow key={i} text={sug} delay={i * 80} />
          ))}
        </>
      )}

      <Animated.View style={{ transform: [{ scale: logScale }], marginTop: 24 }}>
        <TouchableOpacity
          onPress={onLogPress}
          disabled={logged}
          activeOpacity={0.85}
          style={[
            s.logBtn,
            logged && { backgroundColor: "transparent", borderColor: C.lime },
          ]}
        >
          <Ionicons
            name={logged ? "checkmark-circle" : "add-circle-outline"}
            size={19}
            color={logged ? C.lime : "#fff"}
          />
          <Text style={[s.logTxt, { color: logged ? C.lime : "#fff" }]}>
            {logged
              ? "Added to diary!"
              : `Log to ${
                  MEAL_OPTIONS.find((m) => m.id === selectedMeal)?.label
                }`}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity onPress={onDismiss} style={s.scanAgain}>
        <Text style={s.scanAgainTxt}>Scan another item</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: { paddingHorizontal: 20, paddingTop: 8 },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 20,
  },
  foodName: {
    color: C.text,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  brand: { color: C.accent, fontSize: 12, marginTop: 3 },
  servingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  servingTxt: { color: C.sub, fontSize: 11 },
  scoreBadge: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: { fontSize: 18, fontWeight: "900" },
  scoreLabel: { color: C.sub, fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  scoreColumn: { alignItems: "center", gap: 6 },
  calorieRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  ringCal: { color: C.text, fontSize: 18, fontWeight: "900", lineHeight: 20 },
  ringUnit: { color: C.sub, fontSize: 10, fontWeight: "600" },
  sectionHead: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  macroWrap: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  servingGrid: { flexDirection: "row", gap: 8, marginBottom: 20 },
  mealPicker: { flexDirection: "row", gap: 8, marginBottom: 20 },
  mealChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  mealChipActive: { backgroundColor: C.purple, borderColor: C.purple },
  mealChipIcon: { fontSize: 16, marginBottom: 3 },
  mealChipTxt: { color: C.sub, fontSize: 10, fontWeight: "600" },
  mealChipTxtActive: { color: "#fff" },
  metaPills: { flexDirection: "row", gap: 6 },
  metaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#211C3D",
    borderWidth: 1,
    borderColor: "#3A315F",
  },
  metaPillTxt: { color: C.sub, fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  suggHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  suggRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 13,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: C.purple + "22",
  },
  suggDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.purple, marginTop: 5 },
  suggTxt: { color: C.accent, fontSize: 13, lineHeight: 20, flex: 1 },
  logBtn: {
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  logTxt: { fontSize: 15, fontWeight: "800" },
  scanAgain: { alignItems: "center", paddingVertical: 16 },
  scanAgainTxt: { color: C.sub, fontSize: 13, fontWeight: "600" },
  goalFitCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 18,
  },
  goalFitTitle: {
    color: C.sub,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  goalFitText: { color: C.accent, fontSize: 13, lineHeight: 20 },
});

