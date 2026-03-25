import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useCounter } from '../../context/CounterContext';
import { differenceInDays, format, startOfDay } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ── Event presets ─────────────────────────────────────────────────────────────
const EVENT_PRESETS = [
  { emoji: '🎂', label: 'Aniversário' },
  { emoji: '✈️', label: 'Viagem' },
  { emoji: '🎓', label: 'Formatura' },
  { emoji: '💍', label: 'Casamento' },
  { emoji: '🏋️', label: 'Meta Fitness' },
  { emoji: '🎯', label: 'Objetivo' },
];

// ── Flip digit component ──────────────────────────────────────────────────────
function FlipDigit({ value, label, color = '#FAFAFA' }: { value: string; label: string; color?: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      prevValue.current = value;
    }
  }, [value]);

  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.85, 1.05, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1, 1] });

  return (
    <View style={flipStyles.wrap}>
      <View style={flipStyles.card}>
        <View style={flipStyles.topHalf} />
        <View style={flipStyles.divider} />
        <Animated.Text style={[flipStyles.value, { color, transform: [{ scale }], opacity }]}>
          {value}
        </Animated.Text>
      </View>
      <Text style={flipStyles.label}>{label}</Text>
    </View>
  );
}

const flipStyles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 18,
    width: '100%',
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  topHalf: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#111113',
  },
  divider: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: '#09090B',
    top: '50%',
  },
  value: {
    fontSize: 44,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  label: {
    marginTop: 8,
    fontSize: 10,
    color: '#52525B',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
  },
});

// ── Separator ─────────────────────────────────────────────────────────────────
function Separator() {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.Text style={[sepStyles.text, { opacity: blink }]}>:</Animated.Text>
  );
}

