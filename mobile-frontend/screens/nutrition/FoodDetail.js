import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FOODS } from '../../data/mockFoods';

const C = {
  bg:'#0F0B1E', card:'#161230', border:'#1E1A35',
  purple:'#7C5CFC', lime:'#C8F135', accent:'#9D85F5',
  text:'#FFFFFF', sub:'#6B5F8A',
};

export default function FoodDetail({ foodId, onAdd, onClose }) {
  const food = FOODS.find(f => f.id === foodId);
  const [qty, setQty] = useState(food?.serving || 100);

  if (!food) return null;

  const ratio   = qty / (food.unit === 'g' || food.unit === 'ml' ? 100 : 1);
  const cal     = Math.round(food.cal  * ratio);
  const protein = Math.round(food.p    * ratio * 10) / 10;
  const carbs   = Math.round(food.c    * ratio * 10) / 10;
  const fat     = Math.round(food.f    * ratio * 10) / 10;

  const QUICK_QTYS = food.unit === 'g' || food.unit === 'ml'
    ? [50, 100, 150, 200, 250, 300]
    : [1, 2, 3];

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.closeTxt}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>{food.name}</Text>
        <View style={{ width:50 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Calories big */}
        <View style={s.calCard}>
          <Text style={s.calNum}>{cal}</Text>
          <Text style={s.calUnit}>kcal per {qty}{food.unit}</Text>
          <Text style={s.calCategory}>{food.category}</Text>
        </View>

        {/* Macro breakdown */}
        <View style={s.macroRow}>
          {[
            { label:'Protein', val:protein, color:C.purple },
            { label:'Carbs',   val:carbs,   color:C.accent  },
            { label:'Fat',     val:fat,     color:C.lime    },
          ].map((m,i) => (
            <View key={i} style={s.macroBox}>
              <Text style={[s.macroVal, { color:m.color }]}>{m.val}g</Text>
              <Text style={s.macroLbl}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Per 100g reference */}
        <View style={s.refCard}>
          <Text style={s.refTitle}>Per 100{food.unit === 'ml' ? 'ml' : 'g'}</Text>
          {[
            { label:'Calories', val:`${food.cal} kcal` },
            { label:'Protein',  val:`${food.p}g`       },
            { label:'Carbs',    val:`${food.c}g`       },
            { label:'Fat',      val:`${food.f}g`       },
          ].map((r,i) => (
            <View key={i} style={[s.refRow, i < 3 && s.refRowBorder]}>
              <Text style={s.refLabel}>{r.label}</Text>
              <Text style={s.refVal}>{r.val}</Text>
            </View>
          ))}
        </View>

        {/* Quantity selector */}
        <View style={s.qtyCard}>
          <Text style={s.qtyTitle}>Portion Size</Text>
          <View style={s.qtyControl}>
            <TouchableOpacity
              style={s.qtyBtn}
              onPress={() => setQty(p => Math.max(food.unit === 'g' || food.unit === 'ml' ? 25 : 1, p - (food.unit === 'g' || food.unit === 'ml' ? 25 : 1)))}
            >
              <Text style={s.qtyBtnTxt}>−</Text>
            </TouchableOpacity>
            <Text style={s.qtyNum}>{qty}<Text style={s.qtyUnitTxt}>{food.unit}</Text></Text>
            <TouchableOpacity
              style={s.qtyBtn}
              onPress={() => setQty(p => p + (food.unit === 'g' || food.unit === 'ml' ? 25 : 1))}
            >
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

        <TouchableOpacity
          style={s.addBtn}
          onPress={() => onAdd && onAdd({ food, qty })}
        >
          <Text style={s.addBtnTxt}>Add to Meal — {cal} kcal</Text>
        </TouchableOpacity>

        <View style={{ height:32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex:1, backgroundColor:C.bg },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:54, paddingBottom:14, borderBottomWidth:1, borderBottomColor:C.border },
  closeTxt: { color:C.accent, fontSize:14, fontWeight:'600' },
  title:    { color:C.text, fontSize:17, fontWeight:'800' },
  scroll:   { paddingHorizontal:16, paddingTop:20, paddingBottom:24 },

  calCard:    { backgroundColor:C.card, borderRadius:20, padding:24, alignItems:'center', marginBottom:14, borderWidth:1, borderColor:C.border },
  calNum:     { color:C.text, fontSize:56, fontWeight:'900', letterSpacing:-2 },
  calUnit:    { color:C.sub, fontSize:14, marginTop:4 },
  calCategory:{ backgroundColor:C.purple+'25', borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginTop:10 },

  macroRow: { flexDirection:'row', gap:10, marginBottom:14 },
  macroBox: { flex:1, backgroundColor:C.card, borderRadius:16, padding:16, alignItems:'center', borderWidth:1, borderColor:C.border },
  macroVal: { fontSize:20, fontWeight:'900' },
  macroLbl: { color:C.sub, fontSize:11, marginTop:4 },

  refCard:     { backgroundColor:C.card, borderRadius:20, padding:18, marginBottom:14, borderWidth:1, borderColor:C.border },
  refTitle:    { color:C.sub, fontSize:10, fontWeight:'800', letterSpacing:1, marginBottom:12 },
  refRow:      { flexDirection:'row', justifyContent:'space-between', paddingVertical:10 },
  refRowBorder:{ borderBottomWidth:1, borderBottomColor:C.border },
  refLabel:    { color:C.sub, fontSize:13 },
  refVal:      { color:C.text, fontSize:13, fontWeight:'600' },

  qtyCard:    { backgroundColor:C.card, borderRadius:20, padding:18, marginBottom:20, borderWidth:1, borderColor:C.border },
  qtyTitle:   { color:C.sub, fontSize:10, fontWeight:'800', letterSpacing:1, marginBottom:16 },
  qtyControl: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:24, marginBottom:16 },
  qtyBtn:     { width:44, height:44, borderRadius:14, backgroundColor:C.border, alignItems:'center', justifyContent:'center' },
  qtyBtnTxt:  { color:C.accent, fontSize:24, fontWeight:'800' },
  qtyNum:     { color:C.text, fontSize:32, fontWeight:'900', minWidth:80, textAlign:'center' },
  qtyUnitTxt: { color:C.sub, fontSize:16, fontWeight:'400' },
  quickQtyRow:{ flexDirection:'row', gap:8, paddingVertical:4 },
  quickQtyChip:      { paddingHorizontal:14, paddingVertical:8, backgroundColor:C.border, borderRadius:20, borderWidth:1, borderColor:C.border },
  quickQtyChipActive:{ backgroundColor:C.purple, borderColor:C.purple },
  quickQtyTxt:       { color:C.sub, fontSize:13, fontWeight:'600' },
  quickQtyTxtActive: { color:'#fff' },

  addBtn:    { backgroundColor:C.purple, borderRadius:16, paddingVertical:17, alignItems:'center' },
  addBtnTxt: { color:'#fff', fontSize:15, fontWeight:'800' },
});