import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Alert,
  ScrollView, Modal, TextInput, Switch, Share,
} from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeOutUp, 
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { useCounter, DayCounter, CountMode, FrequencyType } from '../../context/CounterContext';
import { getDayCounterStatsStatic, ACHIEVEMENTS, getAchievementsForStats, calculateLevel, calculateXpProgress, XP_PER_COMPLETION } from '../../utils/counterUtils';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import ConfettiCannon from 'react-native-confetti-cannon';

// ── Constantes ────────────────────────────────────────────────────────────────
const COUNTER_COLORS = ['#10B981','#818CF8','#F59E0B','#EF4444','#06B6D4','#E879F9','#FB923C'];
const COUNTER_EMOJIS = ['🎯','🔥','💪','📚','🏃','💧','🧘','🎮','✅','⭐','🚫','💊'];
const GOAL_OPTIONS: (number | null)[] = [null, 7, 14, 30, 60, 100, 365];

const RING = 64;
const STROKE = 6;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

// ── Mini anel ─────────────────────────────────────────────────────────────────
function ProgressRing({
  percent, color, count,
}: { percent: number | null; color: string; count: number }) {
  const offset = percent !== null ? CIRC * (1 - Math.min(percent / 100, 1)) : CIRC;
  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
        <Circle cx={RING/2} cy={RING/2} r={R} stroke="#1E1E24" strokeWidth={STROKE} fill="none" />
        {percent !== null && (
          <Circle
            cx={RING/2} cy={RING/2} r={R}
            stroke={color} strokeWidth={STROKE} fill="none"
            strokeDasharray={CIRC} strokeDashoffset={offset}
            strokeLinecap="round" rotation="-90" origin={`${RING/2},${RING/2}`}
          />
        )}
        {percent === null && (
          <Circle
            cx={RING/2} cy={RING/2} r={R}
            stroke={color + '55'} strokeWidth={STROKE} fill="none"
            strokeDasharray="4 6" rotation="-90" origin={`${RING/2},${RING/2}`}
          />
        )}
      </Svg>
      <Text style={{ fontSize: 16, fontWeight: '900', color, fontVariant: ['tabular-nums'] }}>
        {count}
      </Text>
    </View>
  );
}

