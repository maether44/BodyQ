import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Camera } from 'expo-camera';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';

// Maps exercise name keywords → camelCase keys used in ai_coach.html
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

export default function WorkoutActive({ route, navigation }) {
  const rawKey  = route.params?.exerciseKey || route.params?.exerciseName || 'squat';
  const htmlKey = resolveHtmlKey(rawKey);
  const displayName = rawKey.replace(/_/g, ' ').toUpperCase();

  const webViewRef    = useRef(null);
  const startTimeRef  = useRef(Date.now());

  const [hasPermission, setHasPermission] = useState(null);
  const [htmlContent,   setHtmlContent]   = useState(null);
  const [cue,           setCue]           = useState('Waiting for AI...');
  const [repCount,      setRepCount]      = useState(0);

  // ── Hide tab bar while active ──────────────────────────────
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

  // ── Receive messages from WebView ────────────────────────
  const onMessage = useCallback((e) => {
    const data = e.nativeEvent.data;

    // AI engine is live — now safe to inject the exercise key
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
      if (msg.type === 'cue')        setCue(msg.text);
      if (msg.type === 'rep')        setRepCount(msg.count);
      if (msg.type === 'sessionEnd') {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        navigation.replace('WorkoutSummary', {
          exerciseName: displayName,
          repCount:     msg.repCount,
          formScore:    msg.formScore,
          elapsed,
        });
      }
    } catch (_) {}
  }, [navigation, displayName, htmlKey]);

  // ── Finish button: ask HTML for final state ───────────────
  const handleFinish = useCallback(() => {
    webViewRef.current?.injectJavaScript(
      `if (window.getSessionState) window.getSessionState(); true;`
    );
  }, []);

  // ── Unsupported exercise ──────────────────────────────────
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

  return (
    <View style={s.container}>
      <StatusBar hidden />

      {/* Full-screen WebView */}
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
          startInLoadingState={true}
          onPermissionRequest={(event) => event.grant(event.resources)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={onMessage}
        />
      )}

      {/* ── TOP HUD ── */}
      <View style={s.topOverlay}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#000" />
        </TouchableOpacity>

        <View style={s.titleWrap}>
          <Text style={s.exerciseTitle}>{displayName}</Text>
        </View>

        <View style={s.repBadge}>
          <Text style={s.repNum}>{repCount}</Text>
          <Text style={s.repLabel}>REPS</Text>
        </View>
      </View>

      {/* ── BOTTOM HUD ── */}
      <View style={s.bottomOverlay}>
        <View style={s.cueRow}>
          <Ionicons name="sparkles" size={14} color="#C8F135" style={{ marginRight: 8 }} />
          <Text style={s.cueText} numberOfLines={2}>{cue}</Text>
        </View>
        <TouchableOpacity style={s.finishBtn} onPress={handleFinish}>
          <Text style={s.finishBtnTxt}>Finish</Text>
          <Ionicons name="checkmark" size={16} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#000' },
  center:          { justifyContent: 'center', alignItems: 'center' },
  webview:         { flex: 1, backgroundColor: '#000', margin: 0, padding: 0 },
  loaderTxt:       { color: '#C8F135', marginTop: 15, fontWeight: '900', letterSpacing: 2 },
  error:           { color: '#FF3B30', fontWeight: '800', fontSize: 16 },
  backLink:        { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#C8F135' },
  backLinkTxt:     { color: '#C8F135', fontWeight: '700' },
  unsupportedIcon: { fontSize: 52, marginBottom: 16 },
  unsupportedTitle:{ color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  unsupportedSub:  { color: '#6B5F8A', fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 30 },

  // Top overlay
  topOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 20 },
  closeBtn:     { width: 44, height: 44, backgroundColor: '#C8F135', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  titleWrap:    { flex: 1, alignItems: 'center' },
  exerciseTitle:{ color: '#C8F135', fontSize: 22, fontWeight: '900', letterSpacing: 1.5, textShadowColor: 'rgba(200,241,53,0.4)', textShadowRadius: 10 },
  repBadge:     { alignItems: 'center', minWidth: 44 },
  repNum:       { color: '#C8F135', fontSize: 26, fontWeight: '900', lineHeight: 28 },
  repLabel:     { color: 'rgba(200,241,53,0.6)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },

  // Bottom overlay
  bottomOverlay:{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 20, paddingVertical: 18, paddingBottom: 36, flexDirection: 'row', alignItems: 'center', zIndex: 20 },
  cueRow:       { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  cueText:      { color: '#FFFFFF', fontSize: 14, fontWeight: '600', lineHeight: 20, flex: 1 },
  finishBtn:    { backgroundColor: '#C8F135', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  finishBtnTxt: { color: '#000', fontWeight: '900', fontSize: 14 },
});
