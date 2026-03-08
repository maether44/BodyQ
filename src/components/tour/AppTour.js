// components/AppTour.js
// Premium onboarding tour — Notion/Duolingo style
// • Semi-transparent overlay (you can still see the whole app underneath)
// • Spotlight punches a clean hole around each element
// • Bubble always appears to the SIDE of the element, never covering it
// • Arrow points FROM the bubble TO the element
// • Spring animations, progress dots, skip button
//
// RESET TOUR (for testing): change TOUR_VERSION below to any new number
// TO REPLAY FROM SETTINGS: call resetTour() exported from this file

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
    Animated, Dimensions, Modal,
    StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { measureTourRef } from './tourRefs';

const { width: W, height: H } = Dimensions.get('window');
const TOUR_VERSION = 4; // bump this to reset the tour for all users
const TOUR_KEY = `@fitapp_tour_v${TOUR_VERSION}`;
const PAD = 14; // padding around spotlight
const BUBBLE_W = 220; // fixed bubble width
const BUBBLE_H = 170; // approx bubble height for positioning math

export async function resetTour() {
  await AsyncStorage.removeItem(TOUR_KEY);
}

// ─── STEPS ────────────────────────────────────────────────────────────────────
// side: 'bottom' | 'top' | 'right' | 'left' | 'center'
//   bottom → bubble below element, arrow up   ↑ (element is above bubble)
//   top    → bubble above element, arrow down ↓ (element is below bubble)
//   right  → bubble to the right, arrow left  ← (element is to the left)
//   left   → bubble to the left, arrow right  → (element is to the right)
//   center → no spotlight, centered card (for tab transitions)
const STEPS = [
  {
    refKey: null,
    tab: 'Home',
    side: 'center',
    emoji: '👋',
    title: "Let's take a quick tour!",
    body: 'I\'ll show you what each part of the app does. Takes about 20 seconds.',
  },
  {
    refKey: 'home_calories',
    tab: 'Home',
    side: 'bottom',
    emoji: '🔥',
    title: 'Calorie ring',
    body: 'The ring fills as you eat. Tap Log a Meal to add food and track your macros.',
  },
  {
    refKey: 'home_workout',
    tab: 'Home',
    side: 'bottom',
    emoji: '💪',
    title: 'Your workout',
    body: 'Tap ▶ to start your session. Sets and reps log automatically.',
  },
  {
    refKey: 'home_water',
    tab: 'Home',
    side: 'bottom',
    emoji: '💧',
    title: 'Water · Steps · Sleep',
    body: 'Tap +250ml to log water. These all affect your recovery score.',
  },
  {
    refKey: 'home_recovery',
    tab: 'Home',
    side: 'top',
    emoji: '📊',
    title: 'Recovery score',
    body: '🟢 Push hard · 🟠 Moderate · 🔴 Rest. Check this every morning.',
  },
  {
    refKey: 'home_week',
    tab: 'Home',
    side: 'top',
    emoji: '📅',
    title: 'Weekly streak',
    body: 'Each dot = a training day. Consistency beats any single perfect session.',
  },
  {
    refKey: null,
    tab: 'Training',
    side: 'center',
    emoji: '🏋️',
    title: 'Training tab',
    body: 'Your full AI-generated workout split. Every exercise picked for your exact goal and equipment.',
  },
  {
    refKey: null,
    tab: 'Nutrition',
    side: 'center',
    emoji: '🥗',
    title: 'Nutrition tab',
    body: 'Log meals, scan barcodes, hit your daily targets. Protein first, everything else second.',
  },
  {
    refKey: null,
    tab: 'PostureAI',
    side: 'center',
    emoji: '📸',
    title: 'PostureAI tab',
    body: 'Camera-based posture scan. Do it weekly — most injuries start with bad form.',
  },
  {
    refKey: 'yara_fab',
    tab: 'Home',
    side: 'top',
    emoji: '👩‍⚕️',
    title: 'Yara — your AI coach',
    body: 'Tap anytime for advice. She knows your whole profile and never asks you twice.',
  },
  {
    refKey: null,
    tab: 'Home',
    side: 'center',
    emoji: '🚀',
    title: "You're all set!",
    body: 'Your plan is built, Yara is ready, and your progress starts now.',
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AppTour({ activeTab, onTabPress }) {
  const [visible,  setVisible]  = useState(false);
  const [stepIdx,  setStepIdx]  = useState(0);
  const [computed, setComputed] = useState(null); // layout computed for current step

  // Overlay
  const overlayOp = useRef(new Animated.Value(0)).current;

  // Spotlight box (animated so it moves smoothly)
  const sL = useRef(new Animated.Value(0)).current;
  const sT = useRef(new Animated.Value(0)).current;
  const sW = useRef(new Animated.Value(0)).current;
  const sH = useRef(new Animated.Value(0)).current;
  const sR = useRef(new Animated.Value(16)).current;

  // Bubble
  const bubOp = useRef(new Animated.Value(0)).current;
  const bubTY = useRef(new Animated.Value(16)).current;

  // Glow pulse on border
  const glow = useRef(new Animated.Value(0)).current;

  // ── init ──
  useEffect(() => {
    AsyncStorage.getItem(TOUR_KEY).then(val => {
      if (!val) setTimeout(() => setVisible(true), 800);
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    Animated.timing(overlayOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    goStep(0);
    // Start glow loop
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: false }),
    ])).start();
  }, [visible]);

  // ── move spotlight to rect ──
  const moveSpot = (rect) => {
    Animated.parallel([
      Animated.spring(sL, { toValue: rect.x - PAD,       useNativeDriver: false, tension: 55, friction: 9 }),
      Animated.spring(sT, { toValue: rect.y - PAD,       useNativeDriver: false, tension: 55, friction: 9 }),
      Animated.spring(sW, { toValue: rect.width + PAD*2, useNativeDriver: false, tension: 55, friction: 9 }),
      Animated.spring(sH, { toValue: rect.height + PAD*2,useNativeDriver: false, tension: 55, friction: 9 }),
      Animated.spring(sR, { toValue: 16,                 useNativeDriver: false, tension: 55, friction: 9 }),
    ]).start();
  };

  const hideSpot = () => {
    Animated.parallel([
      Animated.timing(sW, { toValue: 0, duration: 180, useNativeDriver: false }),
      Animated.timing(sH, { toValue: 0, duration: 180, useNativeDriver: false }),
    ]).start();
  };

  // ── show/hide bubble ──
  const showBubble = (fromY = 12) => {
    bubTY.setValue(fromY);
    bubOp.setValue(0);
    Animated.parallel([
      Animated.timing(bubOp,  { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.spring(bubTY,  { toValue: 0, tension: 80, friction: 11, useNativeDriver: true }),
    ]).start();
  };

  const hideBubble = () => new Promise(res =>
    Animated.parallel([
      Animated.timing(bubOp, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(bubTY, { toValue: -10, duration: 140, useNativeDriver: true }),
    ]).start(res)
  );

  // ── compute bubble position that NEVER overlaps the spotlight ──
  const computeLayout = (rect, side) => {
    const spotL = rect.x - PAD;
    const spotT = rect.y - PAD;
    const spotR = rect.x + rect.width + PAD;
    const spotB = rect.y + rect.height + PAD;
    const spotCX = (spotL + spotR) / 2;
    const spotCY = (spotT + spotB) / 2;

    let bx, by, arrowSide, arrowOffset;

    const margin = 16; // gap between spotlight edge and bubble

    if (side === 'bottom') {
      // Bubble below spotlight
      by = spotB + margin;
      bx = Math.max(16, Math.min(spotCX - BUBBLE_W / 2, W - BUBBLE_W - 16));
      arrowSide = 'top'; // arrow on top of bubble pointing up at element
      arrowOffset = Math.min(Math.max(spotCX - bx - 14, 16), BUBBLE_W - 44);
    } else if (side === 'top') {
      // Bubble above spotlight
      by = spotT - BUBBLE_H - margin;
      bx = Math.max(16, Math.min(spotCX - BUBBLE_W / 2, W - BUBBLE_W - 16));
      arrowSide = 'bottom'; // arrow on bottom of bubble pointing down at element
      arrowOffset = Math.min(Math.max(spotCX - bx - 14, 16), BUBBLE_W - 44);
    } else if (side === 'right') {
      bx = spotR + margin;
      by = Math.max(80, Math.min(spotCY - BUBBLE_H / 2, H - BUBBLE_H - 80));
      arrowSide = 'left';
      arrowOffset = Math.min(Math.max(spotCY - by - 14, 16), BUBBLE_H - 44);
    } else {
      bx = spotL - BUBBLE_W - margin;
      by = Math.max(80, Math.min(spotCY - BUBBLE_H / 2, H - BUBBLE_H - 80));
      arrowSide = 'right';
      arrowOffset = Math.min(Math.max(spotCY - by - 14, 16), BUBBLE_H - 44);
    }

    // Safety clamp — keep bubble fully on screen
    bx = Math.max(16, Math.min(bx, W - BUBBLE_W - 16));
    by = Math.max(60, Math.min(by, H - BUBBLE_H - 90));

    return { bx, by, arrowSide, arrowOffset, hasSpot: true };
  };

  // ── go to a step ──
  const goStep = async (idx) => {
    const step = STEPS[idx];

    // Switch tab if needed
    if (step.tab !== activeTab) {
      onTabPress?.(step.tab);
      await new Promise(r => setTimeout(r, 500));
    }

    if (step.refKey) {
      const rect = await measureTourRef(step.refKey);
      if (rect) {
        moveSpot(rect);
        const layout = computeLayout(rect, step.side);
        setComputed(layout);
        showBubble(step.side === 'top' ? 14 : -14);
        return;
      }
    }

    // Center card (no spotlight)
    hideSpot();
    setComputed({
      bx: (W - BUBBLE_W - 40) / 2,
      by: H / 2 - BUBBLE_H / 2 - 20,
      arrowSide: null,
      arrowOffset: 0,
      hasSpot: false,
      centered: true,
    });
    showBubble(14);
  };

  const next = async () => {
    await hideBubble();
    if (stepIdx >= STEPS.length - 1) { done(); return; }
    const n = stepIdx + 1;
    setStepIdx(n);
    goStep(n);
  };

  const prev = async () => {
    if (stepIdx <= 0) return;
    await hideBubble();
    const p = stepIdx - 1;
    setStepIdx(p);
    goStep(p);
  };

  const done = async () => {
    await hideBubble();
    Animated.timing(overlayOp, { toValue: 0, duration: 300, useNativeDriver: true })
      .start(() => setVisible(false));
    await AsyncStorage.setItem(TOUR_KEY, 'true');
    onTabPress?.('Home');
  };

  if (!visible || !computed) return null;

  const step    = STEPS[stepIdx];
  const isLast  = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;
  const pct     = (stepIdx + 1) / STEPS.length;

  const glowColor = glow.interpolate({ inputRange: [0,1], outputRange: ['#7B61FF', '#A78BFF'] });

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOp }]}>

        {/* ── OVERLAY: 4 semi-transparent rects around the spotlight hole ── */}
        {computed.hasSpot ? (
          <>
            {/* top */}
            <Animated.View style={[s.mask, { top: 0, left: 0, right: 0, height: sT }]} />
            {/* bottom */}
            <Animated.View style={[s.mask, {
              top: Animated.add(sT, sH), left: 0, right: 0, bottom: 0,
            }]} />
            {/* left */}
            <Animated.View style={[s.mask, { top: sT, left: 0, width: sL, height: sH }]} />
            {/* right */}
            <Animated.View style={[s.mask, {
              top: sT, left: Animated.add(sL, sW), right: 0, height: sH,
            }]} />

            {/* Glowing border around spotlight */}
            <Animated.View style={[s.spotRing, {
              left: sL, top: sT, width: sW, height: sH,
              borderRadius: sR, borderColor: glowColor,
            }]} />

            {/* 4 corner accents */}
            <Animated.View style={[s.cTL, { left: Animated.subtract(sL,1), top: Animated.subtract(sT,1) }]} />
            <Animated.View style={[s.cTR, { left: Animated.add(Animated.add(sL,sW),-15), top: Animated.subtract(sT,1) }]} />
            <Animated.View style={[s.cBL, { left: Animated.subtract(sL,1), top: Animated.add(Animated.add(sT,sH),-15) }]} />
            <Animated.View style={[s.cBR, { left: Animated.add(Animated.add(sL,sW),-15), top: Animated.add(Animated.add(sT,sH),-15) }]} />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, s.mask]} />
        )}

        {/* ── TOOLTIP BUBBLE ── */}
        <Animated.View style={[
          s.bubble,
          computed.centered && s.bubbleCentered,
          !computed.centered && { left: computed.bx, top: computed.by, width: BUBBLE_W },
          { opacity: bubOp, transform: [{ translateY: bubTY }] },
        ]}>

          {/* Arrow pointing DOWN (bubble is above the element) */}
          {computed.arrowSide === 'bottom' && (
            <View style={[s.arrowDown, { left: computed.arrowOffset }]} />
          )}
          {/* Arrow pointing RIGHT (bubble is to the left of element) */}
          {computed.arrowSide === 'right' && (
            <View style={[s.arrowRight, { top: computed.arrowOffset }]} />
          )}

          {/* ── BUBBLE CONTENT ── */}
          <View style={s.bubbleCard}>

            {/* Header: emoji badge + progress bar + close */}
            <View style={s.row}>
              <View style={s.badge}>
                <Text style={{ fontSize: 15 }}>{step.emoji}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={s.progressBg}>
                  <Animated.View style={[s.progressFill, { width: `${pct * 100}%` }]} />
                </View>
                <Text style={s.counter}>{stepIdx + 1} of {STEPS.length}</Text>
              </View>
              <TouchableOpacity onPress={done} hitSlop={{ top:12,bottom:12,left:12,right:12 }}>
                <Text style={s.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.title}>{step.title}</Text>
            <Text style={s.body}>{step.body}</Text>

            {/* Step dots */}
            <View style={s.dots}>
              {STEPS.map((_, i) => (
                <View key={i} style={[
                  s.dot,
                  i === stepIdx && s.dotActive,
                  i < stepIdx  && s.dotDone,
                ]} />
              ))}
            </View>

            {/* Prev / Next */}
            <View style={s.btnRow}>
              {!isFirst ? (
                <TouchableOpacity style={s.prevBtn} onPress={prev}>
                  <Text style={s.prevTxt}>←</Text>
                </TouchableOpacity>
              ) : <View style={{ width: 40 }} />}

              <TouchableOpacity style={s.nextBtn} onPress={next}>
                <Text style={s.nextTxt}>{isLast ? '🚀 Done' : 'Next →'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Arrow pointing UP (bubble is below the element) */}
          {computed.arrowSide === 'top' && (
            <View style={[s.arrowUp, { left: computed.arrowOffset }]} />
          )}
          {/* Arrow pointing LEFT (bubble is to the right of element) */}
          {computed.arrowSide === 'left' && (
            <View style={[s.arrowLeft, { top: computed.arrowOffset }]} />
          )}
        </Animated.View>

      </Animated.View>
    </Modal>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CORNER = 15;
