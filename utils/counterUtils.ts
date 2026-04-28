import { format, subDays, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, getDay, getDate } from 'date-fns';

// ─── XP & Level System ───────────────────────────────────────────────────────────
export const XP_PER_COMPLETION = 10;
export const XP_PER_STREAK_DAY = 5;
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000, 25000, 35000, 50000, 70000, 100000, 150000, 200000, 300000, 400000, 500000];

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function calculateXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) return 0;
  return LEVEL_THRESHOLDS[currentLevel] - (currentLevel > 0 ? LEVEL_THRESHOLDS[currentLevel - 1] : 0);
}

export function calculateXpProgress(currentXp: number, currentLevel: number): number {
  const currentThreshold = currentLevel > 0 ? LEVEL_THRESHOLDS[currentLevel - 1] : 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return currentThreshold > 0 ? ((currentXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100 : 100;
}

// ─── Achievements ───────────────────────────────────────────────────────────
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', name: 'Primeiro Passo', description: 'Complete seu primeiro hábito', icon: '🌟', requirement: 1 },
  { id: 'week_warrior', name: 'Guerreiro da Semana', description: '7 dias consecutivos', icon: '🗓️', requirement: 7 },
  { id: 'fortnite', name: 'Fortnite', description: '14 dias consecutivos', icon: '🎮', requirement: 14 },
  { id: 'monthly_master', name: 'Mestre Mensal', description: '30 dias consecutivos', icon: '📅', requirement: 30 },
  { id: 'dedicated', name: 'Dedicado', description: '60 dias consecutivos', icon: '💪', requirement: 60 },
  { id: 'unstoppable', name: 'Imparável', description: '100 dias consecutivos', icon: '🔥', requirement: 100 },
  { id: 'legend', name: 'Lenda', description: '365 dias consecutivos', icon: '👑', requirement: 365 },
  { id: 'total_10', name: 'Contador', description: '10 hábitos completados no total', icon: '🔟', requirement: 10 },
  { id: 'total_50', name: 'Comprometido', description: '50 hábitos completados no total', icon: '⭐', requirement: 50 },
  { id: 'total_100', name: 'Maratonista', description: '100 hábitos completados no total', icon: '🏆', requirement: 100 },
  { id: 'total_500', name: 'Veterano', description: '500 hábitos completados no total', icon: '🎖️', requirement: 500 },
  { id: 'total_1000', name: 'Mítico', description: '1000 hábitos completados no total', icon: '💎', requirement: 1000 },
  { id: 'level_5', name: 'Aprendiz', description: 'Chegue ao nível 5', icon: '📚', requirement: 5 },
  { id: 'level_10', name: 'Praticante', description: 'Chegue ao nível 10', icon: '📖', requirement: 10 },
  { id: 'level_25', name: 'Expert', description: 'Chegue ao nível 25', icon: '🎓', requirement: 25 },
];

export function getAchievementsForStats(streak: number, totalAdds: number, level: number): Achievement[] {
  return ACHIEVEMENTS.filter(a => {
    if (a.id.includes('total')) return totalAdds >= a.requirement;
    if (a.id.includes('level')) return level >= a.requirement;
    return streak >= a.requirement;
  });
}

export function checkNewAchievements(oldStats: { streak: number; totalAdds: number; level: number }, newStats: { streak: number; totalAdds: number; level: number }): Achievement[] {
  const oldIds = getAchievementsForStats(oldStats.streak, oldStats.totalAdds, oldStats.level).map(a => a.id);
  const newIds = getAchievementsForStats(newStats.streak, newStats.totalAdds, newStats.level).map(a => a.id);
  return ACHIEVEMENTS.filter(a => newIds.includes(a.id) && !oldIds.includes(a.id));
}

// ─── Heatmap Data ───────────────────────────────────────────────────────────
export interface HeatmapData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function generateHeatmapData(status: DailyStatus, weeks: number = 20): HeatmapData[] {
  const today = new Date();
  const startDate = subDays(today, weeks * 7);
  const days = eachDayOfInterval({ start: startDate, end: today });
  
  return days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const count = status[dateStr] === 'ADD' ? 1 : 0;
    return {
      date: dateStr,
      count,
      level: count === 0 ? 0 : 1,
    };
  });
}

// ─── Success Rate by Period ────────────────────────────────────────────────
export function computeWeeklySuccessRate(status: DailyStatus): number {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: today });
  
  let completed = 0;
  daysInWeek.forEach(day => {
    if (status[format(day, 'yyyy-MM-dd')] === 'ADD') completed++;
  });
  
  const totalDays = daysInWeek.length;
  return totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0;
}

export function computeMonthlySuccessRate(status: DailyStatus): number {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: today });
  
  let completed = 0;
  daysInMonth.forEach(day => {
    if (status[format(day, 'yyyy-MM-dd')] === 'ADD') completed++;
  });
  
  const totalDays = daysInMonth.length;
  return totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0;
}

