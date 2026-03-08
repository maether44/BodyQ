import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TABS = [
  { key:'Home',      label:'Home',     icon:'🏠' },
  { key:'Nutrition', label:'Nutrition',icon:'🥗' },
  { key:'PostureAI', label:'Posture',  icon:'📷' },
  { key:'Training',  label:'Train',    icon:'💪' },
  { key:'Insights',  label:'Insights', icon:'📊' },
];

export default function NavBar({ activeTab, onTabPress }) {
  return (
    <View style={s.bar}>
      {TABS.map(tab => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity key={tab.key} style={s.tab} onPress={() => onTabPress(tab.key)} activeOpacity={0.7}>
            {active && <View style={s.activeLine} />}
            <Text style={[s.icon, active && s.iconActive]}>{tab.icon}</Text>
            <Text style={[s.label, active && s.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection:'row',
    backgroundColor:'#161230',
    borderTopWidth:1, borderTopColor:'#1E1A35',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop:10, paddingHorizontal:8,
  },
  tab:         { flex:1, alignItems:'center', justifyContent:'center', paddingVertical:4, position:'relative' },
  activeLine:  { position:'absolute', top:-10, width:28, height:3, borderRadius:2, backgroundColor:'#C8F135' },
  icon:        { fontSize:20, marginBottom:3, opacity:0.45 },
  iconActive:  { opacity:1 },
  label:       { fontSize:10, fontWeight:'500', color:'#6B5F8A', letterSpacing:0.2 },
  labelActive: { color:'#C8F135', fontWeight:'700' },
});