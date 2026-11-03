import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import { content } from '../../src/content/index.ts';
import { isPending, PENDING_LABEL } from '../../src/content/pending.ts';

// index.html keeps its metadata as written values (owner decision 1A, Phase 8). This test keeps
// them identical to the content files, so the content files stay the single source of truth.

// Font files that exist in public/fonts (Vite glob; CSS imports are empty under Vitest).
const FONT_FILES = Object.keys(import.meta.glob('../../public/fonts/*.woff2')).map((path) =>
  path.replace('../../public', ''),
);

const doc = new DOMParser().parseFromString(indexHtml, 'text/html');
const meta = (selector: string) => doc.querySelector(selector)?.getAttribute('content');
const { site, profile, contact } = content;
const role = profile.roleLines.join(' ').toLowerCase(); // "ux designer & product designer"

describe('index.html matches the content files (FR-G5, NFR-S1, NFR-C2, D-11)', () => {
  it('language, title and description', () => {
    expect(doc.documentElement.lang).toBe('en');
    expect(doc.title).toBe(site.title.text);
    expect(meta('meta[name="description"]')).toBe(site.description.text);
    expect(meta('meta[property="og:title"]')).toBe(site.title.text);
    expect(meta('meta[property="og:description"]')).toBe(site.description.text);
  });

  it('full name only in the author meta and the JSON-LD Person (D-11)', () => {
    expect(meta('meta[name="author"]')).toBe(site.fullNameForMetadata);
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    const person = JSON.parse(scripts[0]?.textContent ?? '{}') as Record<string, string>;
    expect(person).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: site.fullNameForMetadata,
      jobTitle: person.jobTitle,
    });
    expect(person.jobTitle?.toLowerCase()).toBe(role);
    expect(doc.title).not.toContain('Rathi');
  });

  it('share image tag only once the image is supplied', () => {
    expect(isPending(site.shareImage)).toBe(true);
    expect(doc.querySelector('meta[property="og:image"]')).toBeNull();
  });

  it('favicons (D-24) and first-screen font preloads of existing font files', () => {
    const icons = [...doc.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')];
    expect(icons.map((l) => l.getAttribute('href'))).toEqual([
      '/favicon.svg',
      '/favicon-32.png',
      '/apple-touch-icon.png',
    ]);
    const preloads = [...doc.querySelectorAll('link[rel="preload"][as="font"]')];
    expect(preloads.length).toBeLessThanOrEqual(4); // ARCHITECTURE §9.2 budget
    for (const link of preloads) {
      expect(FONT_FILES).toContain(link.getAttribute('href'));
      expect(link.hasAttribute('crossorigin')).toBe(true);
    }
  });

  it('no-JavaScript fallback: name and role, then the email link (PENDING until approved)', () => {
    // DOMParser runs without scripting, so <noscript> content is parsed as elements.
    const noscript = doc.querySelector('noscript');
    expect(noscript).not.toBeNull();
    expect(noscript?.textContent).toContain(site.noscriptText);
    if (isPending(contact.email)) {
      expect(noscript?.textContent).toContain(PENDING_LABEL);
      expect(noscript?.querySelector('a[href^="mailto:"]')).toBeNull();
    } else {
      const link = noscript?.querySelector('a[href^="mailto:"]');
      expect(link?.getAttribute('href')).toBe(`mailto:${contact.email}`);
    }
  });
});
