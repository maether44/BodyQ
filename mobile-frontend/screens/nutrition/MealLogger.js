import { useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FOODS, SAVED_MEALS, calcMealNutrition } from "../../data/mockFoods";

const CATEGORIES = [
  "All",
  "Protein",
  "Carbs",
  "Fats",
  "Veg",
  "Fruit",
  "Dairy",
  "Snack",
];

export default function MealLogger({ route, navigation }) {
  const { mealSlot = { label: "Lunch", icon: "☀️" }, initialTab = "search" } =
    route?.params || {};
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [added, setAdded] = useState([]); // { food, qty }
  const [tab, setTab] = useState(initialTab); // search | saved | added

  const filtered = useMemo(() => {
    return FOODS.filter((f) => {
      const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || f.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  const addFood = (food) => {
    setAdded((prev) => {
      const existing = prev.find((a) => a.food.id === food.id);
      if (existing) return prev;
      return [...prev, { food, qty: food.serving }];
    });
  };

  const removeFood = (id) =>
    setAdded((prev) => prev.filter((a) => a.food.id !== id));

  const updateQty = (id, qty) => {
    setAdded((prev) =>
      prev.map((a) => (a.food.id === id ? { ...a, qty: Math.max(1, qty) } : a)),
    );
  };

  const totals = calcMealNutrition(
    added.map((a) => ({ foodId: a.food.id, qty: a.qty })),
  );

  const addSavedMeal = (meal) => {
    meal.items.forEach((item) => {
      const food = FOODS.find((f) => f.id === item.foodId);
      if (food) addFood(food);
    });
    setTab("added");
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
        >
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {mealSlot.icon} {mealSlot.label}
        </Text>
        {added.length > 0 && (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => {
              // TODO: Save meal data
              navigation.goBack();
            }}
          >
            <Text style={styles.saveTxt}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Totals bar */}
      {added.length > 0 && (
        <View style={styles.totalsBar}>
          <View style={styles.totalItem}>
            <Text style={styles.totalVal}>{totals.cal}</Text>
            <Text style={styles.totalLbl}>kcal</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalVal}>{totals.p}g</Text>
            <Text style={styles.totalLbl}>protein</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalVal}>{totals.c}g</Text>
            <Text style={styles.totalLbl}>carbs</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalVal}>{totals.f}g</Text>
            <Text style={styles.totalLbl}>fat</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: "search", label: "🔍 Search" },
          { id: "saved", label: "⭐ Saved Meals" },
          {
            id: "added",
            label: `🛒 Added${added.length > 0 ? ` (${added.length})` : ""}`,
          },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabTxt, tab === t.id && styles.tabTxtActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SEARCH TAB ── */}
      {tab === "search" && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search food..."
              placeholderTextColor="#3D3460"
              autoFocus={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Text style={styles.clearTxt}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={styles.catRow}
          >
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.catChip, category === c && styles.catChipActive]}
                onPress={() => setCategory(c)}
              >
                <Text
                  style={[styles.catTxt, category === c && styles.catTxtActive]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Food list */}
          <FlatList
            data={filtered}
            keyExtractor={(f) => f.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            renderItem={({ item: food }) => {
              const isAdded = added.some((a) => a.food.id === food.id);
              const kcal = Math.round((food.cal * food.serving) / 100);
              return (
                <View style={[styles.foodRow, isAdded && styles.foodRowAdded]}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodMeta}>
                      {food.serving}
                      {food.unit} · {food.p}g P · {food.c}g C · {food.f}g F
                    </Text>
                  </View>
                  <Text style={styles.foodCal}>{kcal} kcal</Text>
                  <TouchableOpacity
                    style={[styles.addBtn, isAdded && styles.addBtnDone]}
                    onPress={() =>
                      isAdded ? removeFood(food.id) : addFood(food)
                    }
                  >
                    <Text
                      style={[
                        styles.addBtnTxt,
                        isAdded && styles.addBtnTxtDone,
                      ]}
                    >
                      {isAdded ? "✓" : "+"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* ── SAVED MEALS TAB ── */}
      {tab === "saved" && (
        <ScrollView contentContainerStyle={styles.savedScroll}>
          {SAVED_MEALS.map((meal) => {
            const nutrition = calcMealNutrition(meal.items);
            return (
              <View key={meal.id} style={styles.savedMealCard}>
                <View style={styles.savedMealTop}>
                  <Text style={styles.savedMealName}>{meal.name}</Text>
                  <TouchableOpacity
                    style={styles.addAllBtn}
                    onPress={() => addSavedMeal(meal)}
                  >
                    <Text style={styles.addAllTxt}>Add All</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.savedMealMacros}>
                  {nutrition.cal} kcal · {nutrition.p}g protein · {nutrition.c}g
                  carbs
                </Text>
                {meal.items.map((item, i) => {
                  const food = FOODS.find((f) => f.id === item.foodId);
                  return food ? (
                    <Text key={i} style={styles.savedMealItem}>
                      • {food.name} ({item.qty}
                      {food.unit})
                    </Text>
                  ) : null;
                })}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── ADDED TAB ── */}
      {tab === "added" && (
        <ScrollView contentContainerStyle={styles.addedScroll}>
          {added.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTxt}>No food added yet</Text>
              <Text style={styles.emptySub}>Search or pick a saved meal</Text>
            </View>
          ) : (
            added.map(({ food, qty }) => {
              const kcal = Math.round((food.cal * qty) / 100);
              return (
                <View key={food.id} style={styles.addedRow}>
                  <View style={styles.addedInfo}>
                    <Text style={styles.addedName}>{food.name}</Text>
                    <Text style={styles.addedCal}>{kcal} kcal</Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        updateQty(
                          food.id,
                          qty -
                            (food.unit === "g" || food.unit === "ml" ? 25 : 1),
                        )
                      }
                    >
                      <Text style={styles.qtyBtnTxt}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>
                      {qty}
                      {food.unit}
                    </Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        updateQty(
                          food.id,
                          qty +
                            (food.unit === "g" || food.unit === "ml" ? 25 : 1),
                        )
                      }
                    >
                      <Text style={styles.qtyBtnTxt}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFood(food.id)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeTxt}>🗑</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          {added.length > 0 && (
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => {
                // TODO: Save meal data
                navigation.goBack();
              }}
            >
              <Text style={styles.confirmTxt}>
                Save {mealSlot.label} — {totals.cal} kcal
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
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
  accent: "#9D85F5",
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  closeBtn: { padding: 4, marginRight: 12 },
  closeTxt: { color: C.sub, fontSize: 16 },
  title: { color: C.text, fontSize: 18, fontWeight: "800", flex: 1 },
  saveBtn: {
    backgroundColor: C.purple,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveTxt: { color: "#fff", fontSize: 13, fontWeight: "700" },

  totalsBar: {
    flexDirection: "row",
    backgroundColor: C.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  totalItem: { flex: 1, alignItems: "center" },
  totalVal: { color: C.text, fontSize: 16, fontWeight: "800" },
  totalLbl: { color: C.sub, fontSize: 10 },
  totalDivider: { width: 1, backgroundColor: C.border },

  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.purple },
  tabTxt: { color: C.sub, fontSize: 12, fontWeight: "600" },
  tabTxtActive: { color: C.text, fontWeight: "700" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    margin: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: C.text, fontSize: 15 },
  clearTxt: { color: C.sub, fontSize: 14 },

  catScroll: { marginBottom: 8 },
  catRow: { paddingHorizontal: 16, gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  catChipActive: { backgroundColor: C.purple, borderColor: C.purple },
  catTxt: { color: C.sub, fontSize: 12, fontWeight: "600" },
  catTxtActive: { color: "#fff" },

  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  foodRowAdded: {
    borderColor: C.purple + "60",
    backgroundColor: C.purple + "08",
  },
  foodInfo: { flex: 1 },
  foodName: { color: C.text, fontSize: 14, fontWeight: "600" },
  foodMeta: { color: C.sub, fontSize: 11, marginTop: 2 },
  foodCal: { color: C.accent, fontSize: 13, fontWeight: "700" },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDone: { backgroundColor: "#34C759" },
  addBtnTxt: { color: "#fff", fontSize: 18, fontWeight: "800", lineHeight: 20 },
  addBtnTxtDone: { fontSize: 14 },

  savedScroll: { padding: 16 },
  savedMealCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  savedMealTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  savedMealName: { color: C.text, fontSize: 15, fontWeight: "700" },
  addAllBtn: {
    backgroundColor: C.purple,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addAllTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  savedMealMacros: { color: C.accent, fontSize: 12, marginBottom: 10 },
  savedMealItem: { color: C.sub, fontSize: 12, marginTop: 3 },

  addedScroll: { padding: 16 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { color: C.text, fontSize: 17, fontWeight: "700" },
  emptySub: { color: C.sub, fontSize: 13, marginTop: 4 },

  addedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  addedInfo: { flex: 1 },
  addedName: { color: C.text, fontSize: 14, fontWeight: "600" },
  addedCal: { color: C.sub, fontSize: 11, marginTop: 2 },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnTxt: { color: C.accent, fontSize: 16, fontWeight: "800" },
  qtyVal: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 42,
    textAlign: "center",
  },
  removeBtn: { padding: 4 },
  removeTxt: { fontSize: 16 },

  confirmBtn: {
    backgroundColor: C.purple,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 16,
  },
  confirmTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
