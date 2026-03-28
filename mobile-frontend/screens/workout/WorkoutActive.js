import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
  StatusBar, ActivityIndicator, Alert, Animated, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Camera } from 'expo-camera';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../context/AuthContext';
import { saveWorkoutSession } from '../../services/workoutService';
import { supabase } from '../../lib/supabase';

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
  if (pct >= 80) return '#C8F135';
  if (pct >= 55) return '#FF9500';
  return '#FF3B30';
}

// MM:SS timer format
function formatTimer(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function WorkoutActive({ route, navigation }) {
  const { user } = useAuth();
  const rawKey      = route.params?.exerciseKey || route.params?.exerciseName || 'squat';
  const htmlKey     = resolveHtmlKey(rawKey);
  const displayName = rawKey.replace(/_/g, ' ').toUpperCase();

  const webViewRef       = useRef(null);
  const startTimeRef     = useRef(Date.now());
  const pulseAnim        = useRef(new Animated.Value(0)).current;
  const pulseRunning     = useRef(false);
  const formScoreSum     = useRef(0);
  const formScoreCount   = useRef(0);
  const countScaleAnim   = useRef(new Animated.Value(0.3)).current;
  const countOpacityAnim = useRef(new Animated.Value(0)).current;
  const glowOpacityAnim  = useRef(new Animated.Value(0)).current;
  const timerIntervalRef = useRef(null);
  const isMountedRef     = useRef(true);

  const [hasPermission, setHasPermission] = useState(null);
  const [htmlContent,   setHtmlContent]   = useState(null);
  const [cue,           setCue]           = useState('Initializing AI...');
  const [repCount,      setRepCount]      = useState(0);
  const [formScore,     setFormScore]     = useState(0);
  const [countdown,     setCountdown]     = useState(null); // null | 3 | 2 | 1 | 'GO!' | 'done'
  const [timerSecs,     setTimerSecs]     = useState(0);
  const [timerRunning,  setTimerRunning]  = useState(false);

  // ── Unmount cleanup ────────────────────────────────────────
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearInterval(timerIntervalRef.current);
    };
  }, []);

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

  // ── Live timer interval ────────────────────────────────────
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) setTimerSecs(s => s + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);

  // ── Electric Violet edge glow when strict (100%) form ─────
  useEffect(() => {
    Animated.timing(glowOpacityAnim, {
      toValue:  formScore === 100 ? 1 : 0,
      duration: formScore === 100 ? 500 : 200,
      useNativeDriver: true,
    }).start();
  }, [formScore, glowOpacityAnim]);

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

  // ── 3-2-1 Countdown sequence ───────────────────────────────
  const startCountdown = useCallback(() => {
    const steps = [3, 2, 1, 'GO!'];
    let i = 0;

    const showStep = () => {
      if (!isMountedRef.current) return;

      if (i >= steps.length) {
        setCountdown('done');
        // Unlock rep counting in the HTML
        webViewRef.current?.injectJavaScript('window.startAI && window.startAI(); true;');
        // Start the live elapsed timer
        startTimeRef.current = Date.now();
        setTimerRunning(true);
        return;
      }

      const val = steps[i];
      setCountdown(val);
      countScaleAnim.setValue(0.3);
      countOpacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(countScaleAnim, {
          toValue: 1, tension: 180, friction: 7, useNativeDriver: true,
        }),
        Animated.timing(countOpacityAnim, {
          toValue: 1, duration: 120, useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          if (!isMountedRef.current) return;
          Animated.timing(countOpacityAnim, {
            toValue: 0, duration: 180, useNativeDriver: true,
          }).start(() => {
            i++;
            showStep();
          });
        }, val === 'GO!' ? 700 : 750);
      });
    };

    showStep();
  }, [countScaleAnim, countOpacityAnim]);

  // ── WebView message bridge ─────────────────────────────────
  const onMessage = useCallback((e) => {
    const data = e.nativeEvent.data;

    if (data === 'AI_READY') {
      if (htmlKey) {
        webViewRef.current?.injectJavaScript(
          `window.applyExerciseChange && window.applyExerciseChange('${htmlKey}'); true;`
        );
      }
      startCountdown();
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

      if (msg.type === 'REP_COUNTED') setRepCount(msg.count);

      if (msg.type === 'SESSION_COMPLETE') {
        const elapsed      = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const avgFormScore = formScoreCount.current > 0
          ? Math.round(formScoreSum.current / formScoreCount.current)
          : (msg.score ?? 0);
        const calories     = Math.max(1, msg.reps * 5);
        const activityMins = Math.max(1, Math.round(elapsed / 60));

        setTimerRunning(false);

        (async () => {
          let sessionId = null;
          if (user?.id) {
            sessionId = await saveWorkoutSession({
              userId:         user.id,
              exerciseKey:    htmlKey ?? rawKey,
              exerciseName:   msg.exercise || displayName,
              reps:           msg.reps,
              postureScore:   avgFormScore,
              caloriesBurned: calories,
            });

            // Directly update daily_activity — don't rely on a trigger
            try {
              const TODAY = new Date().toISOString().split('T')[0];
              const { data: existing } = await supabase
                .from('daily_activity')
                .select('id, activity_minutes, calories_workout')
                .eq('user_id', user.id)
                .eq('date', TODAY)
                .maybeSingle();

              if (existing) {
                await supabase
                  .from('daily_activity')
                  .update({
                    activity_minutes: (existing.activity_minutes || 0) + activityMins,
                    calories_workout: (existing.calories_workout  || 0) + calories,
                  })
                  .eq('id', existing.id);
              } else {
                await supabase
                  .from('daily_activity')
                  .insert({
                    user_id:          user.id,
                    date:             TODAY,
                    activity_minutes: activityMins,
                    calories_workout: calories,
                  });
              }
            } catch (e) {
              console.warn('[BodyQ] daily_activity update failed:', e.message);
            }
          }

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
  }, [navigation, displayName, htmlKey, rawKey, triggerPulse, user, startCountdown]);

  // ── Finish ─────────────────────────────────────────────────
  const handleFinish = useCallback(() => {
    webViewRef.current?.injectJavaScript(
      `if (window.getSessionState) window.getSessionState(); true;`
    );
  }, []);

  // ── Unsupported exercise ───────────────────────────────────
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

  // Animated pulse border: transparent → Electric Violet on bad cue
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

      {/* ── ELECTRIC VIOLET EDGE GLOW — strict (100%) form ── */}
      <Animated.View
        pointerEvents="none"
        style={[s.edgeGlow, { opacity: glowOpacityAnim }]}
      />

      {/* ── PULSING BORDER ALERT — bad form correction ── */}
      <Animated.View
        pointerEvents="none"
        style={[s.pulseBorder, { borderColor, borderWidth }]}
      />

      {/* ── ATMOSPHERIC REP COUNTER ── */}
      <View style={s.atmosWrap} pointerEvents="none">
        <Text style={s.atmosRep}>{repCount}</Text>
      </View>

      {/* ── TOP-LEFT: Close + Exercise Badge ── */}
      <BlurView intensity={40} tint="dark" style={s.topLeft}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={s.exerciseTitle}>{displayName}</Text>
      </BlurView>

      {/* ── TOP-RIGHT: Form Ring ── */}
      <BlurView intensity={40} tint="dark" style={s.ringWrap} pointerEvents="none">
        <View style={[s.ringOuter, { borderColor: ring }]}>
          <Text style={[s.ringPct, { color: ring }]}>{formScore}</Text>
          <Text style={s.ringLabel}>FORM</Text>
        </View>
      </BlurView>

      {/* ── TOP-CENTER: Live Timer (appears after GO!) ── */}
      {countdown === 'done' && (
        <View style={s.timerWrap} pointerEvents="none">
          <BlurView intensity={30} tint="dark" style={s.timerBlur}>
            <Text style={s.timerText}>{formatTimer(timerSecs)}</Text>
          </BlurView>
        </View>
      )}

      {/* ── BOTTOM HUD: Cue + Finish Button ── */}
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

      {/* ── 3-2-1 COUNTDOWN OVERLAY (highest z-index) ── */}
      {countdown !== null && countdown !== 'done' && (
        <View style={s.countdownOverlay} pointerEvents="none">
          <Animated.Text
            style={[
              s.countdownNum,
              countdown === 'GO!' && s.countdownGoStyle,
              { opacity: countOpacityAnim, transform: [{ scale: countScaleAnim }] },
            ]}
          >
            {countdown}
          </Animated.Text>
          <Animated.Text style={[s.countdownSub, { opacity: countOpacityAnim }]}>
            {countdown === 'GO!' ? 'Perfect form only counts' : 'Get ready...'}
          </Animated.Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },

  // True full-bleed WebView
  webview: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },

  // Electric Violet edge glow — shown when strict (100%) form
  edgeGlow: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
    borderWidth: 3,
    borderColor: '#7C5CFC',
    shadowColor: '#7C5CFC',
    shadowOpacity: 0.9,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },

  // Pulsing Electric Violet border — fires on bad cue
  pulseBorder: { ...StyleSheet.absoluteFillObject, zIndex: 30 },

  // Atmospheric huge rep counter
  atmosWrap: {
    position: 'absolute', top: '14%', left: 0, right: 0,
    alignItems: 'center', zIndex: 10,
  },
  atmosRep: {
    fontSize: 160, fontWeight: '900',
    color: 'rgba(255,255,255,0.18)',
    letterSpacing: -8, lineHeight: 160,
  },

  // Top-left pill (exit + exercise name)
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

  // Top-right form ring
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

  // Top-center live timer
  timerWrap: {
    position: 'absolute', top: 130, left: 0, right: 0,
    alignItems: 'center', zIndex: 40,
  },
  timerBlur: {
    borderRadius: 12, overflow: 'hidden',
    paddingHorizontal: 18, paddingVertical: 7,
  },
  timerText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // Bottom HUD BlurView bar
  bottomOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
    overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 42,
  },
  cueRow:       { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  cueText:      { color: '#FFFFFF', fontSize: 14, fontWeight: '700', lineHeight: 20, flex: 1 },
  finishBtn:    { backgroundColor: '#C8F135', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 5 },
  finishBtnTxt: { color: '#000', fontWeight: '900', fontSize: 13 },

  // ── 3-2-1 Countdown overlay ──────────────────────────────
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNum: {
    fontSize: 140,
    fontWeight: '900',
    color: '#C8F135',
    lineHeight: 150,
    textShadowColor: 'rgba(200,241,53,0.7)',
    textShadowRadius: 50,
    letterSpacing: -6,
  },
  countdownGoStyle: {
    fontSize: 82,
    letterSpacing: 10,
    lineHeight: 90,
  },
  countdownSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 16,
  },

  // Fallback screens
  loaderTxt:        { color: '#C8F135', marginTop: 15, fontWeight: '900', letterSpacing: 2 },
  error:            { color: '#FF3B30', fontWeight: '800', fontSize: 16 },
  backLink:         { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#C8F135' },
  backLinkTxt:      { color: '#C8F135', fontWeight: '700' },
  unsupportedIcon:  { fontSize: 52, marginBottom: 16 },
  unsupportedTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  unsupportedSub:   { color: '#6B5F8A', fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 30 },
});
