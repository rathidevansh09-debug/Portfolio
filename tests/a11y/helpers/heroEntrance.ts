import { expect, type Page } from '@playwright/test';

/**
 * Waits until the hero entrance (M-01, M-02a–c) has finished, so axe measures the hero's final
 * state rather than half-transparent, mid-fade text. Completion is read from the page itself:
 * the start gate has opened, the portrait, intro and side column are fully opaque and in place,
 * and the giant word's clip is fully open. With motion off this is true immediately.
 */
export async function waitForHeroEntrance(page: Page): Promise<void> {
  await expect(page.locator('#home')).toHaveAttribute('data-started', '');
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const part = (name: string) =>
            document.querySelector(`[data-hero-part="${name}"]`) as HTMLElement | null;
          const settled = (el: HTMLElement | null) => {
            if (!el) return false;
            const style = getComputedStyle(el);
            return style.opacity === '1' && new DOMMatrixReadOnly(style.transform).m41 === 0;
          };
          const word = part('word');
          const clip = word ? getComputedStyle(word).clipPath : 'none';
          const clipOpen =
            clip === 'none' ||
            (clip.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).every((v) => Number(v) === 0);
          return clipOpen && ['portrait', 'intro', 'side'].every((name) => settled(part(name)));
        }),
      { message: 'hero entrance finished', timeout: 5000 },
    )
    .toBe(true);
}
