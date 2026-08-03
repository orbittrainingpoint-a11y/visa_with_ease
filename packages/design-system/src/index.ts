export const colors = {
  navy900: '#0B1F4B',
  navy800: '#112858',
  navy700: '#1A3373',
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  royal700: '#1547C0',
  royal600: '#1A56DB',
  royal500: '#3B82F6',
  royal100: '#DBEAFE',
  royal50: '#EFF6FF',
  teal600: '#0284C7',
  teal500: '#0EA5E9',
  teal100: '#E0F2FE',
  purple700: '#6D28D9',
  purple600: '#7C3AED',
  purple100: '#EDE9FE',
  green600: '#059669',
  green500: '#10B981',
  green100: '#D1FAE5',
  gold500: '#D97706',
  gold400: '#F59E0B',
  gold100: '#FEF3C7',
  orange500: '#F97316',
  orange100: '#FFEDD5',
  red700: '#B91C1C',
  red600: '#DC2626',
  red500: '#EF4444',
  red100: '#FEE2E2',
  white: '#FFFFFF'
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  sheet: 24,
  pill: 999
} as const;

export const scoreColor = (value: number) =>
  value >= 90 ? colors.green500 : value >= 75 ? '#EAB308' : value >= 50 ? colors.orange500 : colors.red600;

export const gradients = {
  brand: [colors.navy900, colors.royal600],
  action: [colors.royal600, colors.teal500],
  ai: [colors.purple600, '#A78BFA'],
  gold: [colors.gold400, colors.gold500],
  hero: [colors.navy900, colors.purple600, colors.gold400]
} as const;
