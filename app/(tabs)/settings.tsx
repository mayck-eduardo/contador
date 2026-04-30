/**
 * Tela de Configurações
 */

import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  Switch, ScrollView, Alert, Modal,
} from 'react-native';
import { useCounter } from '../../context/CounterContext';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { ACHIEVEMENTS } from '../../utils/achievements';
import { getDayCounterStatsStatic, calculateLevel, calculateXpProgress, LEVEL_THRESHOLDS } from '../../utils/counterUtils';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function SettingsScreen() {
  const { themeMode, setThemeMode, colors } = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);
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
    exportData,
    importData,
    globalXp = 0,
  } = useCounter();

  const [showHourPicker, setShowHourPicker] = useState(false);

  // Stats agregadas (usando utilitários centralizados)
  const allStats = dayCounters.map(c => getDayCounterStatsStatic(c));
  const totalDaysMarked = allStats.reduce((s, st) => s + st.totalAdds, 0);
  const bestRecord = allStats.reduce((m, st) => Math.max(m, st.personalRecord), 0);
  const markedToday = allStats.filter(st => st.hasAddedToday).length;
  const currentMaxStreak = allStats.reduce((m, st) => Math.max(m, st.streak), 0);

  const aggregate = {
    count: allStats.reduce((s, st) => s + st.count, 0),
    streak: currentMaxStreak,
    totalAdds: totalDaysMarked,
    personalRecord: bestRecord
  };

  const userLevel = calculateLevel(globalXp);
  const xpProgress = calculateXpProgress(globalXp, userLevel);
  const nextLevelXp = userLevel < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[userLevel] : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const currentLevelXp = userLevel > 1 ? LEVEL_THRESHOLDS[userLevel - 1] : 0;

  const formatHour = (h: number) => {
    const p = h < 12 ? 'AM' : 'PM';
    const d = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${d}:00 ${p}`;
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      await Clipboard.setStringAsync(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Dados Copiados', 
        'O código de backup foi copiado para sua área de transferência. Deseja também salvar como arquivo?',
        [
          { text: 'Apenas Copiar', style: 'cancel' },
          { 
            text: 'Salvar Arquivo', 
            onPress: async () => {
              // Em Expo, Sharing.shareAsync com texto bruto funciona em alguns apps.
              // Melhor apenas reafirmar que foi copiado ou usar Share nativo.
              Alert.alert('Backup', data);
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Erro', 'Falha ao exportar dados.');
    }
  };

  const handleImport = async () => {
    Alert.prompt(
      'Importar Dados',
      'Cole o código JSON exportado abaixo. ATENÇÃO: Isso substituirá todos os seus dados atuais.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Importar', 
          onPress: async (text?: string) => {
            if (!text) return;
            const ok = await importData(text);
            if (ok) Alert.alert('Sucesso', 'Dados importados com sucesso!');
            else Alert.alert('Erro', 'Código JSON inválido.');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={[s.title, { color: colors.text }]}>Configurações</Text>

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
        
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#27272A' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: '#A1A1AA', fontSize: 12 }}>Nível {userLevel}</Text>
            <Text style={{ color: '#71717A', fontSize: 11 }}>{globalXp.toLocaleString()} XP</Text>
          </View>
          <View style={{ height: 6, backgroundColor: '#1E1E24', borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ width: `${xpProgress}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 }} />
          </View>
          <Text style={{ color: '#52525B', fontSize: 10, marginTop: 4 }}>
            {nextLevelXp.toLocaleString()} XP para o próximo nível
          </Text>
        </View>
      </View>

      {/* ── Aparência ── */}
      <Text style={[s.section, { color: colors.text }]}>🎨 Aparência</Text>
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <TouchableOpacity style={s.row} onPress={() => setShowThemeModal(true)}>
          <View style={s.rowText}>
            <Text style={[s.label, { color: colors.text }]}>Tema</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>{themeMode === 'dark' ? 'Escuro' : themeMode === 'light' ? 'Claro' : 'Seguir sistema'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Modal visible={showThemeModal} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={[s.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Escolha o Tema</Text>
            {([
              { id: 'dark', label: 'Escuro' },
              { id: 'light', label: 'Claro' },
              { id: 'auto', label: 'Seguir sistema' },
            ] as { id: ThemeMode; label: string }[]).map((t) => (
              <TouchableOpacity key={t.id} style={[s.themeOption, { backgroundColor: themeMode === t.id ? colors.primaryBg : colors.inputBg }]} onPress={() => { setThemeMode(t.id); setShowThemeModal(false); }}>
                <Text style={[s.themeOptionText, { color: colors.text }]}>{t.label}</Text>
                {themeMode === t.id && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.themeCancel, { borderTopColor: colors.cardBorder }]} onPress={() => setShowThemeModal(false)}>
              <Text style={[s.themeCancelText, { color: colors.primary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                    {c.mode === 'streak' ? '🔥 Sequência' : c.mode === 'simple' ? '📊 Contagem' : '⚡ Ambos'} · Meta {c.goalDays}d
                  </Text>
                </View>
                <Text style={[s.counterCount, { color: c.color }]}>{c.mode === 'both' ? stats.totalAdds : stats.count}</Text>
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

      {/* ── Conquistas ── */}
      <Text style={s.section}>🏆 Suas Medalhas</Text>
      <Text style={s.desc}>Baseadas no seu progresso total em todos os contadores.</Text>
      <View style={s.achievementsGrid}>
        {ACHIEVEMENTS.map((ach) => {
          const unlocked = ach.requirement(aggregate);
          return (
            <View key={ach.id} style={[s.achCard, !unlocked && { opacity: 0.4, filter: 'grayscale(1)' }]}>
              <View style={[s.achIconWrap, { backgroundColor: ach.color + '20' }]}>
                <Text style={{ fontSize: 24 }}>{unlocked ? ach.icon : '🔒'}</Text>
              </View>
              <Text style={s.achTitle} numberOfLines={1}>{ach.title}</Text>
              <Text style={s.achDesc}>{ach.description}</Text>
            </View>
          );
        })}
      </View>

      {/* ── Gerenciamento de Dados ── */}
      <Text style={s.section}>💾 Backup e Sincronização</Text>
      <View style={s.card}>
        <TouchableOpacity style={s.dataBtn} onPress={handleExport}>
          <Ionicons name="cloud-download-outline" size={20} color="#818CF8" />
          <View style={{ flex: 1 }}>
            <Text style={s.dataBtnTitle}>Exportar Dados</Text>
            <Text style={s.dataBtnSub}>Gera um código para backup ou transferência</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
        </TouchableOpacity>
        
        <View style={s.divider} />
        
        <TouchableOpacity style={s.dataBtn} onPress={handleImport}>
          <Ionicons name="cloud-upload-outline" size={20} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={s.dataBtnTitle}>Importar Dados</Text>
            <Text style={s.dataBtnSub}>Restaura dados a partir de um código exportado</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
        </TouchableOpacity>
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

  // Achievements
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  achCard: { width: '48%', backgroundColor: '#111113', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#27272A', alignItems: 'center' },
  achIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  achTitle: { fontSize: 13, fontWeight: '800', color: '#FAFAFA', marginBottom: 4, textAlign: 'center' },
  achDesc: { fontSize: 10, color: '#71717A', textAlign: 'center', lineHeight: 14 },

  // Data buttons
  dataBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
  dataBtnTitle: { fontSize: 14, fontWeight: '700', color: '#FAFAFA' },
  dataBtnSub: { fontSize: 11, color: '#52525B', marginTop: 1 },

  // Theme modal
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { margin: 24, borderRadius: 20, padding: 8, borderWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '700', padding: 16, textAlign: 'center' },
  themeOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14 },
  themeOptionText: { fontSize: 16, fontWeight: '600' },
  themeCancel: { padding: 16, borderTopWidth: 1, alignItems: 'center', marginTop: 8 },
  themeCancelText: { fontSize: 16, fontWeight: '600' },
});
