import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useCounter } from '../../context/CounterContext';

LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

export default function CalendarScreen() {
  const { dailyStatus, totalCount, personalRecord, currentStreak, successRate } = useCounter();

  const markedDates = useMemo(() => {
    const marks: any = {};
    Object.keys(dailyStatus).forEach((date) => {
      if (dailyStatus[date] === 'ADD') {
        marks[date] = {
          selected: true,
          selectedColor: '#10B981',
          selectedTextColor: '#fff',
        };
      } else if (dailyStatus[date] === 'RESET') {
        marks[date] = {
          selected: true,
          selectedColor: '#EF4444',
          selectedTextColor: '#fff',
        };
      }
    });
    return marks;
  }, [dailyStatus]);

  const totalAdds = Object.values(dailyStatus).filter((v) => v === 'ADD').length;
  const totalResets = Object.values(dailyStatus).filter((v) => v === 'RESET').length;

  const stats = [
    { value: totalCount.toString(), label: 'Total acumulado', color: '#10B981' },
    { value: `${successRate}%`, label: 'Taxa de sucesso', color: '#818CF8' },
    { value: personalRecord.toString(), label: 'Maior sequência', color: '#F59E0B' },
    { value: totalResets.toString(), label: 'Resets totais', color: '#EF4444' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Histórico</Text>

      {/* Calendar */}
      <View style={styles.calendarCard}>
        <Calendar
          markedDates={markedDates}
          theme={{
            backgroundColor: '#18181B',
            calendarBackground: '#18181B',
            textSectionTitleColor: '#71717A',
            selectedDayBackgroundColor: '#10B981',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#10B981',
            todayBackgroundColor: '#042F2E',
            dayTextColor: '#FAFAFA',
            textDisabledColor: '#3F3F46',
            dotColor: '#10B981',
            selectedDotColor: '#ffffff',
            arrowColor: '#10B981',
            monthTextColor: '#FAFAFA',
            indicatorColor: '#10B981',
            textDayFontWeight: '500',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 15,
            textMonthFontSize: 17,
            textDayHeaderFontSize: 13,
          }}
        />
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Dia marcado</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Reinício</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#042F2E', borderWidth: 1, borderColor: '#10B981' }]} />
          <Text style={styles.legendText}>Hoje</Text>
        </View>
      </View>

      {/* Stats grid */}
      <Text style={styles.sectionTitle}>Estatísticas</Text>
      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Current streak highlight */}
      {currentStreak > 0 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakTitle}>Sequência Atual</Text>
            <Text style={styles.streakSub}>
              {currentStreak} {currentStreak === 1 ? 'dia consecutivo' : 'dias consecutivos'}! Continue assim!
            </Text>
          </View>
          <Text style={styles.streakCount}>{currentStreak}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FAFAFA',
    marginBottom: 20,
    letterSpacing: 0.4,
  },
  calendarCard: {
    backgroundColor: '#18181B',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 28,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#18181B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#042F2E',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#065F46',
    gap: 12,
  },
  streakEmoji: {
    fontSize: 28,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34D399',
    marginBottom: 2,
  },
  streakSub: {
    fontSize: 12,
    color: '#10B981',
    flex: 1,
  },
  streakCount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#34D399',
    marginLeft: 'auto',
  },
});
