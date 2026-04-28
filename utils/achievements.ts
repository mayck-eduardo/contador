export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: (stats: { count: number; streak: number; totalAdds: number; personalRecord: number }) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'Primeiro Passo',
    description: 'Marcou o seu primeiro dia em qualquer contador.',
    icon: '🌱',
    color: '#10B981',
    requirement: (s) => s.totalAdds >= 1,
  },
  {
    id: 'one_week',
    title: 'Uma Semana',
    description: 'Completou 7 dias seguidos (sequência).',
    icon: '🎯',
    color: '#818CF8',
    requirement: (s) => s.streak >= 7,
  },
  {
    id: 'consistent',
    title: 'Consistente',
    description: 'Completou 30 dias totais marcados.',
    icon: '💪',
    color: '#F59E0B',
    requirement: (s) => s.totalAdds >= 30,
  },
  {
    id: 'warrior',
    title: 'Guerreiro de Ferro',
    description: 'Atingiu uma sequência de 30 dias seguidos.',
    icon: '🔥',
    color: '#EF4444',
    requirement: (s) => s.streak >= 30,
  },
  {
    id: 'hundred_days',
    title: 'Mestre da Rotina',
    description: 'Completou 100 dias totais.',
    icon: '👑',
    color: '#E879F9',
    requirement: (s) => s.totalAdds >= 100,
  },
  {
    id: 'personal_best',
    title: 'Superação',
    description: 'Bateu seu recorde pessoal de sequência (30+ dias).',
    icon: '⚡',
    color: '#34D399',
    requirement: (s) => s.personalRecord >= 30,
  },
];