// ── EditModal ─────────────────────────────────────────────────────────────────
function EditModal({
  counter, visible, onClose, onSave,
}: {
  counter: DayCounter;
  visible: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Pick<DayCounter, 'name'|'emoji'|'color'|'mode'|'goalDays'|'reminderEnabled'|'reminderHour'>>) => void;
}) {
  const [name, setName] = useState(counter.name);
  const [emoji, setEmoji] = useState(counter.emoji);
  const [color, setColor] = useState(counter.color);
  const [mode, setMode] = useState<CountMode>(counter.mode);
  const [goal, setGoal] = useState<number | null>(counter.goalDays);
  const [reminder, setReminder] = useState(counter.reminderEnabled ?? false);
  const [remHour, setRemHour] = useState(counter.reminderHour ?? 20);

  // Sync when counter changes
  useEffect(() => {
    if (visible) {
      setName(counter.name); setEmoji(counter.emoji); setColor(counter.color);
      setMode(counter.mode); setGoal(counter.goalDays);
      setReminder(counter.reminderEnabled ?? false);
      setRemHour(counter.reminderHour ?? 20);
    }
  }, [visible, counter.id]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Nome obrigatório'); return; }
    onSave({ 
      name: name.trim(), 
      emoji, 
      color, 
      mode, 
      goalDays: goal,
      reminderEnabled: reminder,
      reminderHour: remHour,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ms.overlay}>
        <ScrollView style={ms.sheet} contentContainerStyle={ms.sheetContent} showsVerticalScrollIndicator={false}>
          <View style={ms.handle} />
          <View style={ms.sheetHeader}>
            <Text style={ms.sheetTitle}>Editar Contador</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={[ms.preview, { borderColor: color + '55' }]}>
            <View style={[ms.previewEmoji, { backgroundColor: color + '20' }]}>
              <Text style={{ fontSize: 24 }}>{emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ms.previewName, { color }]} numberOfLines={1}>{name || 'Nome do contador'}</Text>
              <Text style={ms.previewMeta}>
                {mode === 'streak' ? '🔥 Sequência' : mode === 'simple' ? '📊 Contagem' : '⚡ Ambos'} · {goal !== null ? `Meta ${goal}d` : 'Sem meta'}
              </Text>
            </View>
          </View>

          <Text style={ms.label}>Nome</Text>
          <TextInput
            style={ms.input}
            placeholder="Ex: Sem cigarro, Exercício..."
            placeholderTextColor="#3F3F46"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
          />

          <Text style={ms.label}>Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}
            contentContainerStyle={{ gap: 8 }}>
            {COUNTER_EMOJIS.map((e) => (
              <TouchableOpacity key={e}
                style={[ms.chip, emoji === e && { borderColor: color, backgroundColor: color + '20' }]}
                onPress={() => setEmoji(e)}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={ms.label}>Cor</Text>
          <View style={ms.colorRow}>
            {COUNTER_COLORS.map((clr) => (
              <TouchableOpacity key={clr}
                style={[ms.colorDot, { backgroundColor: clr }, color === clr && ms.colorDotSel]}
                onPress={() => setColor(clr)}>
                {color === clr && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={ms.label}>Modo</Text>
          <View style={{ gap: 8, marginBottom: 20 }}>
            {([
              { m: 'streak' as CountMode, e: '🔥', t: 'Sequência', d: 'Dias consecutivos — perde um, volta a zero', ac: '#042F2E', bc: '#10B981' },
              { m: 'simple' as CountMode, e: '📊', t: 'Contagem', d: 'Acumula todos os dias marcados, sem penalidade', ac: '#1E1B4B', bc: '#818CF8' },
              { m: 'both' as CountMode, e: '⚡', t: 'Ambos', d: 'Mostra sequência E contagem total junta', ac: '#1F1607', bc: '#F59E0B' },
            ]).map((opt) => (
              <TouchableOpacity key={opt.m}
                style={[ms.modeChip, mode === opt.m && { borderColor: opt.bc, backgroundColor: opt.ac }]}
                onPress={() => setMode(opt.m)} activeOpacity={0.8}>
                <Text style={{ fontSize: 18 }}>{opt.e}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[ms.modeTitle, mode === opt.m && { color: opt.bc }]}>{opt.t}</Text>
                  <Text style={ms.modeDesc}>{opt.d}</Text>
                </View>
                <View style={[ms.radio, mode === opt.m && { borderColor: opt.bc }]}>
                  {mode === opt.m && <View style={[ms.radioInner, { backgroundColor: opt.bc }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={ms.label}>Meta de dias</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 28 }}
            contentContainerStyle={{ gap: 8 }}>
            {GOAL_OPTIONS.map((g) => (
              <TouchableOpacity key={String(g)}
                style={[ms.goalChip, goal === g && { backgroundColor: color + '22', borderColor: color }]}
                onPress={() => setGoal(g)}>
                <Text style={[ms.goalChipText, goal === g && { color }]}>
                  {g === null ? 'Sem meta' : `${g}d`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={ms.label}>Lembrete Individual</Text>
          <View style={ms.remCard}>
            <View style={ms.row}>
              <View style={{ flex: 1 }}>
                <Text style={ms.remTitle}>Ativar lembrete</Text>
                <Text style={ms.remDesc}>Notificação diária para este contador</Text>
              </View>
              <Switch 
                value={reminder} 
                onValueChange={setReminder}
                trackColor={{ false: '#27272A', true: color }}
                thumbColor={reminder ? '#FAFAFA' : '#52525B'}
              />
            </View>
            {reminder && (
               <View style={ms.hourGrid}>
                 {[8, 12, 18, 20, 22].map(h => (
                   <TouchableOpacity key={h} onPress={() => setRemHour(h)}
                     style={[ms.hourChip, remHour === h && { backgroundColor: color + '20', borderColor: color }]}>
                     <Text style={[ms.hourChipText, remHour === h && { color }]}>{h}h</Text>
                   </TouchableOpacity>
                 ))}
               </View>
            )}
          </View>

          <View style={ms.btns}>
            <TouchableOpacity style={ms.cancelBtn} onPress={onClose}>
              <Text style={ms.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ms.saveBtn, { backgroundColor: color }]} onPress={handleSave}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={ms.saveText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111113', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: '#1E1E24', maxHeight: '95%' },
  sheetContent: { padding: 24 },
  handle: { width: 40, height: 4, backgroundColor: '#27272A', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#FAFAFA' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#18181B', borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 20 },
  previewEmoji: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 15, fontWeight: '700' },
  previewMeta: { fontSize: 11, color: '#71717A', marginTop: 2 },
  label: { fontSize: 11, color: '#71717A', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  input: { backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#FAFAFA', marginBottom: 20 },
  chip: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorDotSel: { borderWidth: 3, borderColor: '#fff' },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#27272A', backgroundColor: '#18181B' },
  modeTitle: { fontSize: 13, fontWeight: '700', color: '#71717A' },
  modeDesc: { fontSize: 10, color: '#52525B', marginTop: 1 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#3F3F46', alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  goalChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: '#27272A', backgroundColor: '#18181B' },
  goalChipText: { fontSize: 13, fontWeight: '700', color: '#71717A' },
  btns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: '#27272A', backgroundColor: '#18181B', alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#71717A' },
  saveBtn: { flex: 2, flexDirection: 'row', paddingVertical: 15, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  remCard: { backgroundColor: '#18181B', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#27272A', marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remTitle: { fontSize: 13, fontWeight: '700', color: '#FAFAFA' },
  remDesc: { fontSize: 10, color: '#52525B', marginTop: 1 },
  hourGrid: { flexDirection: 'row', gap: 6, marginTop: 14 },
  hourChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#27272A', backgroundColor: '#141416' },
  hourChipText: { fontSize: 11, fontWeight: '700', color: '#71717A' },
});

// ── PastDaysModal ─────────────────────────────────────────────────────────────
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function PastDaysModal({
  counter, visible, onClose, onToggle,
}: {
  counter: DayCounter;
  visible: boolean;
  onClose: () => void;
  onToggle: (date: string) => void;
}) {
  // Gera os últimos 60 dias em ordem crescente
  const days = Array.from({ length: 60 }, (_, i) =>
    format(subDays(new Date(), 59 - i), 'yyyy-MM-dd')
  );

  // Primeiro dia do bloco para alinhar o grid com os dias da semana
  const firstDayDow = new Date(days[0] + 'T12:00:00').getDay(); // 0=dom, 6=sáb
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const markedCount = days.filter((d) => counter.dailyStatus[d] === 'ADD').length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pd.overlay}>
        <View style={pd.sheet}>
          <View style={pd.handle} />
          <View style={pd.header}>
            <View>
              <Text style={pd.title}>Dias Anteriores</Text>
              <Text style={pd.titleSub}>
                {counter.emoji} {counter.name} · {markedCount} marcados
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={pd.closeBtn}>
              <Ionicons name="close" size={20} color="#71717A" />
            </TouchableOpacity>
          </View>

          <Text style={pd.hint}>
            Toque em qualquer dia para marcar ou desmarcar. Alterações são salvas imediatamente.
          </Text>

          {/* Cabeçalho da semana */}
          <View style={pd.weekHeader}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={pd.weekLabel}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={pd.grid}>
              {/* Células vazias para alinhar */}
              {Array.from({ length: firstDayDow }).map((_, i) => (
                <View key={`empty-${i}`} style={pd.cellEmpty} />
              ))}
              {days.map((d) => {
                const isAdd = counter.dailyStatus[d] === 'ADD';
                const isToday = d === todayStr;
                const isFuture = d > todayStr;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      pd.cell,
                      isAdd && { backgroundColor: counter.color },
                      isToday && !isAdd && { borderColor: counter.color, borderWidth: 1.5, backgroundColor: counter.color + '15' },
                      isFuture && pd.cellFuture,
                    ]}
                    onPress={() => !isFuture && onToggle(d)}
                    activeOpacity={0.7}
                    disabled={isFuture}
                  >
                    <Text style={[
                      pd.cellText,
                      isAdd && { color: '#000', fontWeight: '800' },
                      isToday && !isAdd && { color: counter.color, fontWeight: '700' },
                    ]}>
                      {d.slice(8)}
                    </Text>
                    {isAdd && <Ionicons name="checkmark" size={8} color="#000" style={{ marginTop: -2 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Legenda */}
          <View style={pd.legend}>
            <View style={pd.legendItem}>
              <View style={[pd.legendDot, { backgroundColor: counter.color }]} />
              <Text style={pd.legendText}>Marcado</Text>
            </View>
            <View style={pd.legendItem}>
              <View style={[pd.legendDot, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: counter.color }]} />
              <Text style={pd.legendText}>Hoje</Text>
            </View>
            <View style={pd.legendItem}>
              <View style={[pd.legendDot, { backgroundColor: '#1E1E24' }]} />
              <Text style={pd.legendText}>Não marcado</Text>
            </View>
          </View>

          <TouchableOpacity style={[pd.doneBtn, { backgroundColor: counter.color }]} onPress={onClose}>
            <Text style={pd.doneBtnText}>Concluído</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const pd = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111113', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: '#1E1E24', padding: 24, maxHeight: '90%' },
  handle: { width: 40, height: 4, backgroundColor: '#27272A', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '800', color: '#FAFAFA' },
  titleSub: { fontSize: 12, color: '#71717A', marginTop: 3 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12, color: '#52525B', marginBottom: 14, lineHeight: 17 },
  weekHeader: { flexDirection: 'row', marginBottom: 6 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 10, color: '#52525B', fontWeight: '700', textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: {
    width: '12.5%', aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, backgroundColor: '#1E1E24',
    gap: 1,
  },
  cellEmpty: { width: '12.5%', aspectRatio: 1 },
  cellFuture: { opacity: 0.2 },
  cellText: { fontSize: 11, color: '#52525B', fontWeight: '500' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, color: '#71717A', fontWeight: '500' },
  doneBtn: { paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  doneBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

// ── CounterCard ───────────────────────────────────────────────────────────────
function CounterCard({
  counter, stats, onMark, onUndo, onReset, onDelete, onEdit, onPastDays,
}: {
  counter: DayCounter;
  stats: ReturnType<typeof getDayCounterStatsStatic>;
  onMark: () => void;
  onUndo: () => void;
  onReset: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPastDays: () => void;
}) {
  const scale = useSharedValue(1);
  const { color, emoji, name, mode, goalDays } = counter;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleMark = () => {
    if (stats.hasAddedToday) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSequence(
      withTiming(0.96, { duration: 70 }),
      withTiming(1.03, { duration: 100 }),
      withTiming(1, { duration: 120 })
    );
    onMark();
  };

  const handleShare = async () => {
    try {
      const message = `🔥 Meu streak no contador "${emoji} ${name}" é de ${stats.streak} dias!\n📊 Total: ${stats.count} dias marcados.\n🎯 Meta: ${goalDays ? goalDays + ' dias' : 'Sem meta'}.\n\nFeito com o Contador App! 🚀`;
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  };

  const modeColor = mode === 'streak' ? '#10B981' : mode === 'simple' ? '#818CF8' : '#F59E0B';
  const hasGoal = goalDays !== null;
  const pct = stats.percent;
  const displayCount = mode === 'both' ? stats.streakCount : stats.count;
  const displayLabel = mode === 'both' 
    ? `🔥 ${stats.streakCount}d | 📊 ${stats.totalAdds}` 
    : mode === 'streak' 
      ? `🔥 Sequência · ${stats.streakCount}d` 
      : '📊 Contagem';

  return (
    <Animated.View 
      entering={FadeInDown}
      exiting={FadeOutUp}
      layout={LinearTransition}
    >
      <Animated.View 
        style={[s.card, { borderColor: stats.hasAddedToday ? color + '55' : '#27272A' }, animatedStyle]}
      >
        <View style={[s.cardAccent, { backgroundColor: color }]} />
        <View style={s.cardBody}>
        {/* Topo */}
        <View style={s.cardTop}>
          <View style={s.cardTopLeft}>
            <View style={[s.emojiWrap, { backgroundColor: color + '20' }]}>
              <Text style={s.emojiText}>{emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardName} numberOfLines={1}>{name}</Text>
              <View style={[s.modePill, { backgroundColor: modeColor + '18' }]}>
                <Text style={[s.modePillText, { color: modeColor }]}>
                  {displayLabel}
                </Text>
              </View>
            </View>
          </View>
          <ProgressRing percent={pct} color={color} count={mode === 'both' ? stats.totalAdds : stats.count} />
        </View>

        {/* Progresso (só se tem meta) */}
        {hasGoal && pct !== null ? (
          <>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
            </View>
            <View style={s.progressRow}>
              <Text style={[s.progressPct, { color }]}>{pct}%</Text>
              <Text style={s.progressGoal}>de {goalDays} dias</Text>
              {stats.hasAddedToday && <Text style={[s.doneLabel, { color }]}>✓ marcado hoje</Text>}
            </View>
          </>
        ) : (
          <View style={s.noGoalRow}>
            <View style={[s.noGoalBadge, { borderColor: color + '33' }]}>
              <Text style={[s.noGoalText, { color: color + 'AA' }]}>∞ Sem meta</Text>
            </View>
            {stats.hasAddedToday && <Text style={[s.doneLabel, { color }]}>✓ marcado hoje</Text>}
          </View>
        )}

        {/* Linha principal: marcar + undo */}
        <View style={s.actionsTop}>
          <TouchableOpacity
            style={[s.markBtn, stats.hasAddedToday ? s.markBtnDone : { backgroundColor: color + '20', borderColor: color }]}
            onPress={handleMark}
            disabled={stats.hasAddedToday}
            activeOpacity={0.8}
          >
            <Ionicons name={stats.hasAddedToday ? 'checkmark-circle' : 'add-circle-outline'} size={18}
              color={stats.hasAddedToday ? '#3F3F46' : color} />
            <Text style={[s.markBtnText, { color: stats.hasAddedToday ? '#3F3F46' : color }]}>
              {stats.hasAddedToday ? 'Marcado hoje' : 'Marcar hoje'}
            </Text>
          </TouchableOpacity>
          {stats.canUndo && (
            <TouchableOpacity style={[s.iconBtn, { borderColor: '#312E81', backgroundColor: '#1E1B4B' }]} onPress={onUndo}>
              <Ionicons name="arrow-undo" size={16} color="#818CF8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[s.iconBtn, { borderColor: '#1E1B4B', backgroundColor: '#111113' }]} 
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={16} color="#FAFAFA" />
          </TouchableOpacity>
        </View>

        {/* Linha secundária: ações */}
        <View style={s.actionsBottom}>
          <TouchableOpacity style={[s.actionChip, { borderColor: color + '33', backgroundColor: color + '10' }]} onPress={onPastDays}>
            <Ionicons name="calendar-outline" size={14} color={color} />
            <Text style={[s.actionChipText, { color }]}>Dias anteriores</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionChipGray} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={14} color="#A1A1AA" />
            <Text style={s.actionChipGrayText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtnSm} onPress={onReset}>
            <Ionicons name="refresh-outline" size={14} color="#52525B" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.iconBtnSm, { borderColor: '#7F1D1D', backgroundColor: '#450A0A' }]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  </Animated.View>
);
}

// ── Tela principal ────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const {
    dayCounters, addDayCounter, updateDayCounter, removeDayCounter,
    incrementDayCounter, undoDayCounter, resetDayCounter, toggleDateOnCounter,
    getDayCounterStats,
  } = useCounter();

  const [showConfetti, setShowConfetti] = useState(false);

  // Modal estados
  const [addVisible, setAddVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<DayCounter | null>(null);
  const [pastDaysTarget, setPastDaysTarget] = useState<DayCounter | null>(null);

  // Form criação
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎯');
  const [newColor, setNewColor] = useState(COUNTER_COLORS[0]);
  const [newMode, setNewMode] = useState<CountMode>('streak');
  const [newGoal, setNewGoal] = useState<number | null>(30);
  const [newFrequency, setNewFrequency] = useState<FrequencyType>('daily');
  const [newSpecificDays, setNewSpecificDays] = useState<number[]>([]);
  const [newRemEnabled, setNewRemEnabled] = useState(false);
  const [newRemHour, setNewRemHour] = useState(20);

  const markedToday = dayCounters.filter((c) => getDayCounterStats(c).hasAddedToday).length;
  const total = dayCounters.length;

  const handleMark = (counter: DayCounter) => {
    const stats = getDayCounterStats(counter);
    incrementDayCounter(counter.id);
    const newCount = stats.count + 1;
    if ([7, 14, 21, 30, 60, 100].includes(newCount) || newCount === (counter.goalDays ?? -1)) {
      setShowConfetti(true);
    }
  };

  const handleReset = (c: DayCounter) => {
    Alert.alert('Zerar histórico?', `Apaga todos os dados de "${c.name}".`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Zerar', style: 'destructive', onPress: () => resetDayCounter(c.id) },
    ]);
  };

  const handleDelete = (c: DayCounter) => {
    Alert.alert('Excluir contador?', `Remove "${c.name}" permanentemente.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => removeDayCounter(c.id) },
    ]);
  };

  const handleCreate = () => {
    if (!newName.trim()) { Alert.alert('Nome obrigatório'); return; }
    addDayCounter(
      newName.trim(), 
      newEmoji, 
      newColor, 
      newMode, 
      newGoal, 
      newRemEnabled, 
      newRemHour,
      newFrequency,
      newSpecificDays.length > 0 ? newSpecificDays : undefined
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetForm();
  };

  const resetForm = () => {
    setNewName(''); setNewEmoji('🎯'); setNewColor(COUNTER_COLORS[0]);
    setNewMode('streak'); setNewGoal(30); 
    setNewFrequency('daily'); setNewSpecificDays([]);
    setNewRemEnabled(false); setNewRemHour(20);
    setAddVisible(false);
  };

  return (
    <View style={s.screen}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Meus Contadores</Text>
            <Text style={s.headerSub}>
              {total === 0 ? 'Nenhum contador criado' : `${markedToday}/${total} marcados hoje`}
            </Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setAddVisible(true)}>
            <Ionicons name="add" size={24} color="#FAFAFA" />
          </TouchableOpacity>
        </View>

        {/* Barra global */}
        {total > 0 && (
          <View style={s.globalBanner}>
            <View style={s.globalBg}>
              <View style={[s.globalFill, { width: `${Math.round((markedToday / total) * 100)}%` as any }]} />
            </View>
            <Text style={s.globalText}>
              {markedToday === total ? '🏆 Todos marcados hoje!'
                : markedToday === 0 ? 'Nenhum marcado ainda hoje'
                : `${total - markedToday} restante${total - markedToday > 1 ? 's' : ''} hoje`}
            </Text>
          </View>
        )}

        {/* Lista */}
        {dayCounters.map((counter) => (
          <CounterCard
            key={counter.id}
            counter={counter}
            stats={getDayCounterStats(counter)}
            onMark={() => handleMark(counter)}
            onUndo={() => undoDayCounter(counter.id)}
            onReset={() => handleReset(counter)}
            onDelete={() => handleDelete(counter)}
            onEdit={() => setEditTarget(counter)}
            onPastDays={() => setPastDaysTarget(counter)}
          />
        ))}

        {dayCounters.length === 0 && (
          <TouchableOpacity style={s.emptyCard} onPress={() => setAddVisible(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={40} color="#27272A" />
            <Text style={s.emptyTitle}>Criar primeiro contador</Text>
            <Text style={s.emptySub}>Adicione metas de dias consecutivos ou acumulados</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {showConfetti && (
        <ConfettiCannon count={200} origin={{ x: 200, y: 0 }} autoStart fadeOut fallSpeed={3000}
          onAnimationEnd={() => setShowConfetti(false)} />
      )}

      {/* ── Modal: Criar contador ── */}
      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={resetForm}>
        <View style={ms.overlay}>
          <ScrollView style={ms.sheet} contentContainerStyle={ms.sheetContent} showsVerticalScrollIndicator={false}>
            <View style={ms.handle} />
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>Novo Contador</Text>
              <TouchableOpacity onPress={resetForm}>
                <Ionicons name="close" size={22} color="#71717A" />
              </TouchableOpacity>
            </View>

            {/* Preview */}
            <View style={[ms.preview, { borderColor: newColor + '55' }]}>
              <View style={[ms.previewEmoji, { backgroundColor: newColor + '20' }]}>
                <Text style={{ fontSize: 24 }}>{newEmoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[ms.previewName, { color: newColor }]} numberOfLines={1}>
                  {newName || 'Nome do contador'}
                </Text>
                <Text style={ms.previewMeta}>
                  {newMode === 'streak' ? '🔥 Sequência' : '📊 Contagem'} · {newGoal !== null ? `Meta ${newGoal}d` : 'Sem meta'}
                </Text>
              </View>
            </View>

            <Text style={ms.label}>Nome</Text>
            <TextInput
              style={ms.input}
              placeholder="Ex: Sem redes sociais, Leitura..."
              placeholderTextColor="#3F3F46"
              value={newName}
              onChangeText={setNewName}
              returnKeyType="done"
            />

            <Text style={ms.label}>Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}
              contentContainerStyle={{ gap: 8 }}>
              {COUNTER_EMOJIS.map((e) => (
                <TouchableOpacity key={e}
                  style={[ms.chip, newEmoji === e && { borderColor: newColor, backgroundColor: newColor + '20' }]}
                  onPress={() => setNewEmoji(e)}>
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={ms.label}>Cor</Text>
            <View style={ms.colorRow}>
              {COUNTER_COLORS.map((clr) => (
                <TouchableOpacity key={clr}
                  style={[ms.colorDot, { backgroundColor: clr }, newColor === clr && ms.colorDotSel]}
                  onPress={() => setNewColor(clr)}>
                  {newColor === clr && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

<Text style={ms.label}>Modo</Text>
          <View style={{ gap: 8, marginBottom: 20 }}>
            {([
              { m: 'streak' as CountMode, e: '🔥', t: 'Sequência', d: 'Dias consecutivos — perde um, volta a zero', ac: '#042F2E', bc: '#10B981' },
              { m: 'simple' as CountMode, e: '📊', t: 'Contagem', d: 'Acumula todos os dias marcados, sem penalidade', ac: '#1E1B4B', bc: '#818CF8' },
              { m: 'both' as CountMode, e: '⚡', t: 'Ambos', d: 'Mostra sequência E contagem total junta', ac: '#1F1607', bc: '#F59E0B' },
            ]).map((opt) => (
              <TouchableOpacity key={opt.m}
                style={[ms.modeChip, newMode === opt.m && { borderColor: opt.bc, backgroundColor: opt.ac }]}
                onPress={() => setNewMode(opt.m)} activeOpacity={0.8}>
                <Text style={{ fontSize: 18 }}>{opt.e}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[ms.modeTitle, newMode === opt.m && { color: opt.bc }]}>{opt.t}</Text>
                  <Text style={ms.modeDesc}>{opt.d}</Text>
                </View>
                <View style={[ms.radio, newMode === opt.m && { borderColor: opt.bc }]}>
                  {newMode === opt.m && <View style={[ms.radioInner, { backgroundColor: opt.bc }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

<Text style={ms.label}>Meta de dias</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 28 }}
              contentContainerStyle={{ gap: 8 }}>
              {GOAL_OPTIONS.map((g) => (
              <TouchableOpacity key={String(g)}
                style={[ms.goalChip, newGoal === g && { backgroundColor: newColor + '22', borderColor: newColor }]}
                onPress={() => setNewGoal(g)}>
                <Text style={[ms.goalChipText, newGoal === g && { color: newColor }]}>
                  {g === null ? 'Sem meta' : `${g}d`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

            <Text style={ms.label}>Frequência</Text>
            <View style={{ gap: 8, marginBottom: 20 }}>
              {([
                { f: 'daily' as FrequencyType, e: '📅', t: 'Diário', d: 'Todos os dias', color: '#10B981' },
                { f: 'weekly' as FrequencyType, e: '📆', t: 'Semanal', d: '1x por semana', color: '#818CF8' },
                { f: 'specificDays' as FrequencyType, e: '📋', t: 'Dias específicos', d: 'Escolha quais dias', color: '#F59E0B' },
              ]).map((opt) => (
                <TouchableOpacity key={opt.f}
                  style={[ms.modeChip, newFrequency === opt.f && { borderColor: opt.color, backgroundColor: opt.color + '18' }]}
                  onPress={() => setNewFrequency(opt.f)} activeOpacity={0.8}>
                  <Text style={{ fontSize: 18 }}>{opt.e}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[ms.modeTitle, newFrequency === opt.f && { color: opt.color }]}>{opt.t}</Text>
                    <Text style={ms.modeDesc}>{opt.d}</Text>
                  </View>
                  <View style={[ms.radio, newFrequency === opt.f && { borderColor: opt.color }]}>
                    {newFrequency === opt.f && <View style={[ms.radioInner, { backgroundColor: opt.color }]} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {newFrequency === 'specificDays' && (
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 24 }}>
                {[
                  { d: 0, l: 'D' },
                  { d: 1, l: 'S' },
                  { d: 2, l: 'T' },
                  { d: 3, l: 'Q' },
                  { d: 4, l: 'Q' },
                  { d: 5, l: 'S' },
                  { d: 6, l: 'S' },
                ].map((day) => (
                  <TouchableOpacity
                    key={day.d}
                    style={[
                      ms.chip,
                      newSpecificDays?.includes(day.d) && { backgroundColor: newColor + '20', borderColor: newColor }
                    ]}
                    onPress={() => {
                      const current = newSpecificDays || [];
                      const updated = current.includes(day.d)
                        ? current.filter(d => d !== day.d)
                        : [...current, day.d].sort();
                      setNewSpecificDays(updated);
                    }}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: newSpecificDays?.includes(day.d) ? newColor : '#71717A'
                    }}>{day.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={ms.label}>Lembrete Individual</Text>
            <View style={ms.remCard}>
            <View style={ms.row}>
              <View style={{ flex: 1 }}>
                <Text style={ms.remTitle}>Ativar lembrete</Text>
                <Text style={ms.remDesc}>Notificação diária para este contador</Text>
              </View>
              <Switch 
                value={newRemEnabled} 
                onValueChange={setNewRemEnabled}
                trackColor={{ false: '#27272A', true: newColor }}
                thumbColor={newRemEnabled ? '#FAFAFA' : '#52525B'}
              />
            </View>
            {newRemEnabled && (
               <View style={ms.hourGrid}>
                 {[8, 12, 18, 20, 22].map(h => (
                   <TouchableOpacity key={h} onPress={() => setNewRemHour(h)}
                     style={[ms.hourChip, newRemHour === h && { backgroundColor: newColor + '20', borderColor: newColor }]}>
                     <Text style={[ms.hourChipText, newRemHour === h && { color: newColor }]}>{h}h</Text>
                   </TouchableOpacity>
                 ))}
               </View>
            )}
          </View>

            <View style={ms.btns}>
              <TouchableOpacity style={ms.cancelBtn} onPress={resetForm}>
                <Text style={ms.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ms.saveBtn, { backgroundColor: newColor }]} onPress={handleCreate}>
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={ms.saveText}>Criar Contador</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Modal: Editar contador ── */}
      {editTarget && (
        <EditModal
          counter={editTarget}
          visible={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(updates) => updateDayCounter(editTarget.id, updates)}
        />
      )}

      {/* ── Modal: Dias anteriores ── */}
      {pastDaysTarget && (
        <PastDaysModal
          counter={dayCounters.find((c) => c.id === pastDaysTarget.id) ?? pastDaysTarget}
          visible={!!pastDaysTarget}
          onClose={() => setPastDaysTarget(null)}
          onToggle={(date) => toggleDateOnCounter(pastDaysTarget.id, date)}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090B' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 48 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FAFAFA', letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: '#52525B', marginTop: 2, fontWeight: '500' },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center' },

  globalBanner: { marginBottom: 16 },
  globalBg: { height: 3, backgroundColor: '#18181B', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  globalFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 2 },
  globalText: { fontSize: 12, color: '#52525B', fontWeight: '500' },

  card: { flexDirection: 'row', backgroundColor: '#111113', borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  emojiWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#FAFAFA', marginBottom: 4 },
  modePill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  modePillText: { fontSize: 10, fontWeight: '700' },

  progressBg: { height: 4, backgroundColor: '#1E1E24', borderRadius: 2, overflow: 'hidden', marginBottom: 5 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  progressPct: { fontSize: 11, fontWeight: '700' },
  progressGoal: { fontSize: 11, color: '#52525B', fontWeight: '500' },
  doneLabel: { marginLeft: 'auto', fontSize: 11, fontWeight: '700' },

  noGoalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  noGoalBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  noGoalText: { fontSize: 11, fontWeight: '600' },

  actionsTop: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  markBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  markBtnDone: { backgroundColor: '#18181B', borderColor: '#27272A' },
  markBtnText: { fontSize: 13, fontWeight: '700' },
  iconBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#1A1A1E', borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center' },

  actionsBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, flex: 1 },
  actionChipText: { fontSize: 11, fontWeight: '700' },
  actionChipGray: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#27272A', backgroundColor: '#18181B' },
  actionChipGrayText: { fontSize: 11, fontWeight: '700', color: '#A1A1AA' },
  iconBtnSm: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#1A1A1E', borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center' },

  emptyCard: { alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#111113', borderRadius: 20, borderWidth: 1, borderColor: '#1E1E24', borderStyle: 'dashed', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#3F3F46' },
  emptySub: { fontSize: 12, color: '#27272A', fontWeight: '500', textAlign: 'center', paddingHorizontal: 24 },
});
