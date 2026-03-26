import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
  StatusBar, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Camera } from 'expo-camera';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../context/AuthContext';
import { saveWorkoutSession } from '../../services/workoutService';

// ── Exercise keyword → HTML camelCase key ─────────────────────
function resolveHtmlKey(name) {
  const k = name.trim().toLowerCase();
  if (k.includes('push') || k.includes('bench')) return 'pushup';
  if (k.includes('squat'))                        return 'squat';
  if (k.includes('curl'))                         return 'bicepCurl';
  if (k.includes('press'))                        return 'shoulderPress';
  if (k.includes('deadlift') || k.includes('rdl')) return 'deadlift';
  if (k.includes('lunge'))                        return 'lunge';
  if (k.includes('plank'))                        return 'plank';
  return null;
}

// Form score → ring color
function scoreColor(pct) {
  if (pct >= 80) return '#C8F135';   // Neon Lime — great
  if (pct >= 55) return '#FF9500';   // Amber — ok
  return '#FF3B30';                  // Red — needs work
}

export default function WorkoutActive({ route, navigation }) {
  const { user } = useAuth();
  const rawKey      = route.params?.exerciseKey || route.params?.exerciseName || 'squat';
  const htmlKey     = resolveHtmlKey(rawKey);
  const displayName = rawKey.replace(/_/g, ' ').toUpperCase();

  const webViewRef      = useRef(null);
  const startTimeRef    = useRef(Date.now());
  const pulseAnim       = useRef(new Animated.Value(0)).current;
  const pulseRunning    = useRef(false);
  const formScoreSum    = useRef(0);
  const formScoreCount  = useRef(0);

  const [hasPermission, setHasPermission] = useState(null);
  const [htmlContent,   setHtmlContent]   = useState(null);
  const [cue,           setCue]           = useState('Initializing AI...');
  const [repCount,      setRepCount]      = useState(0);
  const [formScore,     setFormScore]     = useState(0);

  // ── Hide tab bar ───────────────────────────────────────────
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => navigation.getParent()?.setOptions({
      tabBarStyle: { backgroundColor: '#0F0B1E', borderTopColor: '#1E1A35', height: 85, paddingBottom: 20 },
    });
  }, [navigation]);

  // ── Camera permission + HTML load ─────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      try {
        const asset = Asset.fromModule(require('../../assets/ai_coach.html'));
        await asset.downloadAsync();
        const res  = await fetch(asset.localUri || asset.uri);
        const text = await res.text();
        setHtmlContent(text);
      } catch (err) {
        console.error('[BodyQ] HTML Load Error:', err);
        Alert.alert('Engine Error', 'Could not initialize the AI Engine.');
      }
    })();
  }, []);

  // ── Border pulse on correction cue ────────────────────────
  const triggerPulse = useCallback(() => {
    if (pulseRunning.current) return;
    pulseRunning.current = true;
    pulseAnim.setValue(0);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 180, useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 180, useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 180, useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 280, useNativeDriver: false }),
    ]).start(() => { pulseRunning.current = false; });
  }, [pulseAnim]);

  // ── WebView message bridge ─────────────────────────────────
  const onMessage = useCallback((e) => {
    const data = e.nativeEvent.data;

    if (data === 'AI_READY') {
      if (htmlKey) {
        webViewRef.current?.injectJavaScript(
          `window.applyExerciseChange && window.applyExerciseChange('${htmlKey}'); true;`
        );
      }
      return;
    }

    try {
      const msg = JSON.parse(data);

      if (msg.type === 'cue') {
        setCue(msg.text);
        if (msg.formScore !== undefined) {
          setFormScore(msg.formScore);
          formScoreSum.current   += msg.formScore;
          formScoreCount.current += 1;
        }
        const isBad = msg.text && !msg.text.includes('Great form') && !msg.text.includes('Detecting');
        if (isBad) triggerPulse();
      }

      if (msg.type === 'rep') setRepCount(msg.count);

      if (msg.type === 'SAVE_WORKOUT') {
        const elapsed      = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const avgFormScore = formScoreCount.current > 0
          ? Math.round(formScoreSum.current / formScoreCount.current)
          : (msg.accuracy ?? 0);
        const calories = Math.max(1, Math.round(elapsed / 60 * 8));

        // Persist session + muscle fatigue, then navigate
        (async () => {
          const sessionId = user?.id
            ? await saveWorkoutSession({
                userId:          user.id,
                exerciseKey:     htmlKey ?? rawKey,
                exerciseName:    msg.exercise || displayName,
                reps:            msg.reps,
                postureScore:    avgFormScore,
                caloriesBurned:  calories,
              })
            : null;

          navigation.replace('WorkoutSummary', {
            exerciseName: displayName,
            repCount:     msg.reps,
            formScore:    avgFormScore,
            elapsed,
            sessionId,
          });
        })();
      }
    } catch (_) {}
  }, [navigation, displayName, htmlKey, triggerPulse, user]);

  // ── Finish ─────────────────────────────────────────────────
  const handleFinish = useCallback(() => {
    webViewRef.current?.injectJavaScript(
      `if (window.getSessionState) window.getSessionState(); true;`
    );
  }, []);

  // ── Unsupported ────────────────────────────────────────────
  if (htmlKey === null) {
    return (
      <View style={[s.container, s.center]}>
        <StatusBar hidden />
        <Text style={s.unsupportedIcon}>🤖</Text>
        <Text style={s.unsupportedTitle}>AI Tracking Unavailable</Text>
        <Text style={s.unsupportedSub}>
          AI Form Tracking is not yet available for this exercise.{'\n'}Use manual timer?
        </Text>
        <TouchableOpacity style={s.backLink} onPress={() => navigation.goBack()}>
          <Text style={s.backLinkTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[s.container, s.center]}>
        <StatusBar hidden />
        <Text style={s.error}>Camera Permission Denied</Text>
        <TouchableOpacity style={s.backLink} onPress={() => navigation.goBack()}>
          <Text style={s.backLinkTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Animated pulse border color: transparent → Electric Violet
  const borderColor = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(124,92,252,0)', 'rgba(124,92,252,0.9)'],
  });
  const borderWidth = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 3],
  });

  const ring = scoreColor(formScore);

  return (
    <View style={s.container}>
      <StatusBar hidden />

      {/* ── FULLSCREEN CAMERA FEED ── */}
      {!htmlContent ? (
        <View style={[s.container, s.center]}>
          <ActivityIndicator size="large" color="#C8F135" />
          <Text style={s.loaderTxt}>LOADING AI ENGINE...</Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent, baseUrl: 'https://localhost' }}
          style={s.webview}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState={false}
          onPermissionRequest={(event) => event.grant(event.resources)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          bounces={false}
          onMessage={onMessage}
        />
      )}

      {/* ── PULSING BORDER ALERT ── */}
      <Animated.View
        pointerEvents="none"
        style={[s.pulseBorder, { borderColor, borderWidth }]}
      />

      {/* ── ATMOSPHERIC REP COUNTER ── */}
      <View style={s.atmosWrap} pointerEvents="none">
        <Text style={s.atmosRep}>{repCount}</Text>
      </View>

      {/* ── TOP-LEFT: Close + Exercise Badge (Glassmorphism) ── */}
      <BlurView intensity={40} tint="dark" style={s.topLeft}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={s.exerciseTitle}>{displayName}</Text>
      </BlurView>

      {/* ── TOP-RIGHT: Form Ring (Glassmorphism) ── */}
      <BlurView intensity={40} tint="dark" style={s.ringWrap} pointerEvents="none">
        <View style={[s.ringOuter, { borderColor: ring }]}>
          <Text style={[s.ringPct, { color: ring }]}>{formScore}</Text>
          <Text style={s.ringLabel}>FORM</Text>
        </View>
      </BlurView>

      {/* ── BOTTOM HUD (Glassmorphism) ── */}
      <BlurView intensity={50} tint="dark" style={s.bottomOverlay}>
        <View style={s.cueRow}>
          <Ionicons name="sparkles" size={13} color="#C8F135" style={{ marginRight: 7 }} />
          <Text style={s.cueText} numberOfLines={2}>{cue}</Text>
        </View>
        <TouchableOpacity style={s.finishBtn} onPress={handleFinish}>
          <Text style={s.finishBtnTxt}>Finish</Text>
          <Ionicons name="checkmark" size={15} color="#000" />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },

  // True full-bleed WebView — zero margin/padding, fills every pixel
  webview: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },

  // Pulsing full-screen border overlay
  pulseBorder: { ...StyleSheet.absoluteFillObject, zIndex: 30 },

  // Atmospheric huge rep counter — center-top, purely decorative
  atmosWrap: {
    position: 'absolute', top: '14%', left: 0, right: 0,
    alignItems: 'center', zIndex: 10,
  },
  atmosRep: {
    fontSize: 160, fontWeight: '900',
    color: 'rgba(255,255,255,0.18)',
    letterSpacing: -8, lineHeight: 160,
  },

  // Top-left — BlurView pill (exit + name)
  topLeft: {
    position: 'absolute', top: 52, left: 16, zIndex: 40,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 30, overflow: 'hidden',
    paddingVertical: 6, paddingHorizontal: 8,
  },
  closeBtn: {
    width: 38, height: 38, backgroundColor: '#C8F135',
    borderRadius: 19, alignItems: 'center', justifyContent: 'center',
  },
  exerciseTitle: {
    color: '#C8F135', fontSize: 14, fontWeight: '900',
    letterSpacing: 1.2, marginRight: 6,
    textShadowColor: 'rgba(200,241,53,0.4)', textShadowRadius: 8,
  },

  // Top-right — BlurView circle (form ring)
  ringWrap: {
    position: 'absolute', top: 46, right: 16, zIndex: 40,
    width: 72, height: 72, borderRadius: 36, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  ringOuter: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  ringPct:   { fontSize: 20, fontWeight: '900', lineHeight: 22 },
  ringLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '800', letterSpacing: 1 },

  // Bottom HUD — BlurView bar
  bottomOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
    overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 42,
  },
  cueRow:       { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  cueText:      { color: '#FFFFFF', fontSize: 13, fontWeight: '600', lineHeight: 19, flex: 1 },
  finishBtn:    { backgroundColor: '#C8F135', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 5 },
  finishBtnTxt: { color: '#000', fontWeight: '900', fontSize: 13 },

  // Fallback screens
  loaderTxt:        { color: '#C8F135', marginTop: 15, fontWeight: '900', letterSpacing: 2 },
  error:            { color: '#FF3B30', fontWeight: '800', fontSize: 16 },
  backLink:         { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#C8F135' },
  backLinkTxt:      { color: '#C8F135', fontWeight: '700' },
  unsupportedIcon:  { fontSize: 52, marginBottom: 16 },
  unsupportedTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  unsupportedSub:   { color: '#6B5F8A', fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 30 },
});
