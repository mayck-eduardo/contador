/**
 * Tela de Configurações
 */

import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  Switch, ScrollView, Alert,
} from 'react-native';
import { useCounter, computeSimpleCount, computePersonalRecord } from '../../context/CounterContext';
import { Ionicons } from '@expo/vector-icons';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function SettingsScreen() {
  const {
    dayCounters,
    notificationsEnabled,
    notificationHour,
    countdownTabEnabled,
    setNotificationsEnabled,
    setNotificationHour,
    setCountdownTabEnabled,
    removeDayCounter,
    getDayCounterStats,
  } = useCounter();

  const [showHourPicker, setShowHourPicker] = useState(false);

  // Stats agregadas
  const totalDaysMarked = dayCounters.reduce((s, c) => s + computeSimpleCount(c.dailyStatus), 0);
  const bestRecord = dayCounters.reduce((m, c) => Math.max(m, computePersonalRecord(c.dailyStatus)), 0);
  const today = new Date().toISOString().slice(0, 10);
  const markedToday = dayCounters.filter((c) => c.dailyStatus[today] === 'ADD').length;

  const formatHour = (h: number) => {
    const p = h < 12 ? 'AM' : 'PM';
    const d = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${d}:00 ${p}`;
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Configurações</Text>

      {/* ── Resumo geral ── */}
      <View style={s.profileCard}>
        <View style={s.profileHeader}>
          <View style={s.avatar}>
            <Text style={{ fontSize: 26 }}>
              {markedToday === dayCounters.length && dayCounters.length > 0 ? '🏆' : '🌱'}
            </Text>
          </View>
          <View>
            <Text style={s.profileName}>Visão Geral</Text>
            <Text style={s.profileSub}>{dayCounters.length} contador{dayCounters.length !== 1 ? 'es' : ''} ativos</Text>
          </View>
        </View>
        <View style={s.statsRow}>
          {[
            { val: totalDaysMarked, label: 'Dias totais', color: '#10B981' },
            { val: bestRecord, label: 'Melhor\nrecorde', color: '#F59E0B' },
            { val: dayCounters.length, label: 'Contadores', color: '#818CF8' },
            { val: `${markedToday}/${dayCounters.length}`, label: 'Hoje', color: '#34D399' },
          ].map((st) => (
            <View key={st.label} style={s.statItem}>
              <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Abas ── */}
      <Text style={s.section}>🗂️ Abas Visíveis</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={s.label}>Contagem Regressiva</Text>
            <Text style={s.sub}>Mostrar aba de conta-regressiva</Text>
          </View>
          <Switch
            value={countdownTabEnabled}
            onValueChange={setCountdownTabEnabled}
            trackColor={{ false: '#27272A', true: '#312E81' }}
            thumbColor={countdownTabEnabled ? '#818CF8' : '#52525B'}
          />
        </View>
      </View>

      {/* ── Contadores ── */}
      <Text style={s.section}>🎯 Contadores Criados</Text>
      <Text style={s.desc}>Use o "+" na tela inicial para criar novos contadores.</Text>

      {dayCounters.length === 0 ? (
        <View style={s.emptyCard}>
          <Ionicons name="apps-outline" size={32} color="#27272A" />
          <Text style={s.emptyText}>Nenhum contador criado ainda</Text>
        </View>
      ) : (
        <View style={s.card}>
          {dayCounters.map((c, i) => {
            const stats = getDayCounterStats(c);
            return (
              <View key={c.id} style={[s.counterRow, i < dayCounters.length - 1 && s.rowBorder]}>
                <View style={[s.colorDot, { backgroundColor: c.color }]} />
                <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.counterName}>{c.name}</Text>
                  <Text style={s.counterMeta}>
                    {c.mode === 'streak' ? '🔥 Sequência' : '📊 Contagem'} · Meta {c.goalDays}d
                  </Text>
                </View>
                <Text style={[s.counterCount, { color: c.color }]}>{stats.count}</Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('Remover contador?', `Remover "${c.name}" permanentemente?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Remover', style: 'destructive', onPress: () => removeDayCounter(c.id) },
                    ])
                  }
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Notificações ── */}
      <Text style={s.section}>🔔 Notificações</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={s.label}>Ativar notificações</Text>
            <Text style={s.sub}>Encorajamento diário e marcos</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#27272A', true: '#065F46' }}
            thumbColor={notificationsEnabled ? '#10B981' : '#52525B'}
          />
        </View>

        {notificationsEnabled && (
          <>
            <View style={s.divider} />
            <View style={s.row}>
              <View style={s.rowText}>
                <Text style={s.label}>Horário do lembrete</Text>
                <Text style={s.sub}>Notificação diária</Text>
              </View>
              <TouchableOpacity
                style={s.hourBtn}
                onPress={() => setShowHourPicker((v) => !v)}
              >
                <Text style={s.hourBtnText}>{formatHour(notificationHour)}</Text>
                <Ionicons name={showHourPicker ? 'chevron-up' : 'chevron-down'} size={13} color="#10B981" />
              </TouchableOpacity>
            </View>
            {showHourPicker && (
              <ScrollView style={s.hourList} nestedScrollEnabled>
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[s.hourItem, h === notificationHour && s.hourItemActive]}
                    onPress={() => { setNotificationHour(h); setShowHourPicker(false); }}
                  >
                    <Text style={[s.hourItemText, h === notificationHour && { color: '#10B981', fontWeight: '700' }]}>
                      {formatHour(h)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </View>

      <View style={s.infoCard}>
        <Ionicons name="information-circle-outline" size={15} color="#818CF8" />
        <Text style={s.infoText}>
          Você recebe avisos ao atingir 7, 14, 21, 30, 60 e 100 dias em qualquer contador.
        </Text>
      </View>

      {/* ── Sugestões de melhoria ── */}
      <Text style={s.section}>💡 Próximas Melhorias</Text>
      <Text style={s.desc}>Funcionalidades planejadas para o app.</Text>

      {[
        { icon: 'pencil-outline', color: '#818CF8', bg: '#1E1B4B', border: '#312E81', title: 'Editar contadores', desc: 'Renomear, trocar emoji, cor, modo e meta de contadores existentes.' },
        { icon: 'trophy-outline', color: '#F59E0B', bg: '#292009', border: '#78350F', title: 'Conquistas e badges', desc: 'Desbloqueie medalhas ao atingir sequências de 7, 30, 100 dias e mais.' },
        { icon: 'stats-chart-outline', color: '#06B6D4', bg: '#082F49', border: '#0E4B6B', title: 'Estatísticas avançadas', desc: 'Gráficos de evolução mensal, comparativo entre contadores e heatmap anual.' },
        { icon: 'notifications-outline', color: '#10B981', bg: '#042F2E', border: '#065F46', title: 'Lembretes por contador', desc: 'Horário de notificação individual para cada contador.' },
        { icon: 'share-social-outline', color: '#E879F9', bg: '#2D1344', border: '#6B21A8', title: 'Compartilhar progresso', desc: 'Compartilhe seu streak e conquistas como imagem nas redes sociais.' },
        { icon: 'cloud-upload-outline', color: '#FB923C', bg: '#2A1200', border: '#7C2D12', title: 'Backup na nuvem', desc: 'Sincronize seus dados entre dispositivos com Google Drive ou iCloud.' },
      ].map((item) => (
        <View key={item.title} style={[s.suggCard, { borderColor: item.border }]}>
          <View style={[s.suggIcon, { backgroundColor: item.bg, borderColor: item.border }]}>
            <Ionicons name={item.icon as any} size={20} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.suggTitle, { color: item.color }]}>{item.title}</Text>
            <Text style={s.suggDesc}>{item.desc}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  title: { fontSize: 26, fontWeight: '800', color: '#FAFAFA', marginBottom: 20, letterSpacing: 0.4 },

  // Profile
  profileCard: { backgroundColor: '#18181B', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#27272A', marginBottom: 28 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#042F2E', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#065F46' },
  profileName: { fontSize: 16, fontWeight: '700', color: '#FAFAFA' },
  profileSub: { fontSize: 12, color: '#71717A', marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#27272A', paddingTop: 16 },
  statItem: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 9, color: '#71717A', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },

  section: { fontSize: 15, fontWeight: '700', color: '#FAFAFA', marginBottom: 10 },
  desc: { fontSize: 13, color: '#52525B', marginBottom: 12, lineHeight: 18 },

  card: { backgroundColor: '#18181B', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#27272A', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { flex: 1, marginRight: 12 },
  label: { fontSize: 15, fontWeight: '600', color: '#FAFAFA', marginBottom: 2 },
  sub: { fontSize: 12, color: '#71717A' },
  divider: { height: 1, backgroundColor: '#27272A', marginVertical: 12 },

  emptyCard: { backgroundColor: '#18181B', borderRadius: 18, padding: 24, borderWidth: 1, borderColor: '#27272A', alignItems: 'center', gap: 8, marginBottom: 10 },
  emptyText: { color: '#3F3F46', fontSize: 14, fontWeight: '500' },

  counterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#27272A' },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  counterName: { fontSize: 14, fontWeight: '700', color: '#FAFAFA' },
  counterMeta: { fontSize: 11, color: '#71717A', marginTop: 1 },
  counterCount: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },

  hourBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#09090B', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#27272A' },
  hourBtnText: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  hourList: { maxHeight: 180, marginTop: 8, borderRadius: 12, backgroundColor: '#09090B', borderWidth: 1, borderColor: '#27272A' },
  hourItem: { paddingVertical: 11, paddingHorizontal: 16 },
  hourItemActive: { backgroundColor: '#042F2E' },
  hourItemText: { fontSize: 14, color: '#71717A', fontWeight: '500' },

  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1E1B4B', borderRadius: 14, padding: 12, gap: 8, borderWidth: 1, borderColor: '#312E81', marginBottom: 24 },
  infoText: { flex: 1, fontSize: 12, color: '#A5B4FC', lineHeight: 17 },

  // Suggestion cards
  suggCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#111113', borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 10 },
  suggIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  suggTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  suggDesc: { fontSize: 12, color: '#52525B', lineHeight: 17 },
});
