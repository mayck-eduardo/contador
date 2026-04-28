import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const DAILY_REMINDER_ID = 'daily-encouragement';
const CHECKIN_REMINDER_ID = 'daily-checkin';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Agendar lembrete específico para um contador.
 */
export async function scheduleCounterReminder(
  counterId: string,
  counterName: string,
  emoji: string,
  hour: number,
  minute: number = 0
): Promise<void> {
  const identifier = `counter-reminder-${counterId}`;
  
  // Cancelar se já existir
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: `${emoji} Hora do seu compromisso!`,
      body: `Não esqueça de registrar seu progresso em "${counterName}" hoje.`,
      sound: true,
      data: { counterId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Cancelar lembrete de um contador.
 */
export async function cancelCounterReminder(counterId: string): Promise<void> {
  const identifier = `counter-reminder-${counterId}`;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
}

/**
 * Schedule the daily encouragement notification at a specific hour.
 */
export async function scheduleDailyEncouragement(
  hour: number = 20,
  minute: number = 0,
  enabled: boolean = true
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});

  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: '💪 Você está firme!',
      body: 'Mais um dia resistindo. Continue assim — cada dia conta!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Schedule a check-in reminder if user hasn't marked today yet.
 */
export async function scheduleCheckinReminder(enabled: boolean = true): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(CHECKIN_REMINDER_ID).catch(() => {});

  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    identifier: CHECKIN_REMINDER_ID,
    content: {
      title: '📝 Não se esqueça!',
      body: 'Você marcou seu dia hoje? Abra o app e registre mais um dia vencido!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });
}

/**
 * Immediate notification triggered when user reaches a milestone.
 */
export async function triggerMilestoneNotification(days: number): Promise<void> {
  const milestones: Record<number, { title: string; body: string }> = {
    7: { title: '🏆 1 semana!', body: 'Incrível! 7 dias sem ceder. Você provou que tem força de vontade!' },
    14: { title: '🏆 2 semanas!', body: '14 dias! A disciplina está virando hábito. Continue!' },
    21: { title: '🏆 3 semanas!', body: '21 dias — dizem que leva 21 dias pra criar um hábito. Você fez isso!' },
    30: { title: '🏆 30 dias!', body: 'Um mês inteiro! Você é uma inspiração. Continue a jornada! 🎉' },
    60: { title: '🏆 60 dias!', body: '2 meses de conquista! Você está reescrevendo sua história!' },
    100: { title: '🏆 100 dias!', body: '100 dias! Isso é extraordinário. Compartilhe essa conquista!' },
  };

  const milestone = milestones[days];
  if (!milestone) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: milestone.title,
      body: milestone.body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
