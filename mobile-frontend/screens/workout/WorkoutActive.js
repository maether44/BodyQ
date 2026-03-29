import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
  StatusBar, Animated, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';
import { Camera } from 'expo-camera';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../context/AuthContext';
import { saveWorkoutSession } from '../../services/workoutService';
import { supabase } from '../../lib/supabase';

// ── Yara encouragement phrases ─────────────────────────────────
const REP_PHRASES = [
  'Nice work!', 'Power up!', 'Keep going!', 'Strong!',
  'You got it!', 'One more!', 'Beast mode!', 'Perfect!',
];

// ── Yara breathing tips (every 3 reps) ────────────────────────
const BREATHING_TIPS = [
  'Breathe out on the way up',
  'Keep your core tight',
  'Drive through your heels',
  'Control the descent',
  'Chest up, shoulders back',
  'Full range of motion',
];

// ── Exercise → muscles targeted (for fatigue tracking) ─────────
const EXERCISE_MUSCLES = {
  squat:         [{ name: 'Quads', inc: 25 }, { name: 'Glutes', inc: 20 }, { name: 'Hamstrings', inc: 15 }],
  pushup:        [{ name: 'Chest', inc: 25 }, { name: 'Triceps', inc: 20 }, { name: 'Shoulders', inc: 15 }],
  bicepCurl:     [{ name: 'Biceps', inc: 30 }, { name: 'Forearms', inc: 15 }],
  shoulderPress: [{ name: 'Shoulders', inc: 30 }, { name: 'Triceps', inc: 20 }],
  deadlift:      [{ name: 'Hamstrings', inc: 25 }, { name: 'Glutes', inc: 20 }, { name: 'Back', inc: 25 }],
  lunge:         [{ name: 'Quads', inc: 25 }, { name: 'Glutes', inc: 20 }, { name: 'Hamstrings', inc: 10 }],
  plank:         [{ name: 'Core', inc: 25 }, { name: 'Shoulders', inc: 10 }],
};

