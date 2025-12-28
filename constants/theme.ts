export const colors = {
  // Warm, muted backgrounds
  background: '#F8F5F1',
  surface: '#FFFDFB',
  overlay: 'rgba(245, 240, 235, 0.98)',

  // Earthy, muted accent colors
  clay: '#C5968F',
  terracotta: '#B88B7F',
  warmSage: '#9DAA96',
  stone: '#A79C93',
  sand: '#E8DFD6',

  // Text colors - warm, not harsh
  text: '#3E3832',
  textMedium: '#6B645C',
  textLight: '#8F8881',
  textSubtle: '#B5AFA8',

  // Subtle borders
  border: '#E8E1D9',
  borderLight: '#F0EBE5',

  // Feedback colors - muted
  error: '#C19B96',
  success: '#A7B3A1',

  // Overlay for modals
  modalOverlay: 'rgba(62, 56, 50, 0.4)',
};

export const spacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 64,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 999,
};

export const typography = {
  // Editorial serif headings
  display: {
    fontFamily: 'Cormorant_600SemiBold',
    fontSize: 36,
    lineHeight: 42,
    color: colors.text,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: 'Cormorant_500Medium',
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: 'Cormorant_500Medium',
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  subheading: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.2,
  },

  // Body text - clean sans-serif
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
  bodyMedium: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textLight,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMedium,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};

export const shadows = {
  subtle: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  soft: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};
