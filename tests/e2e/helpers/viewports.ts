// Shared viewport definitions for browser tests and reference captures.

/** Responsive verification widths (ARCHITECTURE §7.2). */
export const VERIFICATION_WIDTHS = [
  320, 370, 390, 600, 768, 800, 1024, 1100, 1440, 1600, 1920,
] as const;

export interface Viewport {
  readonly name: string;
  readonly width: number;
  readonly height: number;
}

/** Height used with each verification width: phone-like below 600 px, laptop-like above. */
export function viewportForWidth(width: number): Viewport {
  return { name: `w${width}`, width, height: width <= 600 ? 844 : 900 };
}

/** Baseline reference-capture sizes (DESIGN.md "How the reference was examined"; PRD §8). */
export const BASELINE_VIEWPORTS: readonly Viewport[] = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-landscape-1024', width: 1024, height: 768 },
  { name: 'tablet-portrait-768', width: 768, height: 1024 },
  { name: 'phone-390', width: 390, height: 844 },
];

/** Sticky-header anchor offset (DESIGN §6.1): 85 px, or 72 px at the phone breakpoint (≤ 600 px). */
export function anchorOffset(width: number): number {
  return width <= 600 ? 72 : 85;
}
