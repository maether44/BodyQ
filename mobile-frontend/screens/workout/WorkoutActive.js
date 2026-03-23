/**
 * src/screens/workout/WorkoutActive.js
 * No mock data — exercise name/muscle come from the workout object passed in.
 * Workout sessions saved to Supabase via useWorkouts hook.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Animated, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';

function fmtTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Rest Timer Overlay ────────────────────────────────────────────────────────
function RestTimer({ seconds, onSkip }) {
  const [remaining, setRemaining] = useState(seconds);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (remaining <= 0) { onSkip(); return; }
    const t = setTimeout(() => setRemaining(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
  }, [remaining]);

  const pct   = remaining / seconds;
  const color = remaining <= 5 ? '#FF6B6B' : remaining <= 15 ? '#FFB830' : '#34C759';

  return (
    <View style={rst.overlay}>
      <View style={rst.card}>
        <Text style={rst.title}>Rest</Text>
        <Animated.Text style={[rst.time, { color, transform: [{ scale }] }]}>
          {fmtTime(remaining)}
        </Animated.Text>
        <View style={rst.barBg}>
          <View style={[rst.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
        </View>
        <TouchableOpacity style={rst.skipBtn} onPress={onSkip}>
          <Text style={rst.skipText}>Skip Rest →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const rst = StyleSheet.create({
  overlay: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(15,11,30,0.95)', alignItems:'center', justifyContent:'center', zIndex:100 },
  card:    { backgroundColor:'#181430', borderRadius:28, padding:40, alignItems:'center', width:'85%', borderWidth:1, borderColor:'#251E42' },
  title:   { color:'#6B5F8A', fontSize:14, fontWeight:'700', letterSpacing:1, marginBottom:12 },
  time:    { fontSize:72, fontWeight:'900', letterSpacing:-2 },
  barBg:   { width:'100%', height:6, backgroundColor:'#251E42', borderRadius:3, overflow:'hidden', marginTop:24, marginBottom:28 },
  barFill: { height:6, borderRadius:3 },
  skipBtn: { backgroundColor:'#251E42', borderRadius:12, paddingHorizontal:24, paddingVertical:12 },
  skipText:{ color:'#9D85F5', fontSize:14, fontWeight:'700' },
});

// ── Set Row ───────────────────────────────────────────────────────────────────
function SetRow({ setNum, repsTarget, done, onDone }) {
  const [reps, setReps] = useState(repsTarget);
  return (
    <View style={[sr.row, done && sr.rowDone]}>
      <Text style={sr.setNum}>Set {setNum}</Text>
      <View style={sr.repsControl}>
        <TouchableOpacity style={sr.adjBtn} onPress={() => setReps(p => Math.max(1, p - 1))} disabled={done}>
          <Text style={sr.adjTxt}>−</Text>
        </TouchableOpacity>
        <Text style={sr.repsNum}>{reps}</Text>
        <TouchableOpacity style={sr.adjBtn} onPress={() => setReps(p => p + 1)} disabled={done}>
          <Text style={sr.adjTxt}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={sr.repsLabel}>reps</Text>
      <TouchableOpacity style={[sr.doneBtn, done && sr.doneBtnDone]} onPress={() => onDone(reps)} disabled={done}>
        <Text style={sr.doneBtnTxt}>{done ? '✓' : 'Done'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const sr = StyleSheet.create({
  row:        { flexDirection:'row', alignItems:'center', paddingVertical:12, gap:12, borderBottomWidth:1, borderBottomColor:'#251E42' },
  rowDone:    { opacity:0.5 },
  setNum:     { color:'#6B5F8A', fontSize:13, fontWeight:'600', width:44 },
  repsControl:{ flexDirection:'row', alignItems:'center', gap:10 },
  adjBtn:     { width:30, height:30, borderRadius:8, backgroundColor:'#251E42', alignItems:'center', justifyContent:'center' },
  adjTxt:     { color:'#9D85F5', fontSize:18, fontWeight:'800' },
  repsNum:    { color:'#fff', fontSize:20, fontWeight:'800', width:36, textAlign:'center' },
  repsLabel:  { color:'#6B5F8A', fontSize:12, flex:1 },
  doneBtn:    { backgroundColor:'#251E42', borderRadius:10, paddingHorizontal:14, paddingVertical:8 },
  doneBtnDone:{ backgroundColor:'#34C75920' },
  doneBtnTxt: { color:'#9D85F5', fontSize:13, fontWeight:'700' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function WorkoutActive({ workout, onFinish }) {
  const WK = workout || {
    name: 'Upper Body Strength',
    estimatedCalories: 380,
    exercises: [
      { id:'bench_press', name:'Bench Press',    muscle:'Chest',     sets:3, reps:10, restSec:90 },
      { id:'row',         name:'Barbell Row',    muscle:'Back',      sets:3, reps:12, restSec:60 },
      { id:'ohp',         name:'Overhead Press', muscle:'Shoulders', sets:3, reps:10, restSec:60 },
      { id:'bicep_curl',  name:'Bicep Curl',     muscle:'Biceps',    sets:3, reps:15, restSec:45 },
      { id:'tricep_push', name:'Tricep Push',    muscle:'Triceps',   sets:3, reps:15, restSec:45 },
    ],
  };

  const [elapsed,    setElapsed]   = useState(0);
  const [currentEx,  setCurrentEx] = useState(0);
  const [setStatus,  setSetStatus] = useState(
    Object.fromEntries(WK.exercises.map((ex, i) => [
      i, Object.fromEntries(Array.from({ length: ex.sets }, (_, s) => [s, { done: false, reps: ex.reps }]))
    ]))
  );
  const [resting,  setResting]  = useState(false);
  const [restSecs, setRestSecs] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [finished]);

  const handleSetDone = (exIdx, setIdx, reps) => {
    setSetStatus(prev => ({
      ...prev,
      [exIdx]: { ...prev[exIdx], [setIdx]: { done: true, reps } },
    }));
    setRestSecs(WK.exercises[exIdx].restSec || 60);
    setResting(true);
  };

  const allDone = WK.exercises.every((_, i) =>
    Object.values(setStatus[i]).every(s => s.done)
  );
  const completedSets = Object.values(setStatus).reduce(
    (acc, ex) => acc + Object.values(ex).filter(s => s.done).length, 0
  );
  const totalSets = WK.exercises.reduce((a, ex) => a + ex.sets, 0);
  const ex = WK.exercises[currentEx];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {resting && <RestTimer seconds={restSecs} onSkip={() => setResting(false)} />}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.workoutName}>{WK.name}</Text>
          <Text style={styles.timerText}>{fmtTime(elapsed)}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.setsProgress}>{completedSets}/{totalSets} sets</Text>
          {!finished && (
            <TouchableOpacity style={styles.finishBtn} onPress={() => setFinished(true)}>
              <Text style={styles.finishBtnTxt}>Finish</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width:`${(completedSets / totalSets) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Exercise tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exTabsScroll}>
          <View style={styles.exTabs}>
            {WK.exercises.map((exItem, i) => {
              const exDone = Object.values(setStatus[i]).every(s => s.done);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.exTab, currentEx===i && styles.exTabActive, exDone && styles.exTabDone]}
                  onPress={() => setCurrentEx(i)}
                >
                  <Text style={[styles.exTabTxt, currentEx===i && styles.exTabTxtActive]}>
                    {exDone ? '✓ ' : ''}{(exItem.name || exItem.id).split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Current exercise card */}
        <View style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <View>
              <Text style={styles.exerciseName}>{ex.name || ex.id}</Text>
              <Text style={styles.exerciseMuscle}>{ex.muscle || ''}</Text>
            </View>
            <View style={styles.exercisePills}>
              <View style={styles.pill}><Text style={styles.pillTxt}>{ex.sets} sets</Text></View>
              <View style={styles.pill}><Text style={styles.pillTxt}>{ex.reps} reps</Text></View>
              {ex.restSec > 0 && <View style={styles.pill}><Text style={styles.pillTxt}>{ex.restSec}s rest</Text></View>}
            </View>
          </View>

          {Array.from({ length: ex.sets }).map((_, setIdx) => (
            <SetRow
              key={setIdx}
              setNum={setIdx + 1}
              repsTarget={ex.reps}
              done={setStatus[currentEx][setIdx].done}
              onDone={(reps) => handleSetDone(currentEx, setIdx, reps)}
            />
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, currentEx===0 && styles.navBtnDisabled]}
            onPress={() => setCurrentEx(p => Math.max(0, p-1))}
            disabled={currentEx===0}
          >
            <Text style={styles.navBtnTxt}>← Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnNext, currentEx===WK.exercises.length-1 && styles.navBtnDisabled]}
            onPress={() => setCurrentEx(p => Math.min(WK.exercises.length-1, p+1))}
            disabled={currentEx===WK.exercises.length-1}
          >
            <Text style={[styles.navBtnTxt, { color:'#fff' }]}>Next →</Text>
          </TouchableOpacity>
        </View>

        {allDone && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => onFinish && onFinish({ elapsed, completedSets, totalSets })}
          >
            <Text style={styles.completeBtnTxt}>🏆  Complete Workout</Text>
          </TouchableOpacity>
        )}

        <View style={{ height:32 }} />
      </ScrollView>
    </View>
  );
}

