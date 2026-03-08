// src/components/food-scanner/FoodDetail.js
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const C = {
  bg: '#0F0B1E', card: '#161230', border: '#1E1A35',
  purple: '#7C5CFC', lime: '#C8F135', accent: '#9D85F5',
  text: '#FFFFFF', sub: '#6B5F8A',
};

const FOODS = [
  { id: 'chicken_breast', name: 'Chicken Breast', category: 'Protein', cal: 165, p: 31, c: 0, f: 3.6, serving: 100, unit: 'g' },
  { id: 'salmon', name: 'Salmon', category: 'Protein', cal: 208, p: 20, c: 0, f: 13, serving: 100, unit: 'g' },
  { id: 'eggs', name: 'Eggs (whole)', category: 'Protein', cal: 155, p: 13, c: 1, f: 11, serving: 100, unit: 'g' },
  { id: 'tuna', name: 'Tuna (canned)', category: 'Protein', cal: 116, p: 26, c: 0, f: 1, serving: 100, unit: 'g' },
  { id: 'greek_yogurt', name: 'Greek Yogurt', category: 'Dairy', cal: 59, p: 10, c: 3, f: 0.4, serving: 150, unit: 'g' },
  { id: 'milk', name: 'Whole Milk', category: 'Dairy', cal: 61, p: 3, c: 4.8, f: 3.3, serving: 250, unit: 'ml' },
  { id: 'cheese', name: 'Cheddar Cheese', category: 'Dairy', cal: 402, p: 25, c: 1.3, f: 33, serving: 30, unit: 'g' },
  { id: 'rice', name: 'White Rice', category: 'Carbs', cal: 130, p: 2.7, c: 28, f: 0.3, serving: 100, unit: 'g' },
  { id: 'oats', name: 'Oats', category: 'Carbs', cal: 389, p: 17, c: 66, f: 7, serving: 80, unit: 'g' },
  { id: 'bread', name: 'Whole Wheat Bread', category: 'Carbs', cal: 247, p: 13, c: 41, f: 4, serving: 60, unit: 'g' },
  { id: 'pasta', name: 'Pasta (cooked)', category: 'Carbs', cal: 131, p: 5, c: 25, f: 1.1, serving: 180, unit: 'g' },
  { id: 'sweet_potato', name: 'Sweet Potato', category: 'Carbs', cal: 86, p: 1.6, c: 20, f: 0.1, serving: 150, unit: 'g' },
  { id: 'banana', name: 'Banana', category: 'Fruit', cal: 89, p: 1.1, c: 23, f: 0.3, serving: 120, unit: 'g' },
  { id: 'apple', name: 'Apple', category: 'Fruit', cal: 52, p: 0.3, c: 14, f: 0.2, serving: 180, unit: 'g' },
  { id: 'berries', name: 'Mixed Berries', category: 'Fruit', cal: 57, p: 0.7, c: 14, f: 0.3, serving: 150, unit: 'g' },
  { id: 'broccoli', name: 'Broccoli', category: 'Veg', cal: 34, p: 2.8, c: 6.6, f: 0.4, serving: 200, unit: 'g' },
  { id: 'spinach', name: 'Spinach', category: 'Veg', cal: 23, p: 2.9, c: 3.6, f: 0.4, serving: 100, unit: 'g' },
  { id: 'avocado', name: 'Avocado', category: 'Fats', cal: 160, p: 2, c: 9, f: 15, serving: 100, unit: 'g' },
  { id: 'olive_oil', name: 'Olive Oil', category: 'Fats', cal: 884, p: 0, c: 0, f: 100, serving: 10, unit: 'ml' },
  { id: 'almonds', name: 'Almonds', category: 'Snack', cal: 579, p: 21, c: 22, f: 50, serving: 30, unit: 'g' },
  { id: 'protein_bar', name: 'Protein Bar', category: 'Snack', cal: 200, p: 20, c: 22, f: 7, serving: 60, unit: 'g' },
  { id: 'whey_protein', name: 'Whey Protein', category: 'Protein', cal: 120, p: 24, c: 3, f: 2, serving: 30, unit: 'g' },
];

