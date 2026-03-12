import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useCounter } from '../../context/CounterContext';
import { Ionicons } from '@expo/vector-icons';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function SettingsScreen() {
  const {
    totalCount,
    goalDays,
    personalRecord,
    currentStreak,
    successRate,
    notificationsEnabled,
    notificationHour,
    watchedApps,
    setNotificationsEnabled,
    setNotificationHour,
    addWatchedApp,
    removeWatchedApp,
  } = useCounter();

  const [newAppName, setNewAppName] = useState('');
  const [showHourPicker, setShowHourPicker] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleAddApp = () => {
    if (!newAppName.trim()) return;
    addWatchedApp(newAppName.trim());
    setNewAppName('');
    inputRef.current?.blur();
  };

  const handleOpenScreenTime = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings().catch(() =>
        Alert.alert('Erro', 'Não foi possível abrir as configurações.')
      );
    } else {
      Alert.alert('iOS', 'Vá em Configurações > Tempo de Tela para gerenciar o uso dos apps.');
    }
  };

  const formatHour = (h: number) => {
    const period = h < 12 ? 'AM' : 'PM';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:00 ${period}`;
  };

  const profileStats = [
    { value: totalCount.toString(), label: 'Dias totais', color: '#10B981' },
    { value: personalRecord.toString(), label: 'Recorde', color: '#F59E0B' },
    { value: `${successRate}%`, label: 'Sucesso', color: '#818CF8' },
    { value: currentStreak.toString(), label: 'Sequência', color: '#34D399' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configurações</Text>

      {/* Profile summary card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{totalCount > 0 ? '🏆' : '🌱'}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>Seu Progresso</Text>
            <Text style={styles.profileSub}>Meta atual: {goalDays} dias</Text>
          </View>
        </View>
        <View style={styles.profileStatsRow}>
          {profileStats.map((s) => (
            <View key={s.label} style={styles.profileStatItem}>
              <Text style={[styles.profileStatValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.profileStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* NOTIFICATIONS */}
      <Text style={styles.sectionHeader}>🔔 Notificações</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Ativar notificações</Text>
            <Text style={styles.sublabel}>Encorajamento diário e marcos</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#27272A', true: '#065F46' }}
            thumbColor={notificationsEnabled ? '#10B981' : '#52525B'}
          />
        </View>
      </View>

      {notificationsEnabled && (
        <View style={styles.card}>
          <Text style={styles.label}>Horário do lembrete diário</Text>
          <TouchableOpacity
            style={styles.hourButton}
            onPress={() => setShowHourPicker(!showHourPicker)}
          >
            <Text style={styles.hourButtonText}>{formatHour(notificationHour)}</Text>
            <Ionicons name={showHourPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#71717A" />
          </TouchableOpacity>

          {showHourPicker && (
            <ScrollView style={styles.hourList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {HOURS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.hourItem, h === notificationHour && styles.hourItemSelected]}
                  onPress={() => { setNotificationHour(h); setShowHourPicker(false); }}
                >
                  <Text style={[styles.hourItemText, h === notificationHour && styles.hourItemTextActive]}>
                    {formatHour(h)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={15} color="#818CF8" />
        <Text style={styles.infoText}>
          Você recebe avisos ao atingir 7, 14, 21, 30, 60 e 100 dias, e mensagem de encorajamento ao reiniciar.
        </Text>
      </View>

      {/* WATCHED APPS */}
      <Text style={styles.sectionHeader}>📵 Apps que quero evitar</Text>
      <Text style={styles.sectionDesc}>
        Registre os apps que está evitando. Use como lembrete do seu compromisso.
      </Text>

      <View style={styles.card}>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Ex: Instagram, TikTok..."
            placeholderTextColor="#3F3F46"
            value={newAppName}
            onChangeText={setNewAppName}
            onSubmitEditing={handleAddApp}
            returnKeyType="done"
            autoCapitalize="words"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddApp}>
            <Ionicons name="add" size={22} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      {watchedApps.length > 0 ? (
        <View style={styles.card}>
          {watchedApps.map((app, i) => (
            <View
              key={app.id}
              style={[styles.appRow, i < watchedApps.length - 1 && styles.appRowBorder]}
            >
              <View style={styles.appIcon}>
                <Text style={styles.appIconText}>{app.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.appName}>{app.name}</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Remover?', `Remover "${app.name}"?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Remover', style: 'destructive', onPress: () => removeWatchedApp(app.id) },
                  ])
                }
              >
                <Ionicons name="trash-outline" size={17} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhum app adicionado</Text>
        </View>
      )}

      <TouchableOpacity style={styles.systemButton} onPress={handleOpenScreenTime}>
        <Ionicons name="time-outline" size={18} color="#818CF8" />
        <View style={{ flex: 1 }}>
          <Text style={styles.systemButtonLabel}>Abrir Tempo de Tela</Text>
          <Text style={styles.systemButtonSub}>Configurar limites no sistema</Text>
        </View>
        <Ionicons name="chevron-forward" size={15} color="#3F3F46" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FAFAFA',
    marginBottom: 20,
    letterSpacing: 0.4,
  },

  // Profile card
  profileCard: {
    backgroundColor: '#18181B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 28,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#042F2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#065F46',
  },
  avatarText: { fontSize: 24 },
  profileName: { fontSize: 16, fontWeight: '700', color: '#FAFAFA' },
  profileSub: { fontSize: 12, color: '#71717A', marginTop: 2 },
  profileStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingTop: 16,
  },
  profileStatItem: { alignItems: 'center', flex: 1 },
  profileStatValue: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  profileStatLabel: { fontSize: 10, color: '#71717A', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  // Section headers
  sectionHeader: { fontSize: 15, fontWeight: '700', color: '#FAFAFA', marginBottom: 10 },
  sectionDesc: { fontSize: 13, color: '#52525B', marginBottom: 12, lineHeight: 18 },

  // Generic card
  card: {
    backgroundColor: '#18181B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { flex: 1, marginRight: 12 },
  label: { fontSize: 15, fontWeight: '600', color: '#FAFAFA', marginBottom: 2 },
  sublabel: { fontSize: 12, color: '#71717A' },

  // Hour picker
  hourButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#09090B',
    borderRadius: 12,
    padding: 13,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  hourButtonText: { fontSize: 18, fontWeight: '700', color: '#10B981' },
  hourList: {
    maxHeight: 200,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  hourItem: { paddingVertical: 12, paddingHorizontal: 16 },
  hourItemSelected: { backgroundColor: '#042F2E' },
  hourItemText: { fontSize: 14, color: '#71717A', fontWeight: '500' },
  hourItemTextActive: { color: '#10B981', fontWeight: '700' },

  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E1B4B',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#312E81',
    marginBottom: 24,
  },
  infoText: { flex: 1, fontSize: 12, color: '#A5B4FC', lineHeight: 17 },

  // App input
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#FAFAFA',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#042F2E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#065F46',
  },

  // App list
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
  },
  appRowBorder: { borderBottomWidth: 1, borderBottomColor: '#27272A' },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: { fontSize: 15, fontWeight: '700', color: '#A1A1AA' },
  appName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#FAFAFA' },

  emptyCard: {
    backgroundColor: '#18181B',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: { color: '#3F3F46', fontSize: 14, fontWeight: '500' },

  systemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    marginTop: 4,
  },
  systemButtonLabel: { fontSize: 14, fontWeight: '600', color: '#FAFAFA' },
  systemButtonSub: { fontSize: 11, color: '#71717A', marginTop: 1 },
});