// ─── Frequency-Specific Progress ────────────────────────────────────────
export function shouldCompleteToday(counter: DayCounter): boolean {
  const today = new Date();
  const dayOfWeek = getDay(today);
  const dayOfMonth = getDate(today);
  
  switch (counter.frequencyType) {
    case 'daily':
      return true;
    case 'weekly':
      return dayOfWeek === 0;
    case 'monthly':
      return dayOfMonth === 1;
    case 'specificDays':
      return counter.specificDays?.includes(dayOfWeek) ?? false;
    default:
      return true;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type ActionType = 'ADD' | 'RESET';
export type CountMode = 'streak' | 'simple' | 'both';
export type DailyStatus = Record<string, ActionType>;
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'specificDays';

export interface LastAction {
  type: ActionType;
  date: string;
  previousStatusOnDate: ActionType | null;
}

export interface DayCounter {
  id: string;
  name: string;
  emoji: string;
  color: string;
  mode: CountMode;
  startDate: string;
  dailyStatus: DailyStatus;
  goalDays: number | null; 
  lastAction: LastAction | null;
  // Novos campos
  reminderEnabled?: boolean;
  reminderHour?: number | null;
  frequencyType?: FrequencyType;
  weeklyGoal?: number;
  monthTarget?: number;
  specificDays?: number[];
  // Gamificação
  xp?: number;
  level?: number;
}

export interface UserStats {
  totalXp: number;
  level: number;
  achievementUnlocked: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const getTodayStr = () => format(new Date(), 'yyyy-MM-dd');
export const getYesterdayStr = () => format(subDays(new Date(), 1), 'yyyy-MM-dd');

/**
 * Calcula a sequência (streak) atual.
 */
export function computeStreak(status: DailyStatus): number {
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  const startKey = status[today] === 'ADD' ? today : yesterday;
  if (status[startKey] !== 'ADD') return 0;

  let checkDate = new Date();
  if (startKey === yesterday) checkDate = subDays(checkDate, 1);

  let streak = 0;
  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (status[dateStr] === 'ADD') {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Soma todos os dias marcados como 'ADD'.
 */
export function computeSimpleCount(status: DailyStatus): number {
  return Object.values(status).filter((v) => v === 'ADD').length;
}

/**
 * Retorna a contagem dependendo do modo.
 */
export function computeCount(status: DailyStatus, mode: CountMode): number {
  if (mode === 'both') return computeSimpleCount(status);
  return mode === 'streak' ? computeStreak(status) : computeSimpleCount(status);
}

/**
 * Calcula o recorde pessoal (streak máxima).
 */
export function computePersonalRecord(status: DailyStatus): number {
  const addDates = Object.keys(status)
    .filter((d) => status[d] === 'ADD')
    .sort();
  
  if (addDates.length === 0) return 0;
  
  let maxStreak = 1;
  let tempStreak = 1;
  
  for (let i = 1; i < addDates.length; i++) {
    const prev = new Date(addDates[i - 1] + 'T12:00:00');
    const curr = new Date(addDates[i] + 'T12:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    
    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 1;
    }
  }
  return maxStreak;
}

/**
 * Calcula a taxa de sucesso (dias marcados / total de dias desde o início).
 */
export function computeSuccessRate(status: DailyStatus, startDate?: string): number {
  if (!startDate) {
    const total = Object.keys(status).length;
    if (total === 0) return 0;
    return Math.round((computeSimpleCount(status) / total) * 100);
  }

  const start = new Date(startDate + 'T00:00:00');
  const end = new Date();
  const totalDays = Math.max(differenceInDays(end, start) + 1, 1);
  return Math.min(Math.round((computeSimpleCount(status) / totalDays) * 100), 100);
}

/**
 * Retorna as estatísticas principais de um contador.
 */
export function getDayCounterStatsStatic(counter: DayCounter) {
  const totalAdds = computeSimpleCount(counter.dailyStatus);
  const streak = computeStreak(counter.dailyStatus);
  const personalRecord = computePersonalRecord(counter.dailyStatus);
  const successRate = computeSuccessRate(counter.dailyStatus, counter.startDate);
  
  const count = counter.mode === 'both' ? totalAdds : computeCount(counter.dailyStatus, counter.mode);
  
  const percent =
    counter.goalDays !== null && counter.goalDays > 0
      ? Math.min(Math.round((count / counter.goalDays) * 100), 100)
      : null;
        
  const hasAddedToday = counter.dailyStatus[getTodayStr()] === 'ADD';
  const canUndo = counter.lastAction !== null && counter.lastAction.date === getTodayStr();
  
  return { 
    count, 
    streak, 
    personalRecord, 
    successRate, 
    percent, 
    hasAddedToday, 
    totalAdds, 
    canUndo,
    streakCount: streak,
    simpleCount: totalAdds,
  };
}
