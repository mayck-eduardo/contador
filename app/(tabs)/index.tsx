import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useCounter } from '../../context/CounterContext';
import { differenceInDays, format, startOfDay } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';

const RING_SIZE = 240;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const GOAL_OPTIONS = [7, 14, 30, 60, 100];

const PHRASES = [
  'Um dia de cada vez. Você consegue! 💪',
  'Cada dia vencido é uma vitória real.',
  'Disciplina é escolher entre o que quer agora e o que quer mais.',
  'A mudança começa com uma decisão. Você já tomou a sua.',
  'Você está construindo uma versão melhor de si mesmo.',
  'Pequenas vitórias diárias levam a grandes conquistas.',
  'Orgulhe-se do caminho, não só do destino.',
  'Resistir hoje significa liberdade amanhã.',
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CounterScreen() {
  const {
    totalCount,
    dailyStatus,
    lastAction,
    targetDate,
    goalDays,
    personalRecord,
    currentStreak,
    addAction,
    resetAction,
    undoAction,
    setTargetDate,
    setGoalDays,
  } = useCounter();

  const [showPicker, setShowPicker] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const hasAddedToday = dailyStatus[today] === 'ADD';
  const canUndo = lastAction && lastAction.date === today;

  // Progress ring animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const progress = Math.min(totalCount / goalDays, 1);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  // Pulse on add
  const triggerPulse = () => {
    pulseAnim.setValue(1);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 150, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleAdd = () => {
    addAction();
    triggerPulse();
  };

  const confirmReset = () => {
    Alert.alert('Reiniciar', 'Tem certeza que quer zerar a contagem?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Zerar', style: 'destructive', onPress: resetAction },
    ]);
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setTargetDate(format(selectedDate, 'yyyy-MM-dd'));
  };

  const daysLeft = targetDate
    ? differenceInDays(startOfDay(new Date(targetDate)), startOfDay(new Date()))
    : null;

  const phraseIndex = totalCount % PHRASES.length;

  const percentComplete = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Contador</Text>

      {/* Progress Ring */}
      <View style={styles.ringContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svg}>
          {/* Background track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="#1E1E24"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress arc */}
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="#10B981"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>

        {/* Center content */}
        <Animated.View style={[styles.ringCenter, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.countText}>{totalCount}</Text>
          <Text style={styles.countLabel}>dias</Text>
          <Text style={styles.percentText}>{percentComplete}% da meta</Text>
        </Animated.View>
      </View>

      {/* Motivational phrase */}
      <Text style={styles.phrase}>"{PHRASES[phraseIndex]}"</Text>

      {/* Goal selector */}
      <View style={styles.goalSection}>
        <Text style={styles.goalLabel}>Meta:</Text>
        <View style={styles.goalRow}>
          {GOAL_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.goalChip, goalDays === g && styles.goalChipActive]}
              onPress={() => setGoalDays(g)}
            >
              <Text style={[styles.goalChipText, goalDays === g && styles.goalChipTextActive]}>
                {g}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Sequência atual</Text>
        </View>
        <View style={[styles.statCard, styles.statCardMiddle]}>
          <Text style={[styles.statValue, { color: '#818CF8' }]}>{goalDays}</Text>
          <Text style={styles.statLabel}>Meta (dias)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{personalRecord}</Text>
          <Text style={styles.statLabel}>Recorde</Text>
        </View>
      </View>

      {/* Event countdown chip */}
      {targetDate && daysLeft !== null && daysLeft >= 0 && (
        <TouchableOpacity style={styles.eventChip} onPress={() => setTargetDate(null)}>
          <Text style={styles.eventChipText}>
            🎯 {daysLeft === 0 ? 'É hoje!' : `Faltam ${daysLeft} dias para o evento`}
          </Text>
        </TouchableOpacity>
      )}
      {!targetDate && (
        <TouchableOpacity style={styles.eventChipEmpty} onPress={() => setShowPicker(true)}>
          <Text style={styles.eventChipEmptyText}>+ Definir data de evento</Text>
        </TouchableOpacity>
      )}

      {showPicker && (
        <DateTimePicker
          value={targetDate ? new Date(targetDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
          themeVariant="dark"
        />
      )}

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.btn, styles.btnReset]} onPress={confirmReset} activeOpacity={0.8}>
          <Text style={styles.btnResetText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnAdd, hasAddedToday && styles.btnDisabled]}
          onPress={handleAdd}
          disabled={hasAddedToday}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnAddText, hasAddedToday && styles.btnAddTextDisabled]}>+</Text>
        </TouchableOpacity>
      </View>

      {hasAddedToday && (
        <Text style={styles.feedbackText}>✓ Marcado hoje! Continue amanhã 🎉</Text>
      )}

      {/* Undo */}
      <View style={styles.undoWrap}>
        <TouchableOpacity
          style={[styles.undoBtn, !canUndo && styles.undoBtnDisabled]}
          onPress={undoAction}
          disabled={!canUndo}
        >
          <Text style={[styles.undoBtnText, !canUndo && { color: '#3F3F46' }]}>
            Desfazer última ação
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FAFAFA',
    alignSelf: 'flex-start',
    marginBottom: 24,
    letterSpacing: 0.4,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  svg: {
    position: 'absolute',
  },
  ringCenter: {
    alignItems: 'center',
  },
  countText: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FAFAFA',
    lineHeight: 84,
    fontVariant: ['tabular-nums'],
  },
  countLabel: {
    fontSize: 15,
    color: '#71717A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },
  percentText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  phrase: {
    fontSize: 13,
    color: '#52525B',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  goalSection: {
    width: '100%',
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  goalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  goalChipActive: {
    backgroundColor: '#042F2E',
    borderColor: '#10B981',
  },
  goalChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#71717A',
  },
  goalChipTextActive: {
    color: '#10B981',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#18181B',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  statCardMiddle: {
    borderColor: '#312E81',
    backgroundColor: '#1E1B4B',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#10B981',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  eventChip: {
    backgroundColor: '#042F2E',
    borderWidth: 1,
    borderColor: '#065F46',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 16,
  },
  eventChipText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '600',
  },
  eventChipEmpty: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    borderStyle: 'dashed',
  },
  eventChipEmptyText: {
    color: '#52525B',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    marginBottom: 14,
  },
  btn: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  btnAdd: {
    backgroundColor: '#042F2E',
    borderColor: '#065F46',
  },
  btnReset: {
    backgroundColor: '#450A0A',
    borderColor: '#7F1D1D',
  },
  btnDisabled: {
    backgroundColor: '#18181B',
    borderColor: '#27272A',
  },
  btnAddText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#10B981',
  },
  btnAddTextDisabled: {
    color: '#3F3F46',
  },
  btnResetText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#EF4444',
  },
  feedbackText: {
    fontSize: 14,
    color: '#34D399',
    fontWeight: '600',
    marginBottom: 6,
  },
  undoWrap: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 16,
  },
  undoBtn: {
    borderWidth: 1,
    borderColor: '#27272A',
    backgroundColor: '#18181B',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  undoBtnDisabled: {
    backgroundColor: '#09090B',
    borderColor: '#18181B',
  },
  undoBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FAFAFA',
  },
});
