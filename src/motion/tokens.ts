// Motion tokens — the single source for every duration, delay, distance, easing, threshold and
// spring (DESIGN §9.1–§9.3; ARCHITECTURE §5; PRD NFR-M2; AGENTS §11). Components never hard-code
// motion values. Units: seconds, px, unit fractions (0–1) and degrees.
//
// Evidence labels follow DESIGN/PRD: [EXACT] read from the reference stylesheet/script;
// [APPROX] estimated; [TO VERIFY] confirmed by side-by-side comparison in Phase 16, then updated
// here AND in DESIGN.md §9.1 with the date — never changed silently (ARCHITECTURE §6.3).

/** Cubic-bezier control points. */
export type Bezier = readonly [number, number, number, number];

export interface SpringTokens {
  readonly stiffness: number;
  readonly damping: number;
}

// ── Global (DESIGN §9.1) ─────────────────────────────────────────────────────────────
export const ease = {
  /** MO-1 signature easing: starts fast, settles softly, no bounce. [EXACT] */
  signature: [0.22, 1, 0.36, 1] as Bezier,
  /** Loading spinner only. [EXACT] */
  linear: 'linear',
} as const;

export const duration = {
  hoverFast: 0.2, // icon-button background, filter colour [EXACT]
  hover: 0.25, // nav, buttons, list arrows [EXACT]
  hoverMed: 0.3, // text-link arrow, logos, play circle, hover-circle fade [EXACT]
  hoverCircleMove: 0.4, // card hover icon rising to centre [EXACT]
  imageFade: 0.5, // image load fade, card saturation [EXACT]
  showreel: 0.6, // [EXACT]
  zoom: 0.7, // card image zoom [EXACT]
  accordion: 0.35, // [EXACT]
  reveal: 0.75, // [EXACT]
  cardReveal: 0.6, // [EXACT]
  heroWord: 1.4, // [EXACT]
  /** Pop-up, mobile menu, filter underline, card re-layout. [APPROX] [TO VERIFY] */
  overlay: 0.35,
} as const;

export const distance = {
  reveal: 32, // px rise [EXACT]
} as const;

/** Fraction of an element visible before it reveals. */
export const threshold = {
  reveal: 0.12, // [EXACT]
  card: 0.08, // [EXACT]
} as const;

export const spring = {
  progress: { stiffness: 100, damping: 28 } as SpringTokens, // [EXACT]
  magnetic: { stiffness: 220, damping: 20 } as SpringTokens, // [EXACT]
} as const;

// ── M-03 reveal staggers (DESIGN §9.3) ───────────────────────────────────────────────
export const stagger = {
  contactGroup: 0.1, // closing statement + contact links [EXACT]
  showreelCard: 0.2, // [EXACT]
  processStep: 0.035, // × step index [EXACT]
  milestoneRow: 0.045, // × row index [EXACT]
  cardColumn: 0.06, // M-05: × column index [EXACT]
} as const;

// ── Hero (M-01, M-02a–c, M-04; DESIGN §9.2) ──────────────────────────────────────────
export const hero = {
  word: { duration: 1.4 }, // M-01 clip wipe, signature easing [EXACT]
  /**
   * M-02a. Timing [EXACT]. Easing [TO VERIFY]: provisional 'easeOut' (Motion's default ease-out),
   * from a reference sample on 4 Nov 2026 (≈ 32 % opacity at 20 % of the duration; the signature
   * curve would give ≈ 60 %). Owner decision, Phase 9; confirmed side by side in Phase 16.
   */
  portrait: { duration: 1.2, delay: 0.2, ease: 'easeOut' },
  intro: { x: -35, duration: 0.9, delay: 0.35 }, // M-02b [EXACT]
  side: { x: 30, duration: 1.0, delay: 0.55 }, // M-02c [EXACT]
  /** Hero start gate: maximum wait for fonts + portrait (PRD §13). [RECOMMENDED] [TO VERIFY] */
  startGateCap: 1.5,
  /** M-04 depth across the hero's scroll-out (progress 0 → 1). [EXACT] */
  depth: { wordY: 180, portraitY: 85, portraitScale: 1.08, introY: -55 },
} as const;

// ── Selected Work (M-05, M-06, M-07a, M-10) ──────────────────────────────────────────
export const card = {
  exitScale: 0.96, // M-05 filtered out [EXACT]
  glide: duration.overlay, // M-05 re-layout and exit [APPROX] [TO VERIFY]
  drift: 12, // M-06 image −12 → +12 px [EXACT]
  hoverZoom: 1.055, // M-07a over duration.zoom [EXACT]
  saturationRest: 0.55, // M-07a, mouse [EXACT]
  saturationTouch: 0.9, // touch screens [EXACT]
  arrowShift: 3, // M-07a caption arrow, up-right [EXACT]
  /** M-07a hover-icon fade: PRD [TO VERIFY] vs DESIGN 0.3 s [EXACT] — owner resolution (Q-5). */
  hoverIconFade: 0.3,
  /**
   * M-07a: the hover circle starts "slightly below centre" and rises to centre. No distance is
   * given by PRD or DESIGN; provisional 10 % of the circle's own height, from the reference
   * stylesheet (owner decision, Phase 11). [TO VERIFY] in Phase 16.
   */
  hoverCircleOffset: 0.1,
} as const;

