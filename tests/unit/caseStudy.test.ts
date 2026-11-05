import { describe, expect, it } from 'vitest';
import type { ContentItem } from '../../src/content/schema.ts';
import { groupContent, sectionEyebrow, stepGallery } from '../../src/lib/caseStudy.ts';
import { image } from './fixtures.ts';

const p = (text: string): ContentItem => ({ kind: 'paragraph', text });
const kinds = (pieces: ReturnType<typeof groupContent>) =>
  pieces.map((piece) =>
    piece.kind === 'gallery' ? `gallery:${piece.images.length}` : piece.item.kind,
  );

describe('case-study helpers (FR-M4, FR-M5; owner decisions, Phase 11)', () => {
  it('numbers the visible sections continuously: "01 / OVERVIEW"', () => {
    expect(sectionEyebrow(1, 'TEST')).toBe('01 / TEST');
    expect(sectionEyebrow(12, 'TEST')).toBe('12 / TEST');
  });

  it('galleries: runs of two or more consecutive images; single images stay inline', () => {
    const items = [image('a'), p('x'), image('b'), image('c'), image('d'), p('y'), image('e')];
    expect(kinds(groupContent(items, true))).toEqual([
      'image',
      'paragraph',
      'gallery:3',
      'paragraph',
      'image',
    ]);
  });

  it('outside Final Designs every item stays inline, in order', () => {
    const items = [image('a'), image('b'), p('x')];
    expect(kinds(groupContent(items, false))).toEqual(['image', 'image', 'paragraph']);
  });

  it('gallery steps wrap at both ends', () => {
    expect(stepGallery(0, 3, 1)).toBe(1);
    expect(stepGallery(2, 3, 1)).toBe(0);
    expect(stepGallery(0, 3, -1)).toBe(2);
    expect(stepGallery(0, 0, 1)).toBe(0);
  });
});