const cBase  = { position: 'absolute', width: CORNER, height: CORNER };
const ARROW  = 11;

const s = StyleSheet.create({
  mask: { position: 'absolute', backgroundColor: 'rgba(5,3,15,0.72)' },

  spotRing: {
    position: 'absolute',
    borderWidth: 2,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 12,
  },

  // corner ticks — lime green
  cTL: { ...cBase, borderTopWidth:2.5,    borderLeftWidth:2.5,   borderColor:'#B8F566', borderTopLeftRadius:3 },
  cTR: { ...cBase, borderTopWidth:2.5,    borderRightWidth:2.5,  borderColor:'#B8F566', borderTopRightRadius:3 },
  cBL: { ...cBase, borderBottomWidth:2.5, borderLeftWidth:2.5,   borderColor:'#B8F566', borderBottomLeftRadius:3 },
  cBR: { ...cBase, borderBottomWidth:2.5, borderRightWidth:2.5,  borderColor:'#B8F566', borderBottomRightRadius:3 },

  // ── Bubble ──
  bubble: { position: 'absolute', zIndex: 999 },
  bubbleCentered: {
    left: 28, right: 28,
    top: '35%',
  },

  bubbleCard: {
    backgroundColor: '#16132B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D2850',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 24,
  },

  // ── Arrows (triangles) ──
  arrowUp: {
    position: 'absolute', top: -ARROW,
    width: 0, height: 0,
    borderStyle: 'solid',
    borderLeftWidth: ARROW,   borderLeftColor:  'transparent',
    borderRightWidth: ARROW,  borderRightColor: 'transparent',
    borderBottomWidth: ARROW, borderBottomColor:'#16132B',
  },
  arrowDown: {
    position: 'absolute', bottom: -ARROW,
    width: 0, height: 0,
    borderLeftWidth: ARROW,   borderLeftColor:  'transparent',
    borderRightWidth: ARROW,  borderRightColor: 'transparent',
    borderTopWidth: ARROW,    borderTopColor:   '#16132B',
  },
  arrowLeft: {
    position: 'absolute', left: -ARROW,
    width: 0, height: 0,
    borderTopWidth: ARROW,    borderTopColor:    'transparent',
    borderBottomWidth: ARROW, borderBottomColor: 'transparent',
    borderRightWidth: ARROW,  borderRightColor:  '#16132B',
  },
  arrowRight: {
    position: 'absolute', right: -ARROW,
    width: 0, height: 0,
    borderTopWidth: ARROW,    borderTopColor:    'transparent',
    borderBottomWidth: ARROW, borderBottomColor: 'transparent',
    borderLeftWidth: ARROW,   borderLeftColor:   '#16132B',
  },

  // ── Bubble internals ──
  row:         { flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 },
  badge:       { width:34, height:34, borderRadius:17, backgroundColor:'#7B61FF1A', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#7B61FF30' },
  progressBg:  { height:3, backgroundColor:'#221F3A', borderRadius:2, overflow:'hidden' },
  progressFill:{ height:3, backgroundColor:'#7B61FF', borderRadius:2 },
  counter:     { color:'#4A4070', fontSize:10, fontWeight:'700' },
  closeBtn:    { color:'#3A3460', fontSize:16, fontWeight:'700', padding:2 },

  title: { color:'#EDE8FF', fontSize:15, fontWeight:'900', marginBottom:6, lineHeight:22 },
  body:  { color:'#7B6FA8', fontSize:13, lineHeight:20, marginBottom:12 },

  dots:     { flexDirection:'row', gap:4, marginBottom:14 },
  dot:      { width:5, height:5, borderRadius:3, backgroundColor:'#221F3A' },
  dotActive:{ width:20, backgroundColor:'#7B61FF' },
  dotDone:  { backgroundColor:'#7B61FF50' },

  btnRow:  { flexDirection:'row', alignItems:'center', gap:8 },
  prevBtn: { width:40, height:40, borderRadius:20, borderWidth:1, borderColor:'#2D2850', alignItems:'center', justifyContent:'center' },
  prevTxt: { color:'#5A5282', fontSize:16 },
  nextBtn: { flex:1, backgroundColor:'#7B61FF', borderRadius:13, paddingVertical:12, alignItems:'center', shadowColor:'#7B61FF', shadowOffset:{width:0,height:3}, shadowOpacity:0.45, shadowRadius:10, elevation:8 },
  nextTxt: { color:'#fff', fontSize:14, fontWeight:'800' },
});