export const filterUnderline = { duration: duration.overlay } as const; // M-10 [APPROX] [TO VERIFY]

// ── Small feedback (M-07b, M-07c) ────────────────────────────────────────────────────
export const feedback = {
  textLinkArrow: 5, // px right [EXACT]
  logoScale: 1.06, // [EXACT]
  toolkitLift: 3, // px [EXACT]
} as const;
// Pressed state (85 % brightness) is a state style: --pressed-brightness in src/styles/tokens.css.

export const showreelCard = {
  tilt: 5, // degrees at rest → 0 on hover [EXACT]
  lift: 6, // px [EXACT]
} as const;

// ── Scroll-linked (M-08, M-09, M-15) ─────────────────────────────────────────────────
export const comparison = {
  start: 90, // % cut at progress 0 [EXACT]
  end: 10, // % cut at progress 1 [EXACT]
  rest: 50, // % when motion is off [EXACT]
  drift: 30, // ±px; which element drifts is [TO VERIFY]
} as const;

/** M-09: the line fills while the section moves from its top at 75 % to its bottom at 75 %. */
export const timeline = {
  offset: ['start 0.75', 'end 0.75'] as const, // [EXACT]; grow origin top [TO VERIFY]
} as const;

// ── Strip, overlays, interaction (M-11–M-17, M-19) ───────────────────────────────────
export const logoStrip = {
  speed: 38, // px/s [APPROX] [TO VERIFY]
  arrowScroll: 0.7, // fraction of visible width [EXACT]
} as const;

/**
 * M-13 (DESIGN §9.3): open +45 px & 0.97 → normal, ≈ 0.35 s [APPROX]; close is the reverse.
 * Phase 16 [TO VERIFY] (owner decision, Phase 11): the reference's close moves the panel only
 * ≈ 20 px down with no scale, while ours reverses the opening (45 px, 0.97). Compare movement, scale
 * and duration separately, for open and close. Values unchanged until then.
 */
export const popup = { y: 45, scale: 0.97, duration: duration.overlay } as const;

export const magnetic = { x: 0.12, y: 0.2 } as const; // M-14 fraction of pointer offset [EXACT]

/** M-16: a section is active when it crosses this band from the top of the screen. [EXACT] */
export const activeSection = { bandTop: 0.15, bandBottom: 0.35 } as const;

/**
 * M-17. Duration ≈ 0.3 s [APPROX] [TO VERIFY] per PRD M-17 and DESIGN §9.3; DESIGN §9.1 groups the
 * menu under dur-overlay (≈ 0.35 s). Reported discrepancy; settled in Phase 16.
 */
export const mobileMenu = { y: -12, duration: 0.3 } as const;

export const spinner = { duration: 1 } as const; // M-19, linear [EXACT]

// ── CSS custom properties (ARCHITECTURE §5) ──────────────────────────────────────────
/** CSS-relevant tokens, published on <html> at start-up for CSS hover transitions. */
export const cssMotionVariables: Readonly<Record<string, string>> = {
  '--ease-signature': `cubic-bezier(${ease.signature.join(', ')})`,
  '--dur-hover-fast': `${duration.hoverFast}s`,
  '--dur-hover': `${duration.hover}s`,
  '--dur-hover-med': `${duration.hoverMed}s`,
  '--dur-hover-circle-move': `${duration.hoverCircleMove}s`,
  '--dur-image-fade': `${duration.imageFade}s`,
  '--dur-showreel': `${duration.showreel}s`,
  '--dur-zoom': `${duration.zoom}s`,
  '--dur-hover-icon-fade': `${card.hoverIconFade}s`,
  '--dur-spinner': `${spinner.duration}s`,
  '--card-hover-zoom': String(card.hoverZoom),
  '--card-saturation-rest': String(card.saturationRest),
  '--card-saturation-touch': String(card.saturationTouch),
  '--card-arrow-shift': `${card.arrowShift}px`,
  '--card-hover-circle-offset': `${card.hoverCircleOffset * 100}%`,
  '--text-link-arrow-shift': `${feedback.textLinkArrow}px`,
  '--logo-hover-scale': String(feedback.logoScale),
  '--toolkit-hover-lift': `${feedback.toolkitLift}px`,
  '--showreel-tilt': `${showreelCard.tilt}deg`,
  '--showreel-lift': `${showreelCard.lift}px`,
};
