/**
 * DeepWork Design System — Bugatti-inspired
 *
 * Principles:
 *  - Pure black canvas. No gradients. No shadows.
 *  - Three type roles: Display (uppercase tracked), Body, Mono (buttons/captions).
 *  - Weight 400 everywhere. Emphasis via size, tracking, case — never bold.
 *  - Buttons: transparent + 1px white outline + pill (borderRadius 9999).
 *  - Cards: #141414, 0px border radius, 1px hairline border.
 *  - One accent: #c3d9f3 (ice blue). Use sparingly.
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';

// ─── Font families ─────────────────────────────────────────────────────────────
export const MONO: string =
  Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// ─── Colors ────────────────────────────────────────────────────────────────────
export const C = {
  canvas:          '#000000',
  surfaceSoft:     '#0d0d0d',
  surfaceCard:     '#141414',
  surfaceElevated: '#1f1f1f',
  hairline:        '#262626',
  hairlineStrong:  '#3a3a3a',
  onDark:          '#ffffff',
  body:            '#cccccc',
  bodyStrong:      '#e6e6e6',
  muted:           '#999999',
  mutedSoft:       '#666666',
  accent:          '#c3d9f3',  // ice blue — only chromatic color
  danger:          '#cc4444',
  warning:         '#d4a017',
} as const;

// ─── Type styles ───────────────────────────────────────────────────────────────
// Display: uppercase, tracked, weight 400 — headlines & wordmark
// Mono:    monospace, uppercase, tracked  — buttons, captions, nav labels
// Body:    sentence case, no tracking     — running text

export const T: Record<string, TextStyle> = {
  wordmark: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: C.onDark,
  },
  displayXL: {
    fontSize: 38,
    fontWeight: '400',
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: C.onDark,
    lineHeight: 44,
  },
  displayLG: {
    fontSize: 26,
    fontWeight: '400',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: C.onDark,
    lineHeight: 32,
  },
  displayMD: {
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: C.onDark,
    lineHeight: 24,
  },
  displaySM: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: C.onDark,
    lineHeight: 20,
  },
  button: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: C.onDark,
  },
  caption: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: C.muted,
    lineHeight: 16,
  },
  bodyMD: {
    fontSize: 15,
    fontWeight: '400',
    color: C.body,
    lineHeight: 22,
  },
  bodySM: {
    fontSize: 13,
    fontWeight: '400',
    color: C.muted,
    lineHeight: 20,
  },
};

// ─── Shared component styles ───────────────────────────────────────────────────

/** Primary CTA: transparent + 1px white outline + pill */
export const BTN_PRIMARY: ViewStyle = {
  borderWidth: 1,
  borderColor: C.onDark,
  borderRadius: 9999,
  paddingVertical: 15,
  paddingHorizontal: 32,
  alignItems: 'center',
  backgroundColor: 'transparent',
  minHeight: 44,
  justifyContent: 'center',
};

/** Ghost button (secondary, smaller) */
export const BTN_GHOST: ViewStyle = {
  borderWidth: 1,
  borderColor: C.hairlineStrong,
  borderRadius: 9999,
  paddingVertical: 10,
  paddingHorizontal: 20,
  alignItems: 'center',
  backgroundColor: 'transparent',
  minHeight: 44,
  justifyContent: 'center',
};

/** Card: #141414, 0px radius, hairline border */
export const CARD: ViewStyle = {
  backgroundColor: C.surfaceCard,
  borderRadius: 0,
  borderWidth: 1,
  borderColor: C.hairline,
};

/** Underline input — transparent with bottom border only */
export const INPUT_UNDERLINE: ViewStyle = {
  backgroundColor: 'transparent',
  borderBottomWidth: 1,
  borderBottomColor: C.hairlineStrong,
  paddingVertical: 10,
  paddingHorizontal: 0,
};
