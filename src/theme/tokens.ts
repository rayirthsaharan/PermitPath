export type ColorTokens = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  night: string;
  amber: string;
  success: string;
  danger: string;
  driveBg: string;
};

export const lightColors: ColorTokens = {
  bg: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1F5',
  border: '#E1E5EB',
  text: '#0F1A2A',
  textMuted: '#5B6576',
  primary: '#1D5FB8',
  onPrimary: '#FFFFFF',
  night: '#5A4BD1',
  amber: '#E0A400',
  success: '#1E8E5A',
  danger: '#C0392B',
  driveBg: '#05070C',
};

export const darkColors: ColorTokens = {
  bg: '#0B1220',
  surface: '#141D2F',
  surfaceAlt: '#1C2740',
  border: '#26324A',
  text: '#E9EEF6',
  textMuted: '#98A4B8',
  primary: '#5C9DFF',
  onPrimary: '#0B1220',
  night: '#9A8CFF',
  amber: '#F5C542',
  success: '#3CC489',
  danger: '#FF6B5E',
  driveBg: '#05070C',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { card: 16, chip: 999, button: 14 } as const;

export type TypeStyle = {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
  lineHeight: number;
};

export const typography = {
  hero: { fontSize: 44, fontWeight: '700', lineHeight: 52 },
  display: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  headline: { fontSize: 17, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
} as const satisfies Record<string, TypeStyle>;

export type Typography = typeof typography;