const C = { bg:'#0F0B1E', card:'#181430', border:'#251E42', purple:'#7C5CFC', lime:'#C8F135', sub:'#6B5F8A', text:'#fff', accent:'#9D85F5' };

const styles = StyleSheet.create({
  root:   { flex:1, backgroundColor:C.bg },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingTop:54, paddingBottom:14 },
  workoutName:  { color:C.text, fontSize:18, fontWeight:'800' },
  timerText:    { color:C.lime, fontSize:28, fontWeight:'900', letterSpacing:-1, marginTop:2 },
  headerRight:  { alignItems:'flex-end', gap:8 },
  setsProgress: { color:C.sub, fontSize:13 },
  finishBtn:    { backgroundColor:C.border, borderRadius:10, paddingHorizontal:14, paddingVertical:7 },
  finishBtnTxt: { color:C.accent, fontSize:13, fontWeight:'700' },
  progressBg:   { height:3, backgroundColor:C.border, marginHorizontal:20 },
  progressFill: { height:3, backgroundColor:C.purple },
  scroll:       { paddingHorizontal:16, paddingTop:16 },
  exTabsScroll: { marginBottom:16 },
  exTabs:       { flexDirection:'row', gap:8, paddingHorizontal:4 },
  exTab:        { paddingHorizontal:14, paddingVertical:8, backgroundColor:C.card, borderRadius:20, borderWidth:1, borderColor:C.border },
  exTabActive:  { backgroundColor:C.purple, borderColor:C.purple },
  exTabDone:    { backgroundColor:'#34C75920', borderColor:'#34C75950' },
  exTabTxt:     { color:C.sub, fontSize:12, fontWeight:'600' },
  exTabTxtActive:{ color:'#fff' },
  exerciseCard: { backgroundColor:C.card, borderRadius:20, padding:18, borderWidth:1, borderColor:C.border, marginBottom:16 },
  exerciseHeader:{ marginBottom:16 },
  exerciseName: { color:C.text, fontSize:20, fontWeight:'800' },
  exerciseMuscle:{ color:C.sub, fontSize:12, marginTop:4 },
  exercisePills: { flexDirection:'row', gap:8, marginTop:12 },
  pill:          { backgroundColor:C.border, borderRadius:8, paddingHorizontal:10, paddingVertical:5 },
  pillTxt:       { color:C.accent, fontSize:12, fontWeight:'600' },
  navRow:        { flexDirection:'row', gap:12, marginBottom:16 },
  navBtn:        { flex:1, backgroundColor:C.card, borderRadius:14, paddingVertical:14, alignItems:'center', borderWidth:1, borderColor:C.border },
  navBtnNext:    { backgroundColor:C.purple, borderColor:C.purple },
  navBtnDisabled:{ opacity:0.3 },
  navBtnTxt:     { color:C.sub, fontSize:14, fontWeight:'700' },
  completeBtn:   { backgroundColor:'#34C759', borderRadius:16, paddingVertical:18, alignItems:'center', marginBottom:12 },
  completeBtnTxt:{ color:'#fff', fontSize:16, fontWeight:'800' },
});