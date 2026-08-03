export const colors = {
  navy900: '#0B1F4B',
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  royal700: '#1547C0',
  royal600: '#1A56DB',
  royal100: '#DBEAFE',
  royal50: '#EFF6FF',
  teal500: '#0EA5E9',
  purple700: '#6D28D9',
  purple600: '#7C3AED',
  purple100: '#EDE9FE',
  green500: '#10B981',
  green100: '#D1FAE5',
  gold500: '#D97706',
  gold400: '#F59E0B',
  gold100: '#FEF3C7',
  orange500: '#F97316',
  orange100: '#FFEDD5',
  white: '#FFFFFF'
} as const;

export const scoreColor = (value: number) =>
  value >= 90 ? colors.green500 : value >= 75 ? '#EAB308' : value >= 50 ? colors.orange500 : '#DC2626';
