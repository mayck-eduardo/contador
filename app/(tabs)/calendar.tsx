/**
 * Tela de Histórico
 *
 * - Calendário unificado com multi-dot (ponto colorido por contador)
 * - Ao clicar num dia → bottom sheet mostrando status de cada contador
 * - Cards de andamento expandíveis por contador
 */

import React, { useMemo, useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import {
  useCounter, DayCounter,
  computeStreak, computeSimpleCount, computePersonalRecord, computeSuccessRate,
} from '../../context/CounterContext';
import { format, subDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

// ── Locale ────────────────────────────────────────────────────────────────────
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

// ── Helpers ───────────────────────────────────────────────────────────────────
function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => format(subDays(new Date(), n - 1 - i), 'yyyy-MM-dd'));
}
function shortWD(d: string) {
  return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][new Date(d + 'T12:00:00').getDay()];
}
function isToday(d: string) { return d === format(new Date(), 'yyyy-MM-dd'); }

/** Formata 'yyyy-MM-dd' em "25 de março de 2026" */
function formatFullDate(d: string): string {
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const [, m, day] = d.split('-');
  const date = new Date(d + 'T12:00:00');
  return `${parseInt(day, 10)} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

// ── DayDetailModal ─────────────────────────────────────────────────────────────
function DayDetailModal({
  date,
  counters,
  onClose,
}: {
  date: string;
  counters: DayCounter[];
  onClose: () => void;
}) {
  const marked = counters.filter((c) => c.dailyStatus[date] === 'ADD');
  const reset = counters.filter((c) => c.dailyStatus[date] === 'RESET');
  const untouched = counters.filter(
    (c) => c.dailyStatus[date] !== 'ADD' && c.dailyStatus[date] !== 'RESET'
  );
  const todayFlag = isToday(date);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={dd.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={dd.sheet} onPress={() => {}}>
          <View style={dd.handle} />

          {/* Data */}
          <View style={dd.dateRow}>
            <View>
              <Text style={dd.dateLabel}>{formatFullDate(date)}</Text>
              {todayFlag && (
                <View style={dd.todayBadge}>
                  <Text style={dd.todayBadgeText}>Hoje</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={dd.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Resumo */}
          <View style={dd.summaryRow}>
            <View style={[dd.summaryPill, { backgroundColor: '#042F2E', borderColor: '#065F46' }]}>
              <Text style={[dd.summaryNum, { color: '#10B981' }]}>{marked.length}</Text>
              <Text style={dd.summaryLabel}>marcados</Text>
            </View>
            <View style={[dd.summaryPill, { backgroundColor: '#291521', borderColor: '#6B1D3A' }]}>
              <Text style={[dd.summaryNum, { color: '#F43F5E' }]}>{reset.length}</Text>
              <Text style={dd.summaryLabel}>reiniciados</Text>
            </View>
            <View style={[dd.summaryPill, { backgroundColor: '#18181B', borderColor: '#27272A' }]}>
              <Text style={[dd.summaryNum, { color: '#52525B' }]}>{untouched.length}</Text>
              <Text style={dd.summaryLabel}>sem registro</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
            {/* ✓ Marcados */}
            {marked.length > 0 && (
              <>
                <Text style={dd.groupLabel}>✅ Marcados</Text>
                {marked.map((c) => (
                  <View key={c.id} style={[dd.counterRow, { borderColor: c.color + '33' }]}>
                    <View style={[dd.emojiBox, { backgroundColor: c.color + '20' }]}>
                      <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={dd.counterName}>{c.name}</Text>
                      <Text style={[dd.counterMode, { color: c.color + 'BB' }]}>
                        {c.mode === 'streak' ? '🔥 Sequência' : '📊 Contagem'}
                      </Text>
                    </View>
                    <View style={[dd.checkBadge, { backgroundColor: c.color + '22', borderColor: c.color + '55' }]}>
                      <Ionicons name="checkmark-circle" size={16} color={c.color} />
                      <Text style={[dd.checkText, { color: c.color }]}>Feito</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* ↺ Reiniciados */}
            {reset.length > 0 && (
              <>
                <Text style={dd.groupLabel}>↺ Reiniciados</Text>
                {reset.map((c) => (
                  <View key={c.id} style={[dd.counterRow, { borderColor: '#EF444433' }]}>
                    <View style={[dd.emojiBox, { backgroundColor: '#EF444420' }]}>
                      <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={dd.counterName}>{c.name}</Text>
                      <Text style={[dd.counterMode, { color: '#EF4444BB' }]}>
                        {c.mode === 'streak' ? '🔥 Sequência' : '📊 Contagem'}
                      </Text>
                    </View>
                    <View style={dd.resetBadge}>
                      <Ionicons name="refresh" size={14} color="#EF4444" />
                      <Text style={dd.resetText}>Reinício</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* — Sem registro */}
            {untouched.length > 0 && (
              <>
                <Text style={dd.groupLabel}>— Sem registro</Text>
                {untouched.map((c) => (
                  <View key={c.id} style={[dd.counterRow, { borderColor: '#27272A', opacity: 0.5 }]}>
                    <View style={[dd.emojiBox, { backgroundColor: '#18181B' }]}>
                      <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[dd.counterName, { color: '#52525B' }]}>{c.name}</Text>
                      <Text style={[dd.counterMode, { color: '#3F3F46' }]}>
                        {c.mode === 'streak' ? '🔥 Sequência' : '📊 Contagem'}
                      </Text>
                    </View>
                    <Text style={dd.noRegText}>Não marcado</Text>
                  </View>
                ))}
              </>
            )}

            {counters.length === 0 && (
              <View style={dd.noCounters}>
                <Ionicons name="apps-outline" size={28} color="#27272A" />
                <Text style={dd.noCountersText}>Nenhum contador criado</Text>
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const dd = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111113', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: '#1E1E24', padding: 24, paddingBottom: 36 },
  handle: { width: 40, height: 4, backgroundColor: '#27272A', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  dateRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  dateLabel: { fontSize: 17, fontWeight: '800', color: '#FAFAFA', textTransform: 'capitalize' },
  todayBadge: { marginTop: 4, backgroundColor: '#10B98122', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#10B98155' },
  todayBadgeText: { fontSize: 11, color: '#10B981', fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center' },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  summaryPill: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  summaryLabel: { fontSize: 10, color: '#71717A', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  groupLabel: { fontSize: 11, color: '#52525B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#18181B', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8 },
  emojiBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  counterName: { fontSize: 14, fontWeight: '700', color: '#FAFAFA' },
  counterMode: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  checkBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  checkText: { fontSize: 11, fontWeight: '700' },
  resetBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#291521', borderRadius: 8, borderWidth: 1, borderColor: '#6B1D3A', paddingHorizontal: 8, paddingVertical: 4 },
  resetText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  noRegText: { fontSize: 11, color: '#3F3F46', fontWeight: '500' },
  noCounters: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  noCountersText: { color: '#3F3F46', fontSize: 14, fontWeight: '500' },
});

// ── CounterHistoryCard ────────────────────────────────────────────────────────
function CounterHistoryCard({ counter }: { counter: DayCounter }) {
  const [expanded, setExpanded] = useState(false);
  const { color, emoji, name, mode, goalDays, dailyStatus } = counter;

  const streak = useMemo(() => computeStreak(dailyStatus), [dailyStatus]);
  const totalAdds = useMemo(() => computeSimpleCount(dailyStatus), [dailyStatus]);
  const personalRecord = useMemo(() => computePersonalRecord(dailyStatus), [dailyStatus]);
  const successRate = useMemo(() => computeSuccessRate(dailyStatus), [dailyStatus]);
  const count = mode === 'streak' ? streak : totalAdds;
  const percent = goalDays !== null && goalDays > 0
    ? Math.min(Math.round((count / goalDays) * 100), 100)
    : null;
  const hasAddedToday = dailyStatus[format(new Date(), 'yyyy-MM-dd')] === 'ADD';
  const week = lastNDays(7);

  return (
    <View style={[hc.card, { borderColor: expanded ? color + '55' : '#27272A' }]}>
      <TouchableOpacity style={hc.headerRow} onPress={() => setExpanded((e) => !e)} activeOpacity={0.85}>
        <View style={[hc.emojiBox, { backgroundColor: color + '20' }]}>
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={hc.name}>{name}</Text>
            {hasAddedToday && (
              <View style={[hc.todayBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                <Text style={[hc.todayBadgeText, { color }]}>✓ hoje</Text>
              </View>
            )}
          </View>
          <Text style={[hc.modeLine, { color: color + 'BB' }]}>
            {mode === 'streak' ? `🔥 ${streak}d de sequência` : `📊 ${totalAdds} dias acumulados`}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
          <Text style={[hc.countBig, { color }]}>{count}</Text>
          <Text style={hc.countGoal}>/{goalDays !== null ? `${goalDays}d` : '∞'}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#3F3F46" />
      </TouchableOpacity>

      {percent !== null ? (
        <>
          <View style={hc.progressBg}>
            <View style={[hc.progressFill, { width: `${percent}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={[hc.pctText, { color }]}>{percent}% da meta de {goalDays} dias</Text>
        </>
      ) : (
        <Text style={[hc.pctText, { color: color + '77' }]}>∞ Sem meta definida</Text>
      )}

      {expanded && (
        <View style={hc.detail}>
          {/* Últimos 7 dias */}
          <Text style={hc.detailLabel}>Últimos 7 dias</Text>
          <View style={hc.weekRow}>
            {week.map((d) => {
              const isAdd = dailyStatus[d] === 'ADD';
              const today = isToday(d);
              return (
                <View key={d} style={hc.weekItem}>
                  <Text style={[hc.weekDay, today && { color }]}>{shortWD(d)}</Text>
                  <View style={[
                    hc.weekDot,
                    isAdd ? { backgroundColor: color } : today
                      ? { borderColor: color, borderWidth: 1.5, backgroundColor: 'transparent' }
                      : { backgroundColor: '#27272A' },
                  ]}>
                    {isAdd && <Ionicons name="checkmark" size={11} color="#000" />}
                  </View>
                  <Text style={[hc.weekNum, today && { color }]}>{d.slice(8)}</Text>
                </View>
              );
            })}
          </View>

          {/* Heatmap */}
          <Text style={[hc.detailLabel, { marginTop: 14 }]}>Heatmap (28 dias)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginVertical: 8 }}>
            {lastNDays(28).map((d) => (
              <View key={d} style={[
                { width: 14, height: 14, borderRadius: 3, backgroundColor: '#1E1E24' },
                dailyStatus[d] === 'ADD' && { backgroundColor: color },
                isToday(d) && dailyStatus[d] !== 'ADD' && { borderWidth: 1.5, borderColor: color, backgroundColor: 'transparent' },
              ]} />
            ))}
          </View>

          {/* Mini stats */}
          <View style={hc.statsRow}>
            {[
              { val: totalAdds, label: 'Marcados', c: color },
              { val: personalRecord, label: 'Recorde', c: '#F59E0B' },
              { val: `${successRate}%`, label: 'Sucesso', c: '#818CF8' },
            ].map((st) => (
              <View key={st.label} style={hc.statBox}>
                <Text style={[hc.statVal, { color: st.c }]}>{st.val}</Text>
                <Text style={hc.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const hc = StyleSheet.create({
  card: { backgroundColor: '#111113', borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  emojiBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: '#FAFAFA' },
  todayBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  todayBadgeText: { fontSize: 10, fontWeight: '700' },
  modeLine: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  countBig: { fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  countGoal: { fontSize: 11, color: '#52525B', fontWeight: '600' },
  progressBg: { height: 4, backgroundColor: '#1E1E24', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 2 },
  pctText: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  detail: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#1E1E24', paddingTop: 12 },
  detailLabel: { fontSize: 10, color: '#52525B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekItem: { alignItems: 'center', gap: 4 },
  weekDay: { fontSize: 9, color: '#52525B', fontWeight: '700', textTransform: 'uppercase' },
  weekDot: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  weekNum: { fontSize: 10, color: '#52525B', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statBox: { flex: 1, backgroundColor: '#18181B', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  statVal: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 9, color: '#52525B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },
});

// ── Tela principal ────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { dayCounters } = useCounter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  /**
   * markedDates com markingType='multi-dot':
   * Cada dia recebe até N dots (um por contador que marcou aquele dia).
   * React-native-calendars limita visualmente a ~3 dots por célula, mas passa tudo.
   */
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    dayCounters.forEach((counter) => {
      Object.keys(counter.dailyStatus).forEach((date) => {
        const status = counter.dailyStatus[date];
        if (!marks[date]) marks[date] = { dots: [] };

        if (status === 'ADD') {
          marks[date].dots.push({ key: counter.id, color: counter.color, selectedDotColor: counter.color });
        } else if (status === 'RESET') {
          marks[date].dots.push({ key: `${counter.id}-reset`, color: '#EF4444', selectedDotColor: '#EF4444' });
        }
      });
    });

    // Dia selecionado — highlight
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? { dots: [] }),
        selected: true,
        selectedColor: '#27272A',
      };
    }

    // Hoje — borda
    if (!marks[todayStr]) marks[todayStr] = { dots: [] };
    marks[todayStr] = {
      ...marks[todayStr],
      marked: true,
      todayTextColor: '#10B981',
    };

    return marks;
  }, [dayCounters, selectedDate, todayStr]);

  // Legenda: cores dos contadores
  const legendCounters = dayCounters.slice(0, 4); // máx 4 na legenda

  if (dayCounters.length === 0) {
    return (
      <View style={st.emptyScreen}>
        <Ionicons name="calendar-outline" size={48} color="#27272A" />
        <Text style={st.emptyTitle}>Nenhum contador ainda</Text>
        <Text style={st.emptySub}>Crie um contador na tela inicial para ver o histórico aqui.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>Histórico</Text>

      {/* Dica */}
      <View style={st.hintCard}>
        <Ionicons name="finger-print-outline" size={15} color="#818CF8" />
        <Text style={st.hintText}>
          Toque em qualquer dia para ver quais contadores foram registrados naquele dia.
        </Text>
      </View>

      {/* ── Calendário multi-dot ── */}
      <View style={st.calendarCard}>
        <Calendar
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={(day: { dateString: string }) => {
            setSelectedDate((prev) => (prev === day.dateString ? null : day.dateString));
          }}
          theme={{
            backgroundColor: '#18181B',
            calendarBackground: '#18181B',
            textSectionTitleColor: '#52525B',
            selectedDayBackgroundColor: '#27272A',
            selectedDayTextColor: '#FAFAFA',
            todayTextColor: '#10B981',
            todayBackgroundColor: '#10B98122',
            dayTextColor: '#FAFAFA',
            textDisabledColor: '#3F3F46',
            arrowColor: '#818CF8',
            monthTextColor: '#FAFAFA',
            textDayFontWeight: '600',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '700',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
        />
      </View>

      {/* Legenda de contadores */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}
        contentContainerStyle={st.legendRow}>
        {legendCounters.map((c) => (
          <View key={c.id} style={st.legendItem}>
            <View style={[st.legendDot, { backgroundColor: c.color }]} />
            <Text style={st.legendText} numberOfLines={1}>{c.emoji} {c.name}</Text>
          </View>
        ))}
        {dayCounters.length > 4 && (
          <View style={st.legendItem}>
            <View style={[st.legendDot, { backgroundColor: '#52525B' }]} />
            <Text style={st.legendText}>+{dayCounters.length - 4} mais</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Andamento dos contadores ── */}
      <Text style={st.sectionTitle}>📊 Todos os Contadores</Text>
      {dayCounters.map((counter) => (
        <CounterHistoryCard key={counter.id} counter={counter} />
      ))}

      {/* Modal de detalhe do dia */}
      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          counters={dayCounters}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '800', color: '#FAFAFA', marginBottom: 16, letterSpacing: 0.4 },

  emptyScreen: { flex: 1, backgroundColor: '#09090B', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#3F3F46' },
  emptySub: { fontSize: 13, color: '#27272A', textAlign: 'center', lineHeight: 20 },

  hintCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#1E1B4B', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#312E81', marginBottom: 14 },
  hintText: { flex: 1, fontSize: 12, color: '#A5B4FC', lineHeight: 17 },

  calendarCard: { backgroundColor: '#18181B', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#27272A', marginBottom: 14, elevation: 4 },

  legendRow: { gap: 10, paddingBottom: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#18181B', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#27272A' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#A1A1AA', fontWeight: '600', maxWidth: 100 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FAFAFA', marginBottom: 12 },
});
