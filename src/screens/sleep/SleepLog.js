import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text, TouchableOpacity,
    View,
} from 'react-native';

const QUALITY_OPTIONS = [
  { value: 1, label: 'Very Poor',  emoji: '😫', color: '#FF3B30' },
  { value: 2, label: 'Poor',       emoji: '😕', color: '#FF9500' },
  { value: 3, label: 'Okay',       emoji: '😐', color: '#FFD60A' },
  { value: 4, label: 'Good',       emoji: '😊', color: '#34C759' },
  { value: 5, label: 'Excellent',  emoji: '😄', color: '#30D158' },
];

const HOUR_OPTIONS = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

const SLEEP_INSIGHTS = {
  1: "Poor sleep hurts recovery and performance. Try to get to bed earlier tonight.",
  2: "Below average. Your recovery score tomorrow will likely be reduced.",
  3: "Decent — you're functional but not fully recovered. Aim for 7.5+ tonight.",
  4: "Good sleep. Your body had time to repair and recover properly.",
  5: "Excellent! You're fully recovered. Expect a great performance today.",
};

export default function SleepLog({ onSave, onClose }) {
  const [hours, setHours]     = useState(7.5);
  const [quality, setQuality] = useState(null);
  const [bedtime, setBedtime] = useState('11:00 PM');
  const [wakeTime, setWakeTime] = useState('6:30 AM');
  const [saved, setSaved]     = useState(false);

  const canSave = quality !== null;

  const BEDTIMES  = ['9:00 PM','9:30 PM','10:00 PM','10:30 PM','11:00 PM','11:30 PM','12:00 AM','12:30 AM','1:00 AM'];
  const WAKETIMES = ['4:00 AM','4:30 AM','5:00 AM','5:30 AM','6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM'];

  const qualityObj = QUALITY_OPTIONS.find(q => q.value === quality);
  const sleepColor =
    hours >= 8 ? '#34C759' :
    hours >= 7 ? '#9D85F5' :
    hours >= 6 ? '#FF9500' : '#FF3B30';

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      if (onSave) onSave({ hours, quality, bedtime, wakeTime });
    }, 1200);
  };

  if (saved) {
    return (
      <View style={styles.root}>
        <View style={styles.successWrap}>
          <Text style={styles.successEmoji}>😴</Text>
          <Text style={styles.successTitle}>Sleep Logged!</Text>
          <Text style={styles.successSub}>{hours} hours · {qualityObj?.label}</Text>
          <Text style={[styles.successNote, { color: sleepColor }]}>
            {SLEEP_INSIGHTS[quality]}
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnTxt}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeTxt}>✕</Text></TouchableOpacity>
          <Text style={styles.title}>🌙 Log Sleep</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.sectionLabel}>How many hours did you sleep?</Text>

        {/* Hours display */}
        <View style={styles.hoursDisplay}>
          <Text style={[styles.hoursNum, { color: sleepColor }]}>{hours}</Text>
          <Text style={styles.hoursUnit}>hours</Text>
        </View>

        {/* Hours selector */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.hoursScroll}
          contentContainerStyle={styles.hoursRow}
        >
          {HOUR_OPTIONS.map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.hourChip, hours === h && styles.hourChipActive, hours === h && { borderColor: sleepColor }]}
              onPress={() => setHours(h)}
            >
              <Text style={[styles.hourChipTxt, hours === h && { color: sleepColor }]}>{h}h</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sleep goal indicator */}
        <View style={styles.goalBar}>
          <View style={styles.goalBarBg}>
            <View style={[styles.goalBarFill, { width: `${Math.min(hours / 10, 1) * 100}%`, backgroundColor: sleepColor }]} />
            <View style={styles.goalLine} />
          </View>
          <View style={styles.goalBarLabels}>
            <Text style={styles.goalBarLabel}>0h</Text>
            <Text style={[styles.goalBarLabel, { color: '#9D85F5' }]}>Goal: 8h</Text>
            <Text style={styles.goalBarLabel}>10h</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Sleep quality</Text>

        {/* Quality selector */}
        <View style={styles.qualityRow}>
          {QUALITY_OPTIONS.map(q => (
            <TouchableOpacity
              key={q.value}
              style={[styles.qualityBtn, quality === q.value && styles.qualityBtnActive, quality === q.value && { borderColor: q.color }]}
              onPress={() => setQuality(q.value)}
            >
              <Text style={styles.qualityEmoji}>{q.emoji}</Text>
              <Text style={[styles.qualityLabel, quality === q.value && { color: q.color }]}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Times */}
        <Text style={styles.sectionLabel}>Times</Text>
        <View style={styles.timesRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Bedtime</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timeChips}>
                {BEDTIMES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, bedtime === t && styles.timeChipActive]}
                    onPress={() => setBedtime(t)}
                  >
                    <Text style={[styles.timeChipTxt, bedtime === t && styles.timeChipTxtActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Wake Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timeChips}>
                {WAKETIMES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, wakeTime === t && styles.timeChipActive]}
                    onPress={() => setWakeTime(t)}
                  >
                    <Text style={[styles.timeChipTxt, wakeTime === t && styles.timeChipTxtActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Insight preview */}
        {quality && (
          <View style={[styles.insightCard, { borderColor: qualityObj.color + '50' }]}>
            <Text style={styles.insightEmoji}>{qualityObj.emoji}</Text>
            <Text style={[styles.insightText, { color: qualityObj.color }]}>{SLEEP_INSIGHTS[quality]}</Text>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveBtnTxt}>Save Sleep Log</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const C = { bg: '#0F0B1E', card: '#181430', border: '#251E42', purple: '#7C5CFC', lime: '#C8F135', sub: '#6B5F8A', text: '#fff' };

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 24 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 32,
  },
  closeTxt: { color: C.sub, fontSize: 18 },
  title:    { color: C.text, fontSize: 18, fontWeight: '800' },

  sectionLabel: { color: C.sub, fontSize: 13, fontWeight: '600', marginBottom: 16, marginTop: 8 },

  hoursDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 16, justifyContent: 'center' },
  hoursNum:     { fontSize: 64, fontWeight: '900', letterSpacing: -2 },
  hoursUnit:    { color: C.sub, fontSize: 20, fontWeight: '600' },

  hoursScroll: { marginBottom: 16 },
  hoursRow:    { gap: 8, paddingVertical: 4 },
  hourChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border,
  },
  hourChipActive: { backgroundColor: C.card },
  hourChipTxt:    { color: C.sub, fontSize: 14, fontWeight: '700' },

  goalBar: { marginBottom: 28 },
  goalBarBg: {
    height: 8, backgroundColor: C.border,
    borderRadius: 4, overflow: 'hidden',
    position: 'relative', marginBottom: 6,
  },
  goalBarFill:   { height: 8, borderRadius: 4 },
  goalLine: {
    position: 'absolute', left: '80%',
    top: 0, bottom: 0, width: 2,
    backgroundColor: '#9D85F5',
  },
  goalBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  goalBarLabel:  { color: C.sub, fontSize: 10 },

  qualityRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  qualityBtn: {
    flex: 1, minWidth: 60,
    backgroundColor: C.card, borderRadius: 14,
    paddingVertical: 12, alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: C.border,
  },
  qualityBtnActive: { backgroundColor: C.card },
  qualityEmoji:     { fontSize: 22 },
  qualityLabel:     { color: C.sub, fontSize: 9, fontWeight: '600', textAlign: 'center' },

  timesRow:  { gap: 16, marginBottom: 20 },
  timeBlock: {},
  timeLabel: { color: C.sub, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  timeChips: { flexDirection: 'row', gap: 8 },
  timeChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.card, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
  },
  timeChipActive:    { backgroundColor: C.purple + '30', borderColor: C.purple },
  timeChipTxt:       { color: C.sub, fontSize: 12 },
  timeChipTxtActive: { color: C.text, fontWeight: '700' },

  insightCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.card, borderRadius: 16,
    padding: 16, gap: 12, marginBottom: 24,
    borderWidth: 1,
  },
  insightEmoji: { fontSize: 22 },
  insightText:  { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },

  saveBtn: {
    backgroundColor: C.purple, borderRadius: 16,
    paddingVertical: 17, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnTxt:      { color: '#fff', fontSize: 15, fontWeight: '800' },

  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { color: C.text, fontSize: 26, fontWeight: '900', marginBottom: 6 },
  successSub:   { color: C.sub, fontSize: 15, marginBottom: 20 },
  successNote:  { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 32 },
  doneBtn: {
    backgroundColor: C.purple, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 48,
  },
  doneBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});