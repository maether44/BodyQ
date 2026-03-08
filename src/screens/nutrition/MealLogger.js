/**
 * src/screens/nutrition/MealLogger.js
 * Foods loaded from Supabase `foods` table — no mock data.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, ScrollView,
  StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../../config/supabase';

const CATEGORIES = ['All', 'Protein', 'Carbs', 'Fats', 'Veg', 'Fruit', 'Dairy', 'Snack'];

function calcTotals(added) {
  return added.reduce((acc, { food, qty }) => {
    const ratio = qty / 100;
    return {
      cal: acc.cal + Math.round((food.calories_per_100g  || 0) * ratio),
      p:   acc.p   + Math.round((food.protein_per_100g   || 0) * ratio * 10) / 10,
      c:   acc.c   + Math.round((food.carbs_per_100g     || 0) * ratio * 10) / 10,
      f:   acc.f   + Math.round((food.fat_per_100g       || 0) * ratio * 10) / 10,
    };
  }, { cal:0, p:0, c:0, f:0 });
}

export default function MealLogger({ mealSlot = { label:'Lunch', icon:'☀️' }, onSave, onClose }) {
  const [foods,    setFoods]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [added,    setAdded]    = useState([]);
  const [tab,      setTab]      = useState('search');

  // Load foods from Supabase
  useEffect(() => {
    supabase
      .from('foods')
      .select('id, name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g')
      .order('name')
      .then(({ data }) => {
        setFoods(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return foods.filter(f => {
      const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [foods, search]);

  const addFood    = (food) => setAdded(prev => prev.find(a => a.food.id === food.id) ? prev : [...prev, { food, qty: 100 }]);
  const removeFood = (id)  => setAdded(prev => prev.filter(a => a.food.id !== id));
  const updateQty  = (id, qty) => setAdded(prev => prev.map(a => a.food.id === id ? { ...a, qty: Math.max(1, qty) } : a));

  const totals = calcTotals(added);

  return (
    <View style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={s.title}>{mealSlot.icon} {mealSlot.label}</Text>
        {added.length > 0 && (
          <TouchableOpacity style={s.saveBtn} onPress={() => onSave && onSave(added, totals)}>
            <Text style={s.saveTxt}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Totals bar */}
      {added.length > 0 && (
        <View style={s.totalsBar}>
          {[
            { val: totals.cal, lbl: 'kcal' },
            { val: `${totals.p}g`, lbl: 'protein' },
            { val: `${totals.c}g`, lbl: 'carbs' },
            { val: `${totals.f}g`, lbl: 'fat' },
          ].map((item, i, arr) => (
            <View key={i} style={{ flexDirection:'row', flex:1 }}>
              <View style={s.totalItem}>
                <Text style={s.totalVal}>{item.val}</Text>
                <Text style={s.totalLbl}>{item.lbl}</Text>
              </View>
              {i < arr.length - 1 && <View style={s.totalDivider} />}
            </View>
          ))}
        </View>
      )}

      {/* Tabs */}
      <View style={s.tabs}>
        {[
          { id:'search', label:'🔍 Search' },
          { id:'added',  label:`🛒 Added${added.length > 0 ? ` (${added.length})` : ''}` },
        ].map(t => (
          <TouchableOpacity key={t.id} style={[s.tab, tab===t.id && s.tabActive]} onPress={() => setTab(t.id)}>
            <Text style={[s.tabTxt, tab===t.id && s.tabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SEARCH TAB */}
      {tab === 'search' && (
        <View style={{ flex:1 }}>
          <View style={s.searchWrap}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search food..."
              placeholderTextColor="#3D3460"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={s.clearTxt}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
              <ActivityIndicator color="#7C5CFC" />
              <Text style={{ color:'#6B5F8A', marginTop:10 }}>Loading foods…</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={f => f.id}
              contentContainerStyle={{ paddingHorizontal:16, paddingBottom:24 }}
              ListEmptyComponent={
                <View style={{ alignItems:'center', paddingTop:40 }}>
                  <Text style={{ color:'#6B5F8A', fontSize:14 }}>
                    {search ? 'No foods found' : 'No foods in database yet'}
                  </Text>
                  <Text style={{ color:'#3D3460', fontSize:12, marginTop:6 }}>
                    Foods are added when you scan with the food scanner
                  </Text>
                </View>
              }
              renderItem={({ item: food }) => {
                const isAdded = added.some(a => a.food.id === food.id);
                return (
                  <View style={[s.foodRow, isAdded && s.foodRowAdded]}>
                    <View style={s.foodInfo}>
                      <Text style={s.foodName}>{food.name}</Text>
                      <Text style={s.foodMeta}>
                        per 100g · {Math.round(food.protein_per_100g||0)}g P · {Math.round(food.carbs_per_100g||0)}g C · {Math.round(food.fat_per_100g||0)}g F
                      </Text>
                    </View>
                    <Text style={s.foodCal}>{Math.round(food.calories_per_100g||0)} kcal</Text>
                    <TouchableOpacity
                      style={[s.addBtn, isAdded && s.addBtnDone]}
                      onPress={() => isAdded ? removeFood(food.id) : addFood(food)}
                    >
                      <Text style={[s.addBtnTxt, isAdded && s.addBtnTxtDone]}>{isAdded ? '✓' : '+'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* ADDED TAB */}
      {tab === 'added' && (
        <ScrollView contentContainerStyle={s.addedScroll}>
          {added.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🍽️</Text>
              <Text style={s.emptyTxt}>No food added yet</Text>
              <Text style={s.emptySub}>Search and add foods above</Text>
            </View>
          ) : added.map(({ food, qty }) => {
            const kcal = Math.round((food.calories_per_100g || 0) * qty / 100);
            return (
              <View key={food.id} style={s.addedRow}>
                <View style={s.addedInfo}>
                  <Text style={s.addedName}>{food.name}</Text>
                  <Text style={s.addedCal}>{kcal} kcal</Text>
                </View>
                <View style={s.qtyControl}>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(food.id, qty - 25)}>
                    <Text style={s.qtyBtnTxt}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.qtyVal}>{qty}g</Text>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(food.id, qty + 25)}>
                    <Text style={s.qtyBtnTxt}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeFood(food.id)} style={s.removeBtn}>
                  <Text style={s.removeTxt}>🗑</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {added.length > 0 && (
            <TouchableOpacity style={s.confirmBtn} onPress={() => onSave && onSave(added, totals)}>
              <Text style={s.confirmTxt}>Save {mealSlot.label} — {totals.cal} kcal</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const C = { bg:'#0F0B1E', card:'#181430', border:'#251E42', purple:'#7C5CFC', sub:'#6B5F8A', text:'#fff', accent:'#9D85F5' };

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:C.bg },
  header: { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:54, paddingBottom:14, borderBottomWidth:1, borderBottomColor:C.border },
  closeBtn: { padding:4, marginRight:12 },
  closeTxt: { color:C.sub, fontSize:16 },
  title:    { color:C.text, fontSize:18, fontWeight:'800', flex:1 },
  saveBtn:  { backgroundColor:C.purple, borderRadius:10, paddingHorizontal:16, paddingVertical:8 },
  saveTxt:  { color:'#fff', fontSize:13, fontWeight:'700' },
  totalsBar:    { flexDirection:'row', backgroundColor:C.card, paddingVertical:12, paddingHorizontal:20, borderBottomWidth:1, borderBottomColor:C.border },
  totalItem:    { flex:1, alignItems:'center' },
  totalVal:     { color:C.text, fontSize:16, fontWeight:'800' },
  totalLbl:     { color:C.sub, fontSize:10 },
  totalDivider: { width:1, backgroundColor:C.border },
  tabs:         { flexDirection:'row', borderBottomWidth:1, borderBottomColor:C.border },
  tab:          { flex:1, paddingVertical:12, alignItems:'center' },
  tabActive:    { borderBottomWidth:2, borderBottomColor:C.purple },
  tabTxt:       { color:C.sub, fontSize:12, fontWeight:'600' },
  tabTxtActive: { color:C.text, fontWeight:'700' },
  searchWrap:   { flexDirection:'row', alignItems:'center', backgroundColor:C.card, margin:16, borderRadius:14, paddingHorizontal:14, paddingVertical:12, borderWidth:1, borderColor:C.border, gap:8 },
  searchIcon:   { fontSize:16 },
  searchInput:  { flex:1, color:C.text, fontSize:15 },
  clearTxt:     { color:C.sub, fontSize:14 },
  foodRow:      { flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:14, padding:14, marginBottom:8, gap:10, borderWidth:1, borderColor:C.border },
  foodRowAdded: { borderColor:'#7C5CFC60', backgroundColor:'#7C5CFC08' },
  foodInfo:     { flex:1 },
  foodName:     { color:C.text, fontSize:14, fontWeight:'600' },
  foodMeta:     { color:C.sub, fontSize:11, marginTop:2 },
  foodCal:      { color:C.accent, fontSize:13, fontWeight:'700' },
  addBtn:       { width:32, height:32, borderRadius:16, backgroundColor:C.purple, alignItems:'center', justifyContent:'center' },
  addBtnDone:   { backgroundColor:'#34C759' },
  addBtnTxt:    { color:'#fff', fontSize:18, fontWeight:'800', lineHeight:20 },
  addBtnTxtDone:{ fontSize:14 },
  addedScroll:  { padding:16 },
  emptyState:   { alignItems:'center', paddingTop:60 },
  emptyIcon:    { fontSize:48, marginBottom:12 },
  emptyTxt:     { color:C.text, fontSize:17, fontWeight:'700' },
  emptySub:     { color:C.sub, fontSize:13, marginTop:4 },
  addedRow:     { flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:14, padding:14, marginBottom:8, gap:10, borderWidth:1, borderColor:C.border },
  addedInfo:    { flex:1 },
  addedName:    { color:C.text, fontSize:14, fontWeight:'600' },
  addedCal:     { color:C.sub, fontSize:11, marginTop:2 },
  qtyControl:   { flexDirection:'row', alignItems:'center', gap:8 },
  qtyBtn:       { width:28, height:28, borderRadius:8, backgroundColor:C.border, alignItems:'center', justifyContent:'center' },
  qtyBtnTxt:    { color:C.accent, fontSize:16, fontWeight:'800' },
  qtyVal:       { color:C.text, fontSize:13, fontWeight:'700', minWidth:42, textAlign:'center' },
  removeBtn:    { padding:4 },
  removeTxt:    { fontSize:16 },
  confirmBtn:   { backgroundColor:C.purple, borderRadius:16, paddingVertical:17, alignItems:'center', marginTop:16 },
  confirmTxt:   { color:'#fff', fontSize:15, fontWeight:'800' },
});