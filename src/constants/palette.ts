/**
 * App colors. The UI uses three main colors (navy, orange, cream).
 * Green and red are only used as game signals; the rest are scene art colors.
 */
export const Palette = {
  // Main scheme
  navy: '#141A2E',
  orange: '#F28C28',
  cream: '#FFF6E9',

  // Tints of the main scheme
  navyLight: '#232B48',
  orangeDark: '#C96A12',
  creamDim: 'rgba(255, 246, 233, 0.72)',
  overlay: 'rgba(20, 26, 46, 0.82)',

  // Game signals
  green: '#3DDC84',
  red: '#FF4D4D',

  // Scene art
  stands: '#0E1222',
  standsRow: '#1A2038',
  wood: '#C68642',
  woodDark: '#A86B32',
  courtLine: 'rgba(255, 246, 233, 0.55)',
  backboard: '#F5F5F5',
  rim: '#E2531B',
  skin: '#C98B5E',
  skinDark: '#A8704A',
  jumbotron: '#05070D',
} as const;

export const CrowdShirts = ['#F28C28', '#FFF6E9', '#3B4A7A', '#D9534F', '#E8B04A'] as const;
export const CrowdSkins = ['#8D5524', '#C68642', '#E0AC69', '#F1C27D'] as const;