const sepStyles = StyleSheet.create({
  text: { fontSize: 32, fontWeight: '900', color: '#3F3F46', marginBottom: 20, paddingHorizontal: 2 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CountdownScreen() {
  const { countdownTargetDate, setCountdownTargetDate } = useCounter();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [selectedLabel, setSelectedLabel] = useState('Objetivo');
  const [timeLeft, setTimeLeft] = useState<{
    days: number; hours: number; minutes: number; seconds: number;
  } | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const calculateTimeLeft = () => {
    if (!countdownTargetDate) return;
    const target = startOfDay(new Date(countdownTargetDate));
    target.setDate(target.getDate() + 1); // end of target day
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    if (diffMs > 0) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    } else {
      setTimeLeft(null);
    }
  };

  useEffect(() => {
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [countdownTargetDate]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setCountdownTargetDate(format(selectedDate, 'yyyy-MM-dd'));
  };

  const clearTarget = () => setCountdownTargetDate(null);

  const pad = (n: number) => n.toString().padStart(2, '0');

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!countdownTargetDate) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentCenter}>
        <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], width: '100%', alignItems: 'center' }}>
          <Text style={styles.title}>Contagem Regressiva</Text>

          <View style={styles.emptyIllustration}>
            <Text style={styles.emptyIllustrationEmoji}>⏳</Text>
          </View>

          <Text style={styles.emptyTitle}>Defina um grande momento</Text>
          <Text style={styles.emptySubtitle}>
            Acompanhe quanto tempo falta para o seu evento mais importante
          </Text>

          {/* Preset selector */}
          <Text style={styles.presetsLabel}>Tipo de evento:</Text>
          <View style={styles.presetsGrid}>
            {EVENT_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.label}
                style={[styles.presetChip, selectedLabel === p.label && styles.presetChipActive]}
                onPress={() => { setSelectedEmoji(p.emoji); setSelectedLabel(p.label); }}
              >
                <Text style={styles.presetEmoji}>{p.emoji}</Text>
                <Text style={[styles.presetLabel, selectedLabel === p.label && styles.presetLabelActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.setDateBtn} onPress={() => setShowPicker(true)} activeOpacity={0.85}>
            <Ionicons name="calendar" size={18} color="#09090B" />
            <Text style={styles.setDateBtnText}>Definir Data</Text>
          </TouchableOpacity>
        </Animated.View>

        {showPicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
            themeVariant="dark"
          />
        )}
      </ScrollView>
    );
  }

  // ── Past/Today state ────────────────────────────────────────────────────────
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isToday = countdownTargetDate === todayStr;
  const isPast = !isToday && startOfDay(new Date(countdownTargetDate)).getTime() < startOfDay(new Date()).getTime();
  const formattedDate = format(new Date(countdownTargetDate), "dd/MM/yyyy");

  if (isPast || isToday) {
    const daysPassed = isPast ? differenceInDays(startOfDay(new Date()), startOfDay(new Date(countdownTargetDate))) : 0;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Contagem Regressiva</Text>
        <View style={styles.arrivedContainer}>
          <Text style={styles.arrivedEmoji}>{selectedEmoji}</Text>
          <Text style={styles.arrivedTitle}>{isToday ? 'É Hoje! 🎉' : 'Já Passou!'}</Text>
          <Text style={styles.arrivedSub}>
            {isToday
              ? 'O grande dia chegou!'
              : `O evento foi há ${daysPassed} dia${daysPassed !== 1 ? 's' : ''}.`}
          </Text>
          <TouchableOpacity style={styles.newGoalBtn} onPress={clearTarget}>
            <Text style={styles.newGoalBtnText}>Nova Meta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Active countdown ────────────────────────────────────────────────────────
  const totalDaysLeft = timeLeft?.days ?? 0;
  const urgencyColor = totalDaysLeft <= 7 ? '#EF4444' : totalDaysLeft <= 30 ? '#F59E0B' : '#818CF8';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentActive}>
      {/* Header */}
      <View style={styles.activeHeader}>
        <Text style={styles.title}>Contagem Regressiva</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setShowPicker(true)}>
          <Ionicons name="pencil" size={14} color="#71717A" />
        </TouchableOpacity>
      </View>

      {/* Event label */}
      <View style={[styles.eventLabel, { borderColor: urgencyColor + '44', backgroundColor: urgencyColor + '11' }]}>
        <Text style={styles.eventLabelEmoji}>{selectedEmoji}</Text>
        <Text style={[styles.eventLabelText, { color: urgencyColor }]}>{selectedLabel}</Text>
        <Text style={styles.eventLabelDate}>· {formattedDate}</Text>
      </View>

      {/* Flip clock */}
      <View style={styles.clockContainer}>
        <View style={styles.clockRow}>
          <FlipDigit value={pad(timeLeft?.days ?? 0)} label="Dias" color={urgencyColor} />
          <Separator />
          <FlipDigit value={pad(timeLeft?.hours ?? 0)} label="Horas" color="#FAFAFA" />
        </View>
        <View style={styles.clockRow}>
          <FlipDigit value={pad(timeLeft?.minutes ?? 0)} label="Minutos" color="#FAFAFA" />
          <Separator />
          <FlipDigit value={pad(timeLeft?.seconds ?? 0)} label="Segundos" color="#A1A1AA" />
        </View>
      </View>

      {/* Urgency badge */}
      <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor + '22', borderColor: urgencyColor + '44' }]}>
        <Ionicons
          name={totalDaysLeft <= 7 ? 'warning' : totalDaysLeft <= 30 ? 'time' : 'calendar'}
          size={14}
          color={urgencyColor}
        />
        <Text style={[styles.urgencyText, { color: urgencyColor }]}>
          {totalDaysLeft === 0
            ? 'É amanhã!'
            : totalDaysLeft <= 7
            ? `Faltam apenas ${totalDaysLeft} dia${totalDaysLeft !== 1 ? 's' : ''}!`
            : totalDaysLeft <= 30
            ? `${totalDaysLeft} dias — prepare-se!`
            : `${totalDaysLeft} dias restantes`}
        </Text>
      </View>

      {/* Total seconds as visual bar */}
      <View style={styles.secondsBar}>
        <View style={[styles.secondsFill, { width: `${((timeLeft?.seconds ?? 0) / 59) * 100}%` as any, backgroundColor: urgencyColor }]} />
      </View>
      <Text style={styles.secondsLabel}>pulso em tempo real</Text>

      <TouchableOpacity style={styles.clearBtn} onPress={clearTarget}>
        <Text style={styles.clearBtnText}>Limpar Meta</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={countdownTargetDate ? new Date(countdownTargetDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
          themeVariant="dark"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  contentCenter: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  contentActive: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: 24,
  },
  // Empty state
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIllustrationEmoji: { fontSize: 56 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FAFAFA',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 12,
  },
  presetsLabel: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
    alignSelf: 'stretch',
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    backgroundColor: '#18181B',
  },
  presetChipActive: {
    borderColor: '#818CF8',
    backgroundColor: '#1E1B4B',
  },
  presetEmoji: { fontSize: 16 },
  presetLabel: { fontSize: 13, fontWeight: '600', color: '#71717A' },
  presetLabelActive: { color: '#818CF8' },
  setDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAFAFA',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  setDateBtnText: { fontSize: 16, fontWeight: '800', color: '#09090B' },

  // Past/Today
  arrivedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  arrivedEmoji: { fontSize: 72, marginBottom: 16 },
  arrivedTitle: { fontSize: 40, fontWeight: '900', color: '#FAFAFA', marginBottom: 8, letterSpacing: -0.5 },
  arrivedSub: { fontSize: 16, color: '#71717A', marginBottom: 40, textAlign: 'center' },
  newGoalBtn: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  newGoalBtnText: { fontSize: 15, fontWeight: '700', color: '#FAFAFA' },

  // Active countdown
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  eventLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 32,
  },
  eventLabelEmoji: { fontSize: 18 },
  eventLabelText: { fontSize: 14, fontWeight: '700' },
  eventLabelDate: { fontSize: 12, color: '#52525B', fontWeight: '500' },
  clockContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  urgencyText: { fontSize: 13, fontWeight: '700' },
  secondsBar: {
    width: '100%',
    height: 3,
    backgroundColor: '#18181B',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  secondsFill: {
    height: '100%',
    borderRadius: 2,
  },
  secondsLabel: {
    fontSize: 10,
    color: '#3F3F46',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 32,
  },
  clearBtn: {
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    backgroundColor: '#18181B',
  },
  clearBtnText: { fontSize: 14, fontWeight: '600', color: '#71717A' },
});
