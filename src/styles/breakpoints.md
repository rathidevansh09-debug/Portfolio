# Breakpoints

Source: DESIGN.md §10 and ARCHITECTURE.md §7.1. CSS media queries cannot read custom properties, so
these values are written directly in each `@media` rule. Use only these six.

**Desktop-first:** base styles are the LG layout; smaller screens override with `max-width`, the
large-desktop refinements use `min-width`.

| Name | Media query                  | Range        | Meaning                      |
| ---- | ---------------------------- | ------------ | ---------------------------- |
| XL   | `@media (min-width: 1600px)` | ≥ 1600 px    | Large-desktop refinements    |
| LG   | _(default, no query)_        | 1101–1599 px | Desktop / laptop base styles |
| MD   | `@media (max-width: 1100px)` | ≤ 1100 px    | Tablet landscape             |
| SM   | `@media (max-width: 800px)`  | ≤ 800 px     | Tablet portrait              |
| XS   | `@media (max-width: 600px)`  | ≤ 600 px     | Phone                        |
| XXS  | `@media (max-width: 370px)`  | ≤ 370 px     | Small phone                  |

## Rules

- **Re-compose, don't shrink.** Each breakpoint re-arranges the layout as DESIGN §8 and §10 describe
  (for example, the phone hero keeps its overlapping composition and the first project card spans
  the full width). Never just scale a layout down.
- **Token overrides** for these breakpoints live in `src/styles/tokens.css`. The column "–" in
  DESIGN's token tables means "same as the column to the left", so each override block only lists
  values that change.
- **Phone base text:** `--body-size` is 1 rem by default and 0.875 rem at XS. The root font size is
  never changed (DESIGN §5.3). Form inputs stay 16 px at every width.
- **Header and anchors:** header height 66 / 60 (SM) / 56 (XS) px; anchor offset 85 px, 72 px at XS
  (DESIGN §6.1).
- **Touch vs mouse is not a breakpoint.** Use `@media (hover: hover) and (pointer: fine)` for
  mouse-only effects, never screen width (PRD MO-6; ARCHITECTURE §7.1).
- **Minimum page width:** 320 px. No horizontal page scroll from 320 to 1920 px.
- **Verification widths** (ARCHITECTURE §7.2): 320, 370, 390, 600, 768, 800, 1024, 1100, 1440, 1600,
  1920 — defined in `tests/e2e/helpers/viewports.ts`.