export default function FoodDetail({ foodId, onAdd, onClose }) {
  const food = FOODS.find(f => f.id === foodId);
  const [qty, setQty] = useState(food?.serving || 100);

  if (!food) return null;

  const isWeight = food.unit === 'g' || food.unit === 'ml';
  const ratio = qty / (isWeight ? 100 : 1);
  const cal = Math.round(food.cal * ratio);
  const protein = Math.round(food.p * ratio * 10) / 10;
  const carbs = Math.round(food.c * ratio * 10) / 10;
  const fat = Math.round(food.f * ratio * 10) / 10;

  const QUICK_QTYS = isWeight ? [50, 100, 150, 200, 250, 300] : [1, 2, 3];
  const step = isWeight ? 25 : 1;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>{food.name}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.calCard}>
          <Text style={s.calNum}>{cal}</Text>
          <Text style={s.calUnit}>kcal per {qty}{food.unit}</Text>
          <Text style={s.calCategory}>{food.category}</Text>
        </View>

        <View style={s.macroRow}>
          {[
            { label: 'Protein', val: protein, color: C.purple },
            { label: 'Carbs', val: carbs, color: C.accent },
            { label: 'Fat', val: fat, color: C.lime },
          ].map((m, i) => (
            <View key={i} style={s.macroBox}>
              <Text style={[s.macroVal, { color: m.color }]}>{m.val}g</Text>
              <Text style={s.macroLbl}>{m.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.refCard}>
          <Text style={s.refTitle}>Per 100{food.unit === 'ml' ? 'ml' : 'g'}</Text>
          {[
            { label: 'Calories', val: `${food.cal} kcal` },
            { label: 'Protein', val: `${food.p}g` },
            { label: 'Carbs', val: `${food.c}g` },
            { label: 'Fat', val: `${food.f}g` },
          ].map((r, i) => (
            <View key={i} style={[s.refRow, i < 3 && s.refRowBorder]}>
              <Text style={s.refLabel}>{r.label}</Text>
              <Text style={s.refVal}>{r.val}</Text>
            </View>
          ))}
        </View>

        <View style={s.qtyCard}>
          <Text style={s.qtyTitle}>Portion Size</Text>
          <View style={s.qtyControl}>
            <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(p => Math.max(step, p - step))}>
              <Text style={s.qtyBtnTxt}>−</Text>
            </TouchableOpacity>
            <Text style={s.qtyNum}>{qty}<Text style={s.qtyUnitTxt}>{food.unit}</Text></Text>
            <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(p => p + step)}>
              <Text style={s.qtyBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.quickQtyRow}>
              {QUICK_QTYS.map(q => (
                <TouchableOpacity
                  key={q}
                  style={[s.quickQtyChip, qty === q && s.quickQtyChipActive]}
                  onPress={() => setQty(q)}
                >
                  <Text style={[s.quickQtyTxt, qty === q && s.quickQtyTxtActive]}>
                    {q}{food.unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity style={s.addBtn} onPress={() => onAdd?.({ food, qty })}>
          <Text style={s.addBtnTxt}>Add to Meal — {cal} kcal</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  closeTxt: { color: C.accent, fontSize: 14, fontWeight: '600' },
  title: { color: C.text, fontSize: 17, fontWeight: '800' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 },

  calCard: { backgroundColor: C.card, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: C.border },
  calNum: { color: C.text, fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  calUnit: { color: C.sub, fontSize: 14, marginTop: 4 },
  calCategory: { backgroundColor: C.purple + '25', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 10, color: C.text, fontSize: 12 },

  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  macroBox: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  macroVal: { fontSize: 20, fontWeight: '900' },
  macroLbl: { color: C.sub, fontSize: 11, marginTop: 4 },

  refCard: { backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  refTitle: { color: C.sub, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  refRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  refLabel: { color: C.sub, fontSize: 13 },
  refVal: { color: C.text, fontSize: 13, fontWeight: '600' },

  qtyCard: { backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  qtyTitle: { color: C.sub, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16 },
  qtyBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnTxt: { color: C.accent, fontSize: 24, fontWeight: '800' },
  qtyNum: { color: C.text, fontSize: 32, fontWeight: '900', minWidth: 80, textAlign: 'center' },
  qtyUnitTxt: { color: C.sub, fontSize: 16, fontWeight: '400' },
  quickQtyRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  quickQtyChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.border, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  quickQtyChipActive: { backgroundColor: C.purple, borderColor: C.purple },
  quickQtyTxt: { color: C.sub, fontSize: 13, fontWeight: '600' },
  quickQtyTxtActive: { color: '#fff' },

  addBtn: { backgroundColor: C.purple, borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  addBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});