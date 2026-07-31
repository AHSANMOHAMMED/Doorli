/**
 * Doorli Mobile — Shared Color Constants
 *
 * Single source of truth for all colors used in the mobile app.
 * Mirrors the Doorli brand tokens defined in @doorli/design-tokens (web).
 *
 * Usage:
 *   import { DoorliColors, DoorliGlass } from '@/constants/colors';
 */

export const DoorliColors = {
  // ── Brand Primaries ─────────────────────────────────────────────────────
  primary:     '#185fa5',  // Doorli Blue  (was #006e25 green — now unified)
  primaryDark: '#0e4a82',
  sky:         '#378add',  // Doorli Sky (lighter blue)

  // ── Secondary / Accents ──────────────────────────────────────────────────
  teal:        '#1d9e75',  // Doorli Teal
  mint:        '#5dcaa5',  // Doorli Mint
  gold:        '#fac775',  // Doorli Gold
  rose:        '#f2668b',  // Doorli Rose
  purple:      '#8b5cf6',  // Doorli Purple
  pink:        '#ec4899',

  // ── Backgrounds ──────────────────────────────────────────────────────────
  navy:        '#060b1c',  // Doorli Navy (darkest)
  navyMid:     '#0a132e',  // Doorli Navy Mid
  deep:        '#030712',  // Doorli Deep

  // ── Text ─────────────────────────────────────────────────────────────────
  text:        '#f4f7fb',  // Primary text
  textMuted:   '#9bb4d0',  // Secondary text
  textDim:     '#6b86a6',  // Tertiary / placeholder text

  // ── Semantic ─────────────────────────────────────────────────────────────
  success:     '#1d9e75',
  warning:     '#fac775',
  danger:      '#f2668b',
  info:        '#378add',
};

export const DoorliGlass = {
  // ── Glassmorphism surfaces ────────────────────────────────────────────────
  bg:              'rgba(255, 255, 255, 0.08)',
  bgStrong:        'rgba(255, 255, 255, 0.12)',
  border:          'rgba(255, 255, 255, 0.10)',
  borderStrong:    'rgba(255, 255, 255, 0.18)',
  cardBg:          'rgba(255, 255, 255, 0.05)',
  shadow:          'rgba(3, 7, 18, 0.45)',
};

export const DoorliGradients = {
  // ── Linear gradient color stops ───────────────────────────────────────────
  primary:   ['rgba(24, 95, 165, 0.85)', 'rgba(55, 138, 221, 0.85)'] as const,
  teal:      ['rgba(29, 158, 117, 0.85)', 'rgba(93, 202, 165, 0.85)'] as const,
  bgBlue:    ['rgba(24, 95, 165, 0.4)', 'transparent'] as const,
  bgTeal:    ['rgba(29, 158, 117, 0.35)', 'transparent'] as const,
  bgGold:    ['rgba(250, 199, 117, 0.15)', 'transparent'] as const,
};

/** Doorli border radius values (matches web tokens) */
export const DoorliRadius = {
  sm:  12,
  md:  14,
  lg:  16,
  xl:  20,
  full: 9999,
};