// ── Canvas skeleton demo (Hologram Guide, Electric Violet glow) ─
const SKELETON_DEMO_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#060412;overflow:hidden}canvas{display:block;width:100%;height:100%}</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
function resize(){cv.width=window.innerWidth;cv.height=window.innerHeight}
resize();window.addEventListener('resize',resize);
const P={
  squat:{
    up:{head:[.50,.08],neck:[.50,.16],lSho:[.38,.20],rSho:[.62,.20],lElb:[.34,.34],rElb:[.66,.34],lWri:[.36,.48],rWri:[.64,.48],lHip:[.42,.50],rHip:[.58,.50],lKne:[.40,.68],rKne:[.60,.68],lAnk:[.40,.88],rAnk:[.60,.88]},
    down:{head:[.50,.18],neck:[.50,.26],lSho:[.37,.30],rSho:[.63,.30],lElb:[.28,.42],rElb:[.72,.42],lWri:[.28,.55],rWri:[.72,.55],lHip:[.42,.58],rHip:[.58,.58],lKne:[.36,.74],rKne:[.64,.74],lAnk:[.38,.88],rAnk:[.62,.88]}
  },
  pushup:{
    up:{head:[.50,.28],neck:[.50,.34],lSho:[.36,.36],rSho:[.64,.36],lElb:[.24,.44],rElb:[.76,.44],lWri:[.22,.58],rWri:[.78,.58],lHip:[.43,.52],rHip:[.57,.52],lKne:[.44,.66],rKne:[.56,.66],lAnk:[.44,.78],rAnk:[.56,.78]},
    down:{head:[.50,.40],neck:[.50,.46],lSho:[.37,.48],rSho:[.63,.48],lElb:[.30,.56],rElb:[.70,.56],lWri:[.26,.66],rWri:[.74,.66],lHip:[.43,.58],rHip:[.57,.58],lKne:[.44,.70],rKne:[.56,.70],lAnk:[.44,.82],rAnk:[.56,.82]}
  },
  bicepCurl:{
    up:{head:[.50,.08],neck:[.50,.16],lSho:[.38,.21],rSho:[.62,.21],lElb:[.36,.37],rElb:[.64,.37],lWri:[.36,.54],rWri:[.64,.54],lHip:[.42,.52],rHip:[.58,.52],lKne:[.40,.70],rKne:[.60,.70],lAnk:[.40,.88],rAnk:[.60,.88]},
    down:{head:[.50,.08],neck:[.50,.16],lSho:[.38,.21],rSho:[.62,.21],lElb:[.36,.37],rElb:[.64,.37],lWri:[.33,.26],rWri:[.67,.26],lHip:[.42,.52],rHip:[.58,.52],lKne:[.40,.70],rKne:[.60,.70],lAnk:[.40,.88],rAnk:[.60,.88]}
  },
  shoulderPress:{
    up:{head:[.50,.08],neck:[.50,.16],lSho:[.38,.21],rSho:[.62,.21],lElb:[.28,.10],rElb:[.72,.10],lWri:[.28,.02],rWri:[.72,.02],lHip:[.42,.52],rHip:[.58,.52],lKne:[.40,.70],rKne:[.60,.70],lAnk:[.40,.88],rAnk:[.60,.88]},
    down:{head:[.50,.08],neck:[.50,.16],lSho:[.38,.21],rSho:[.62,.21],lElb:[.24,.26],rElb:[.76,.26],lWri:[.30,.24],rWri:[.70,.24],lHip:[.42,.52],rHip:[.58,.52],lKne:[.40,.70],rKne:[.60,.70],lAnk:[.40,.88],rAnk:[.60,.88]}
  },
  deadlift:{
    up:{head:[.50,.08],neck:[.50,.16],lSho:[.38,.20],rSho:[.62,.20],lElb:[.36,.34],rElb:[.64,.34],lWri:[.38,.48],rWri:[.62,.48],lHip:[.42,.50],rHip:[.58,.50],lKne:[.40,.68],rKne:[.60,.68],lAnk:[.40,.88],rAnk:[.60,.88]},
    down:{head:[.50,.35],neck:[.50,.42],lSho:[.35,.44],rSho:[.65,.44],lElb:[.35,.54],rElb:[.65,.54],lWri:[.38,.65],rWri:[.62,.65],lHip:[.42,.62],rHip:[.58,.62],lKne:[.40,.74],rKne:[.60,.74],lAnk:[.40,.88],rAnk:[.60,.88]}
  },
  lunge:{
    up:{head:[.50,.08],neck:[.50,.16],lSho:[.38,.20],rSho:[.62,.20],lElb:[.34,.34],rElb:[.66,.34],lWri:[.36,.48],rWri:[.64,.48],lHip:[.42,.50],rHip:[.58,.50],lKne:[.40,.68],rKne:[.60,.68],lAnk:[.40,.88],rAnk:[.60,.88]},
    down:{head:[.48,.14],neck:[.48,.22],lSho:[.36,.26],rSho:[.60,.26],lElb:[.32,.40],rElb:[.62,.40],lWri:[.34,.54],rWri:[.64,.54],lHip:[.40,.54],rHip:[.56,.54],lKne:[.34,.70],rKne:[.62,.66],lAnk:[.30,.82],rAnk:[.68,.86]}
  },
  plank:{
    up:{head:[.50,.28],neck:[.50,.34],lSho:[.37,.37],rSho:[.63,.37],lElb:[.31,.50],rElb:[.69,.50],lWri:[.28,.60],rWri:[.72,.60],lHip:[.43,.52],rHip:[.57,.52],lKne:[.44,.66],rKne:[.56,.66],lAnk:[.44,.78],rAnk:[.56,.78]},
    down:{head:[.50,.29],neck:[.50,.35],lSho:[.37,.38],rSho:[.63,.38],lElb:[.30,.49],rElb:[.70,.49],lWri:[.27,.58],rWri:[.73,.58],lHip:[.43,.53],rHip:[.57,.53],lKne:[.44,.67],rKne:[.56,.67],lAnk:[.44,.79],rAnk:[.56,.79]}
  }
};
const CONN=[['head','neck'],['neck','lSho'],['neck','rSho'],['lSho','lElb'],['lElb','lWri'],['rSho','rElb'],['rElb','rWri'],['neck','lHip'],['neck','rHip'],['lHip','rHip'],['lHip','lKne'],['lKne','lAnk'],['rHip','rKne'],['rKne','rAnk']];
let key='squat',t=0,dir=1;
const SPD=0.014;
function lerp(a,b,t){return a+(b-a)*t}
function pose(){const p=P[key]||P.squat,u=p.up,d=p.down,r={};for(const k in u)r[k]=[lerp(u[k][0],d[k][0],t),lerp(u[k][1],d[k][1],t)];return r}
let glowT=0;
function draw(){
  const W=cv.width,H=cv.height;
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7);
  bg.addColorStop(0,'#0D0820');bg.addColorStop(1,'#060412');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  glowT+=0.04;
  const gPulse=0.18+Math.sin(glowT)*0.07;
  const p=pose();
  function px(j){return[p[j][0]*W,p[j][1]*H]}
  ctx.lineCap='round';
  for(const[a,b]of CONN){
    if(!p[a]||!p[b])continue;
    const[x1,y1]=px(a),[x2,y2]=px(b);
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.strokeStyle=\`rgba(124,92,252,\${gPulse})\`;ctx.lineWidth=18;ctx.stroke();
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.strokeStyle=\`rgba(124,92,252,\${0.55+Math.sin(glowT)*0.15})\`;ctx.lineWidth=4;ctx.stroke();
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.strokeStyle='rgba(180,160,255,0.9)';ctx.lineWidth=1.5;ctx.stroke();
  }
  for(const k in p){
    if(k==='head')continue;
    const[x,y]=px(k);
    ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);
    ctx.fillStyle='#00E5FF';ctx.shadowColor='#00E5FF';ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0;
  }
  if(p.head){
    const[hx,hy]=px('head');
    ctx.beginPath();ctx.arc(hx,hy,12,0,Math.PI*2);
    ctx.fillStyle='rgba(200,241,53,0.08)';ctx.strokeStyle=\`rgba(200,241,53,\${0.7+Math.sin(glowT)*0.3})\`;
    ctx.lineWidth=2;ctx.shadowColor='#C8F135';ctx.shadowBlur=14;
    ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  }
}
function tick(){t+=dir*SPD;if(t>=1){t=1;dir=-1}if(t<=0){t=0;dir=1}draw();requestAnimationFrame(tick)}
window.setExercise=function(k){key=k;t=0;dir=1};
tick();
<\/script>
</body>
</html>`;

// ── Helpers ─────────────────────────────────────────────────────
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

function scoreColor(pct) {
  if (pct >= 80) return '#C8F135';
  if (pct >= 55) return '#FF9500';
  return '#FF3B30';
}

function formatTimer(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
export default function WorkoutActive({ route, navigation }) {
  const { user } = useAuth();
  const rawKey      = route.params?.exerciseKey || route.params?.exerciseName || 'squat';
  const htmlKey     = resolveHtmlKey(rawKey);
  const displayName = rawKey.replace(/_/g, ' ').toUpperCase();

  // ── Refs ────────────────────────────────────────────────────
  const webViewRef        = useRef(null);
  const demoWebViewRef    = useRef(null);
  const startTimeRef      = useRef(Date.now());
  const formScoreSum      = useRef(0);
  const formScoreCount    = useRef(0);
  const isMountedRef      = useRef(true);
  const pulseLoopActive   = useRef(false);
  const timerIntervalRef  = useRef(null);
  const lastSpeechTimeRef = useRef(0);
  const lastCueRef        = useRef('');
  const repTimestampsRef  = useRef([]);
  const tapCountRef       = useRef(0);
  const tapTimerRef       = useRef(null);

  // ── Animated values ─────────────────────────────────────────
  const countScaleAnim   = useRef(new Animated.Value(0.3)).current;
  const countOpacityAnim = useRef(new Animated.Value(0)).current;
  const glowOpacityAnim  = useRef(new Animated.Value(0)).current;
  const syncScaleAnim    = useRef(new Animated.Value(0)).current;
  // Floating Yara Guide: single value 0=hidden → 1=visible
  const guideAnim        = useRef(new Animated.Value(0)).current;
  // Mic pulse indicator
  const micPulseAnim     = useRef(new Animated.Value(1)).current;

  // Interpolated guide animations (native driver — opacity + scale only)
  const guideScale   = guideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1]   });
  const guideOpacity = guideAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] });

  // ── State ───────────────────────────────────────────────────
  const [hasPermission,   setHasPermission]  = useState(null);
  const [htmlContent,     setHtmlContent]    = useState(null);
  const [cue,             setCue]            = useState('Get ready…');
  const [repCount,        setRepCount]       = useState(0);
  const [formScore,       setFormScore]      = useState(0);
  const [isCountingDown,  setIsCountingDown] = useState(true);
  const [countStep,       setCountStep]      = useState(null);
  const [timerSecs,       setTimerSecs]      = useState(0);
  const [timerRunning,    setTimerRunning]   = useState(false);
  const [inSync,          setInSync]         = useState(false);
  const [guideVisible,    setGuideVisible]   = useState(false);
  // Once true, keeps the guide WebView mounted for instant re-show
  const [guideEverShown,  setGuideEverShown] = useState(false);

  // ── Cleanup on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      isMountedRef.current    = false;
      pulseLoopActive.current = false;
      clearInterval(timerIntervalRef.current);
      clearTimeout(tapTimerRef.current);
      Speech.stop().catch(() => {});
    };
  }, []);

  // ── Hide tab bar ────────────────────────────────────────────
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => navigation.getParent()?.setOptions({
      tabBarStyle: { backgroundColor: '#0F0B1E', borderTopColor: '#1E1A35', height: 85, paddingBottom: 20 },
    });
  }, [navigation]);

  // ── Camera permission + HTML preload ────────────────────────
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
      }
    })();
  }, []);

  // ── Live timer ──────────────────────────────────────────────
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

  // ── Electric Violet screen glow on perfect form ─────────────
  useEffect(() => {
    Animated.timing(glowOpacityAnim, {
      toValue:  formScore === 100 ? 1 : 0,
      duration: formScore === 100 ? 500 : 200,
      useNativeDriver: true,
    }).start();
  }, [formScore, glowOpacityAnim]);

  // ── Mic pulse loop ──────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulseAnim, { toValue: 1.4, duration: 900, useNativeDriver: true }),
        Animated.timing(micPulseAnim, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [micPulseAnim]);

  // ── Yara's voice ─────────────────────────────────────────────
  const speakYara = useCallback((text) => {
    const now = Date.now();
    if (now - lastSpeechTimeRef.current < 2800) return;
    lastSpeechTimeRef.current = now;
    Speech.stop().catch(() => {});
    Speech.speak(text, { language: 'en-US', pitch: 1.1, rate: 0.88 });
  }, []);

  // ── IN SYNC detection ────────────────────────────────────────
  const updateSync = useCallback((count) => {
    const ts = repTimestampsRef.current;
    if (ts.length < 2 || count < 3) { setInSync(false); return; }
    const intervals = [];
    for (let i = 1; i < ts.length; i++) intervals.push(ts[i] - ts[i - 1]);
    const avg      = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((s, t) => s + Math.abs(t - avg), 0) / intervals.length;
    const consistent = avg > 800 && avg < 8000 && (variance / avg) < 0.35;
    if (consistent !== inSync) {
      setInSync(consistent);
      Animated.spring(syncScaleAnim, {
        toValue: consistent ? 1 : 0, tension: 220, friction: 7, useNativeDriver: true,
      }).start();
    }
  }, [inSync, syncScaleAnim]);

  // ── Floating Guide show / hide ────────────────────────────────
  const showGuide = useCallback(() => {
    setGuideEverShown(true);
    setGuideVisible(true);
    Animated.spring(guideAnim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
    if (htmlKey) {
      setTimeout(() => {
        demoWebViewRef.current?.injectJavaScript(
          `window.setExercise && window.setExercise('${htmlKey}'); true;`
        );
      }, 350);
    }
  }, [guideAnim, htmlKey]);

  const hideGuide = useCallback(() => {
    Animated.spring(guideAnim, { toValue: 0, tension: 200, friction: 8, useNativeDriver: true })
      .start(() => { setGuideVisible(false); });
  }, [guideAnim]);

  // ── Cinematic 3-2-1 countdown ─────────────────────────────
  const startCountdown = useCallback(() => {
    const steps = [3, 2, 1, 'GO!'];
    let i = 0;

    const runPulse = () => {
      if (!pulseLoopActive.current || !isMountedRef.current) return;
      Animated.sequence([
        Animated.timing(countScaleAnim, { toValue: 1.12, duration: 260, useNativeDriver: true }),
        Animated.timing(countScaleAnim, { toValue: 1.00, duration: 260, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) runPulse(); });
    };

    const showStep = () => {
      if (!isMountedRef.current) return;
      if (i >= steps.length) {
        setIsCountingDown(false);
        setCountStep(null);
        webViewRef.current?.injectJavaScript('window.startCamera && window.startCamera(); true;');
        startTimeRef.current = Date.now();
        setTimerRunning(true);
        setTimeout(() => speakYara('Follow the hologram. Match the tempo.'), 600);
        return;
      }
      const val = steps[i];
      setCountStep(val);
      pulseLoopActive.current = false;
      countScaleAnim.setValue(0.25);
      countOpacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(countScaleAnim, { toValue: 1, tension: 220, friction: 7, useNativeDriver: true }),
        Animated.timing(countOpacityAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start(() => {
        pulseLoopActive.current = true;
        runPulse();
        const hold = val === 'GO!' ? 800 : 700;
        setTimeout(() => {
          if (!isMountedRef.current) return;
          pulseLoopActive.current = false;
          Animated.timing(countOpacityAnim, { toValue: 0, duration: 200, useNativeDriver: true })
            .start(() => { i++; showStep(); });
        }, hold);
      });
    };

    showStep();
  }, [countScaleAnim, countOpacityAnim, speakYara]);

  useEffect(() => { startCountdown(); }, [startCountdown]);

  // ── WebView message bridge ──────────────────────────────────
  const onMessage = useCallback((e) => {
    const data = e.nativeEvent.data;

    if (data === 'AI_READY') {
      if (htmlKey) {
        webViewRef.current?.injectJavaScript(
          `window.applyExerciseChange && window.applyExerciseChange('${htmlKey}'); true;`
        );
      }
      webViewRef.current?.injectJavaScript('window.startAI && window.startAI(); true;');
      setTimeout(() => speakYara("I'm watching your form. Begin when you are ready."), 400);
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
        const isBadForm = msg.text && !msg.text.includes('Great form') && !msg.text.includes('Detecting');
        if (isBadForm && msg.text !== lastCueRef.current) {
          lastCueRef.current = msg.text;
          speakYara(msg.text);
        }
      }

      if (msg.type === 'REP_COUNTED') {
        setRepCount(msg.count);
        repTimestampsRef.current = [...repTimestampsRef.current.slice(-4), Date.now()];
        updateSync(msg.count);
        if (msg.count % 3 === 0) {
          speakYara(BREATHING_TIPS[Math.floor(msg.count / 3 - 1) % BREATHING_TIPS.length]);
        } else {
          speakYara(REP_PHRASES[(msg.count - 1) % REP_PHRASES.length]);
        }
      }

      if (msg.type === 'CALIBRATED') {
        speakYara('Body detected. Calibration complete.');
      }

      if (msg.type === 'SYNC_STATUS') {
        const s = !!msg.inSync;
        setInSync(s);
        Animated.spring(syncScaleAnim, {
          toValue: s ? 1 : 0, tension: 220, friction: 7, useNativeDriver: true,
        }).start();
      }

      // ── Voice commands from Web Speech API (ai_coach.html) ─
      if (msg.type === 'VOICE_COMMAND') {
        if (msg.command === 'show_guide') {
          showGuide();
          // Slight delay so guide is visible when Yara speaks
          setTimeout(() => speakYara('Certainly. Watch the hologram for the correct form.'), 400);
        } else if (msg.command === 'hide_guide') {
          hideGuide();
          speakYara('Guide closed.');
        } else if (msg.command === 'finish') {
          speakYara('Finishing session.');
          setTimeout(() => {
            webViewRef.current?.injectJavaScript('if (window.getSessionState) window.getSessionState(); true;');
          }, 800);
        }
      }

      if (msg.type === 'SESSION_COMPLETE') {
        const elapsed      = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const avgFormScore = formScoreCount.current > 0
          ? Math.round(formScoreSum.current / formScoreCount.current)
          : (msg.score ?? 0);
        const calories = Math.max(1, msg.reps * 5);

        setTimerRunning(false);
        Speech.stop().catch(() => {});
        speakYara(msg.reps > 0 ? `Session complete! ${msg.reps} reps. Incredible work!` : 'Session saved. Great effort!');

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

            try {
              const TODAY = new Date().toISOString().split('T')[0];
              const { data: existing } = await supabase
                .from('daily_activity')
                .select('id, calories_burned')
                .eq('user_id', user.id)
                .eq('date', TODAY)
                .maybeSingle();

              const newTotal = (existing?.calories_burned || 0) + calories;
              if (existing) {
                await supabase.from('daily_activity').update({ calories_burned: newTotal }).eq('id', existing.id);
              } else {
                await supabase.from('daily_activity').insert({ user_id: user.id, date: TODAY, calories_burned: newTotal });
              }
            } catch (e) {
              console.error('[BodyQ] daily_activity:', e.message);
            }

            // ── Update muscle fatigue ───────────────────────────
            const muscles = EXERCISE_MUSCLES[htmlKey] || [];
            if (muscles.length > 0) {
              try {
                const { data: currentRows } = await supabase
                  .from('muscle_fatigue')
                  .select('muscle_name, fatigue_pct')
                  .eq('user_id', user.id)
                  .in('muscle_name', muscles.map(m => m.name));

                const currentMap = {};
                (currentRows || []).forEach(r => { currentMap[r.muscle_name] = r.fatigue_pct; });

                const upserts = muscles.map(m => ({
                  user_id:      user.id,
                  muscle_name:  m.name,
                  fatigue_pct:  Math.min(100, (currentMap[m.name] || 0) + m.inc),
                  last_updated: new Date().toISOString(),
                }));

                await supabase
                  .from('muscle_fatigue')
                  .upsert(upserts, { onConflict: 'user_id,muscle_name' });
              } catch (e) {
                console.error('[BodyQ] muscle_fatigue:', e.message);
              }
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
  }, [navigation, displayName, htmlKey, rawKey, user, speakYara, updateSync, syncScaleAnim, showGuide, hideGuide]);

  const handleFinish = useCallback(() => {
    webViewRef.current?.injectJavaScript('if (window.getSessionState) window.getSessionState(); true;');
  }, []);

  // ── Double-tap camera area → finish ──────────────────────────
  const handleDoubleTap = useCallback(() => {
    if (isCountingDown) return;
    tapCountRef.current += 1;
    if (tapCountRef.current === 1) {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 400);
    } else if (tapCountRef.current >= 2) {
      clearTimeout(tapTimerRef.current);
      tapCountRef.current = 0;
      speakYara('Finishing session.');
      setTimeout(() => {
        webViewRef.current?.injectJavaScript('if (window.getSessionState) window.getSessionState(); true;');
      }, 800);
    }
  }, [isCountingDown, speakYara]);

  // ── Unsupported / No permission screens ────────────────────
  if (htmlKey === null) {
    return (
      <View style={[s.container, s.center]}>
        <StatusBar hidden />
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🤖</Text>
        <Text style={s.errorTitle}>AI Tracking Unavailable</Text>
        <Text style={s.errorSub}>This exercise isn't supported yet.</Text>
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
        <Text style={s.errorTitle}>Camera Permission Denied</Text>
        <TouchableOpacity style={s.backLink} onPress={() => navigation.goBack()}>
          <Text style={s.backLinkTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ring = scoreColor(formScore);

  return (
    <View style={s.container}>
      <StatusBar hidden />

      {/* ══ FULL-SCREEN AI CAMERA ══════════════════════════════ */}
      {htmlContent && (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent, baseUrl: 'https://localhost' }}
          style={[StyleSheet.absoluteFillObject, isCountingDown && { opacity: 0 }]}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState={false}
          onPermissionRequest={e => e.grant(e.resources)}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          onMessage={onMessage}
        />
      )}

      {/* ── Double-tap invisible overlay (large gesture finish) ─ */}
      {!isCountingDown && (
        <TouchableOpacity
          activeOpacity={1}
          style={s.doubleTapZone}
          onPress={handleDoubleTap}
        />
      )}

      {/* ══ HUD LAYER (all glass, absolutePositioned) ══════════ */}
      {!isCountingDown && (
        <>
          {/* Top-left: Live AI status + exercise name */}
          <BlurView intensity={30} tint="dark" style={s.liveTag}>
            <View style={s.liveDot} />
            <Text style={s.liveLabel}>{displayName}</Text>
          </BlurView>

          {/* Top-right: Form score + Hologram toggle */}
          <View style={s.topRightCol}>
            <BlurView intensity={40} tint="dark" style={s.formPill}>
              <Text style={[s.formScore, { color: ring }]}>{formScore}</Text>
              <Text style={s.formLabel}>FORM</Text>
            </BlurView>
            <TouchableOpacity
              style={[s.guideToggleBtn, guideVisible && s.guideToggleBtnActive]}
              onPress={guideVisible ? hideGuide : showGuide}
            >
              <Animated.View style={{ transform: [{ scale: micPulseAnim }] }}>
                <Ionicons name="body-outline" size={15} color={guideVisible ? '#C8F135' : '#7C5CFC'} />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Mic voice listener indicator (bottom-left) */}
          <BlurView intensity={20} tint="dark" style={s.micTag}>
            <Ionicons name="mic-outline" size={10} color="rgba(124,92,252,0.8)" />
            <Text style={s.micLabel}>YARA ACTIVE</Text>
          </BlurView>
        </>
      )}

      {/* ══ FLOATING YARA HOLOGRAM GUIDE (spring pop-up) ════════ */}
      {guideEverShown && (
        <Animated.View
          pointerEvents={guideVisible ? 'box-none' : 'none'}
          style={[s.guideCard, { opacity: guideOpacity, transform: [{ scale: guideScale }] }]}
        >
          {/* Glassmorphism background */}
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={s.guideCardInner}>
            {/* Guide header */}
            <View style={s.guideHeader}>
              <View style={s.guidePulseDot} />
              <Text style={s.guideTitle}>HOLOGRAM</Text>
              <TouchableOpacity onPress={hideGuide} style={s.guideCloseBtn}>
                <Ionicons name="close" size={12} color="rgba(255,255,255,0.45)" />
              </TouchableOpacity>
            </View>

            {/* Skeleton demo WebView */}
            <View style={s.guideWebViewWrap}>
              <WebView
                ref={demoWebViewRef}
                originWhitelist={['*']}
                source={{ html: SKELETON_DEMO_HTML }}
                style={StyleSheet.absoluteFillObject}
                scrollEnabled={false}
                bounces={false}
                javaScriptEnabled
                onLoad={() => {
                  if (htmlKey) {
                    demoWebViewRef.current?.injectJavaScript(
                      `window.setExercise && window.setExercise('${htmlKey}'); true;`
                    );
                  }
                }}
              />
            </View>

            {/* Exercise label */}
            <Text style={s.guideName} numberOfLines={1}>{displayName}</Text>
            <Text style={s.guideHint}>Say "Yara, close" to hide</Text>
          </View>

          {/* Electric Violet border glow */}
          <View style={s.guideBorder} pointerEvents="none" />
        </Animated.View>
      )}

      {/* ══ CUE TEXT PILL (above HUD bar) ══════════════════════ */}
      {!isCountingDown && (
        <BlurView intensity={40} tint="dark" style={s.cuePill}>
          <Ionicons name="sparkles" size={11} color="#C8F135" style={{ marginRight: 6 }} />
          <Text style={s.cueText} numberOfLines={1}>{cue}</Text>
        </BlurView>
      )}

      {/* ══ BOTTOM GLASS HUD BAR ════════════════════════════════ */}
      {!isCountingDown && (
        <BlurView intensity={65} tint="dark" style={s.hudBar}>
          {/* Rep counter */}
          <View style={s.hudRepWrap}>
            <Text style={s.hudRepNum}>{repCount}</Text>
            <Text style={s.hudRepLabel}>REPS</Text>
          </View>

          {/* IN SYNC badge */}
          <Animated.View style={[s.syncBadge, { transform: [{ scale: syncScaleAnim }] }]}>
            <Ionicons name="sync" size={9} color="#000" />
            <Text style={s.syncTxt}> IN SYNC</Text>
          </Animated.View>

          {/* Timer + Finish */}
          <View style={s.hudRight}>
            <View style={s.hudTimerWrap}>
              <Text style={s.hudTimerNum}>{formatTimer(timerSecs)}</Text>
              <Text style={s.hudTimerLabel}>ELAPSED</Text>
            </View>
            <TouchableOpacity style={s.finishBtn} onPress={handleFinish}>
              <Ionicons name="checkmark" size={17} color="#000" />
            </TouchableOpacity>
          </View>
        </BlurView>
      )}

      {/* ══ PERFECT FORM — SCREEN EDGE GLOW ════════════════════ */}
      <Animated.View
        pointerEvents="none"
        style={[s.screenGlow, { opacity: glowOpacityAnim }]}
      />

      {/* ══ CINEMATIC COUNTDOWN OVERLAY ═══════════════════════ */}
      {isCountingDown && (
        <View style={s.countdownOverlay}>
          <Text style={s.countdownExercise}>{displayName}</Text>

          {countStep !== null && (
            <Animated.Text
              style={[
                s.countdownNum,
                countStep === 'GO!' && s.countdownGo,
                { opacity: countOpacityAnim, transform: [{ scale: countScaleAnim }] },
              ]}
            >
              {countStep}
            </Animated.Text>
          )}

          <Text style={s.countdownHint}>Step back for full-body tracking.</Text>

          <TouchableOpacity style={s.skipBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.3)" />
            <Text style={s.skipTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0B1E' },

  // ── Double-tap zone ─────────────────────────────────────────
  doubleTapZone: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 90,
    zIndex: 20,
  },

  // ── Top-left: Live AI tag ────────────────────────────────────
  liveTag: {
    position: 'absolute', top: 52, left: 16,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, overflow: 'hidden',
    paddingHorizontal: 12, paddingVertical: 7,
    zIndex: 40,
  },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C8F135', marginRight: 7, shadowColor: '#C8F135', shadowOpacity: 1, shadowRadius: 5 },
  liveLabel: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },

  // ── Top-right: Form + Guide toggle ──────────────────────────
  topRightCol: {
    position: 'absolute', top: 44, right: 16,
    alignItems: 'center', gap: 10,
    zIndex: 40,
  },
  formPill: {
    borderRadius: 28, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  formScore: { fontSize: 24, fontWeight: '900', lineHeight: 26 },
  formLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  guideToggleBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(124,92,252,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(124,92,252,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  guideToggleBtnActive: {
    backgroundColor: 'rgba(200,241,53,0.12)',
    borderColor: '#C8F135',
  },

  // ── Mic voice indicator (bottom-left) ───────────────────────
  micTag: {
    position: 'absolute', bottom: 100, left: 16,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, overflow: 'hidden',
    paddingHorizontal: 8, paddingVertical: 5,
    zIndex: 40,
  },
  micLabel: { color: 'rgba(124,92,252,0.7)', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginLeft: 4 },

  // ── Floating Yara Hologram Guide card ───────────────────────
  guideCard: {
    position: 'absolute',
    bottom: 100, right: 16,
    width: 152, height: 215,
    borderRadius: 22,
    overflow: 'hidden',
    zIndex: 60,
  },
  guideCardInner: {
    flex: 1,
    padding: 10,
  },
  guideHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 8,
  },
  guidePulseDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#7C5CFC',
    marginRight: 6,
    shadowColor: '#7C5CFC', shadowOpacity: 1, shadowRadius: 6,
  },
  guideTitle: {
    color: 'rgba(255,255,255,0.55)', fontSize: 8,
    fontWeight: '900', letterSpacing: 1.5, flex: 1,
  },
  guideCloseBtn: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  guideWebViewWrap: {
    flex: 1, borderRadius: 14, overflow: 'hidden',
    backgroundColor: '#060412',
  },
  guideName: {
    color: '#FFF', fontSize: 9, fontWeight: '900',
    letterSpacing: 0.5, marginTop: 7, textAlign: 'center',
  },
  guideHint: {
    color: 'rgba(124,92,252,0.6)', fontSize: 7,
    fontWeight: '700', textAlign: 'center', marginTop: 3,
  },
  guideBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(124,92,252,0.5)',
  },

  // ── Cue pill (above HUD bar) ─────────────────────────────────
  cuePill: {
    position: 'absolute', bottom: 96, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, overflow: 'hidden',
    paddingHorizontal: 14, paddingVertical: 10,
    zIndex: 40,
  },
  cueText: { color: '#FFF', fontSize: 12, fontWeight: '700', flex: 1 },

  // ── Bottom glass HUD bar ─────────────────────────────────────
  hudBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28,
    overflow: 'hidden',
    zIndex: 40,
  },
  hudRepWrap:     { alignItems: 'center', minWidth: 52 },
  hudRepNum:      { color: '#C8F135', fontSize: 34, fontWeight: '900', lineHeight: 36, textShadowColor: 'rgba(200,241,53,0.4)', textShadowRadius: 10 },
  hudRepLabel:    { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  hudRight:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hudTimerWrap:   { alignItems: 'center' },
  hudTimerNum:    { color: 'rgba(255,255,255,0.8)', fontSize: 17, fontWeight: '900', letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  hudTimerLabel:  { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#C8F135', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#C8F135', shadowOpacity: 0.8, shadowRadius: 10,
  },
  syncTxt:  { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  finishBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#C8F135',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C8F135', shadowOpacity: 0.6, shadowRadius: 10,
  },

  // ── Screen edge glow (perfect form) ─────────────────────────
  screenGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 4,
    borderColor: '#7C5CFC',
    borderRadius: 0,
    shadowColor: '#7C5CFC', shadowOpacity: 1, shadowRadius: 30,
    zIndex: 30, pointerEvents: 'none',
  },

  // ── Countdown overlay ────────────────────────────────────────
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  countdownExercise: {
    color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: '900',
    letterSpacing: 4, textTransform: 'uppercase', marginBottom: 32,
  },
  countdownNum: {
    fontSize: 160, fontWeight: '900', color: '#C8F135',
    lineHeight: 168, letterSpacing: -8,
    textShadowColor: 'rgba(200,241,53,0.5)', textShadowRadius: 60,
    textShadowOffset: { width: 0, height: 0 },
  },
  countdownGo: { fontSize: 80, letterSpacing: 12, lineHeight: 88 },
  countdownHint: {
    color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '600',
    letterSpacing: 0.5, marginTop: 40,
  },
  skipBtn: {
    position: 'absolute', bottom: 56,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  skipTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' },

  // ── Fallback screens ─────────────────────────────────────────
  errorTitle:   { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  errorSub:     { color: '#6B5F8A', fontSize: 14, textAlign: 'center', paddingHorizontal: 30 },
  backLink:     { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#C8F135' },
  backLinkTxt:  { color: '#C8F135', fontWeight: '700' },
});
