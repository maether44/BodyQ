import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const C = {
  bg:      '#0F0B1E',
  card:    '#161230',
  border:  '#1E1A35',
  purple:  '#7C5CFC',
  purpleD: '#4A2FC8',
  lime:    '#C8F135',
  text:    '#FFFFFF',
  sub:     '#6B5F8A',
  accent:  '#9D85F5',
};

const QUICK_ACTIONS = [
  { icon: 'search',           label: 'Library',  screen: 'ExerciseList' },
  { icon: 'scan-outline',     label: 'PostureAI',screen: 'PostureAI'    },
  { icon: 'analytics-outline',label: 'Progress', screen: null           },
];

export default function Training({ navigation }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' :
    hour < 18 ? 'Good Afternoon' :
    'Good Evening';

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >

        {/* ── HEADER ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting},</Text>
            <Text style={s.subGreeting}>Your studio is ready.</Text>
          </View>
          <View style={s.recoveryBadge}>
            <Text style={s.recoveryNum}>88%</Text>
            <Text style={s.recoveryLabel}>RECOVERY</Text>
          </View>
        </Animated.View>

        {/* ── HERO CARD ──────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('WorkoutActive', { exerciseName: 'squat' })}
          >
            <LinearGradient
              colors={[C.purple, C.purpleD, '#1A0E4F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.heroCard}
            >
              {/* Glow accent line */}
              <View style={s.heroAccentLine} />

              <View style={s.heroBadge}>
                <Ionicons name="sparkles" size={10} color={C.lime} />
                <Text style={s.heroBadgeTxt}>  AI RECOMMENDED</Text>
              </View>

              <Text style={s.heroLabel}>TODAY'S PROGRAM</Text>
              <Text style={s.heroTitle}>Hyper-Mobility{'\n'}Reset</Text>

              <View style={s.heroMeta}>
                {[
                  { icon: 'time-outline',    val: '18 min' },
                  { icon: 'flame-outline',   val: '240 kcal' },
                  { icon: 'body-outline',    val: 'Posture Focus' },
                ].map((m, i) => (
                  <View key={i} style={s.metaChip}>
                    <Ionicons name={m.icon} size={11} color="rgba(255,255,255,0.6)" />
                    <Text style={s.metaChipTxt}> {m.val}</Text>
                  </View>
                ))}
              </View>

              <View style={s.heroFooter}>
                <Text style={s.heroLogic}>
                  "Based on your 6h sleep &{'\n'}4h desk session today."
                </Text>
                <View style={s.playCircle}>
                  <Ionicons name="play" size={22} color="#000" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── QUICK ACTIONS ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={s.actionRow}>
          {QUICK_ACTIONS.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={s.actionBtn}
              onPress={() => a.screen && navigation.navigate(a.screen)}
              activeOpacity={0.8}
            >
              <View style={s.actionIconWrap}>
                <Ionicons name={a.icon} size={20} color={C.lime} />
              </View>
              <Text style={s.actionTxt}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── PERFORMANCE LIBRARY ────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Performance Library</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ExerciseList')}>
              <Text style={s.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={s.libCard}
            onPress={() => navigation.navigate('ExerciseList')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#1A1535', C.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.libGradient}
            >
              <View style={s.libIconBox}>
                <Ionicons name="barbell-outline" size={28} color={C.lime} />
              </View>
              <View style={s.libInfo}>
                <Text style={s.libMain}>Browse 1,300+ Exercises</Text>
                <Text style={s.libSub}>Bodyweight · Barbell · Cable · Machine</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.lime} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── POSTURE AI CARD ────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={{ marginTop: 14 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PostureAI')}
          >
            <View style={s.postureCard}>
              <View style={s.postureLeft}>
                <View style={s.postureIconBox}>
                  <Ionicons name="scan-outline" size={26} color={C.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.postureTitle}>AI Posture Coach</Text>
                  <Text style={s.postureSub}>Real-time form correction</Text>
                </View>
              </View>
              <View style={s.postureArrow}>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 62, paddingBottom: 20 },

  // Header
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting:       { color: C.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  subGreeting:    { color: C.sub, fontSize: 14, marginTop: 2 },
  recoveryBadge:  { backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.lime },
  recoveryNum:    { color: C.lime, fontSize: 20, fontWeight: '900', lineHeight: 22 },
  recoveryLabel:  { color: C.sub, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 2 },

  // Hero Card
  heroCard:       { borderRadius: 28, padding: 26, marginBottom: 24, overflow: 'hidden' },
  heroAccentLine: { position: 'absolute', top: 0, left: 26, right: 26, height: 2, backgroundColor: C.lime, opacity: 0.5, borderRadius: 1 },
  heroBadge:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(200,241,53,0.12)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(200,241,53,0.25)' },
  heroBadgeTxt:   { color: C.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  heroLabel:      { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  heroTitle:      { color: C.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.5, lineHeight: 34, marginBottom: 16 },
  heroMeta:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  metaChip:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  metaChipTxt:    { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  heroFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroLogic:      { color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', fontSize: 12, lineHeight: 18, flex: 1 },
  playCircle:     { width: 52, height: 52, backgroundColor: C.lime, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: C.lime, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },

  // Quick Actions
  actionRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  actionBtn:      { width: (width - 56) / 3, backgroundColor: C.card, paddingVertical: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  actionIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(200,241,53,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(200,241,53,0.2)' },
  actionTxt:      { color: C.text, fontSize: 11, fontWeight: '700' },

  // Library
  sectionRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:   { color: C.text, fontSize: 16, fontWeight: '800' },
  sectionLink:    { color: C.lime, fontSize: 12, fontWeight: '700' },
  libCard:        { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 0 },
  libGradient:    { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  libIconBox:     { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(200,241,53,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(200,241,53,0.2)' },
  libInfo:        { flex: 1 },
  libMain:        { color: C.text, fontSize: 15, fontWeight: '700' },
  libSub:         { color: C.sub, fontSize: 11, marginTop: 3 },

  // Posture AI
  postureCard:    { backgroundColor: C.card, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.border },
  postureLeft:    { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  postureIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(124,92,252,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(124,92,252,0.3)' },
  postureTitle:   { color: C.text, fontSize: 15, fontWeight: '700' },
  postureSub:     { color: C.sub, fontSize: 11, marginTop: 2 },
  postureArrow:   { width: 32, height: 32, borderRadius: 16, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
});
