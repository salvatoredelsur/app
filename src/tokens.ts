export const SS = {
  bg:        '#060c18',
  sidebar:   '#080e1c',
  card:      '#0c1828',
  card2:     '#0f2038',
  border:    'rgba(0,180,255,0.10)',
  blue:      '#00aaff',
  cyan:      '#00e5ff',
  green:     '#00e896',
  pink:      '#ff3080',
  purple:    '#a855f7',
  orange:    '#ff7c2a',
  yellow:    '#ffe040',
  red:       '#ff4560',
  silver:    '#c8d0e0',
  dimText:   'rgba(255,255,255,0.45)',
  mutedText: 'rgba(255,255,255,0.25)',
} as const;

export const SECTION_COLORS = {
  dashboard:     SS.cyan,
  salud:         SS.green,
  productividad: SS.yellow,
  habitos:       SS.purple,
  finanzas:      SS.green,
} as const;

export type SectionId = keyof typeof SECTION_COLORS;
