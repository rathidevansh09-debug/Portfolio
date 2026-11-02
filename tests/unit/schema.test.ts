import { describe, expect, it } from 'vitest';
import type { Facts, ImageRef, Project, Video } from '../../src/content/schema.ts';
import { validateContent } from '../../src/content/validate.ts';
import { image, makeProject, picture, poster, withContent } from './fixtures.ts';

// Type-level rules: each @ts-expect-error below MUST be an error. If a schema rule were removed,
// `npm run typecheck` (which includes tests/unit) would fail on the unused directive.
describe('schema types reject invalid content (checked by npm run typecheck)', () => {
  it('requires alt text on images', () => {
    // @ts-expect-error — missing alt text (ARCHITECTURE §4.3)
    const noAlt: ImageRef = { kind: 'image', asset: picture() };
    expect(noAlt).toBeDefined();
  });

  it('requires captions for a local video with speech (A-10)', () => {
    // @ts-expect-error — speech without captionsFile
    const v: Video = {
      kind: 'video',
      title: 'Clip',
      poster: poster(),
      source: { type: 'local', src: '/media/video/clip.mp4' },
      hasSpeech: true,
    };
    expect(v).toBeDefined();
  });

  it('requires confirmed platform captions for an embedded video with speech (A-10)', () => {
    // @ts-expect-error — speech without platformCaptionsConfirmed: true
    const v: Video = {
      kind: 'video',
      title: 'Reel',
      poster: poster(),
      source: { type: 'youtube', url: 'https://www.youtube-nocookie.com/embed/x' },
      hasSpeech: true,
    };
    expect(v).toBeDefined();
  });

  it('accepts videos with captions, and silent videos without', () => {
    const ok: Video[] = [
      {
        kind: 'video',
        title: 'Clip',
        poster: poster(),
        source: { type: 'local', src: '/media/video/clip.mp4' },
        hasSpeech: true,
        captionsFile: { src: '/media/video/clip.en.vtt', lang: 'en' },
      },
      {
        kind: 'video',
        title: 'Silent',
        poster: poster(),
        source: { type: 'vimeo', url: 'https://player.vimeo.com/video/1' },
        hasSpeech: false,
      },
    ];
    expect(ok).toHaveLength(2);
  });

  it('allows only approved filter tags', () => {
    // @ts-expect-error — "shopify" is not a filter (D-03)
    const p: Project = makeProject({ slug: 'x', tags: ['shopify'] });
    expect(p).toBeDefined();
  });

  it('allows only the six facts fields (D-22)', () => {
    const f: Facts = {
      client: { value: 'A', verified: true },
      // @ts-expect-error — tags are not a facts field
      tags: { value: 'B', verified: true },
    };
    expect(f).toBeDefined();
  });
});

describe('validateContent (runtime rules)', () => {
  it('accepts the real site content', () => {
    expect(validateContent(withContent({}))).toEqual([]);
  });

  it('rejects an image with empty alt text that is not decorative', () => {
    const p = makeProject({ slug: 'p', cover: { ...image(''), alt: '' } });
    expect(validateContent(withContent({ projects: [p] })).join('\n')).toMatch(
      /cover: image has no alt text/,
    );
  });

  it('rejects a video with speech and no captions (data built outside the types)', () => {
    const video = {
      kind: 'video',
      title: 'Clip',
      poster: poster(),
      source: { type: 'local', src: '/v.mp4' },
      hasSpeech: true,
    } as unknown as Video;
    const p = makeProject({ slug: 'p', heroMedia: video });
    expect(validateContent(withContent({ projects: [p] })).join('\n')).toMatch(
      /local video with speech has no captions file/,
    );
  });

  it('rejects an unknown tag and an extra facts field', () => {
    const p = makeProject({
      slug: 'p',
      tags: ['branding'] as unknown as Project['tags'],
      facts: { tags: { value: 'x', verified: true } } as unknown as Facts,
    });
    const errors = validateContent(withContent({ projects: [p] })).join('\n');
    expect(errors).toMatch(/unknown tag\(s\) branding/);
    expect(errors).toMatch(/unknown fact field\(s\) tags/);
  });

  it('rejects duplicate slugs, unknown featured projects and a broken display order', () => {
    const a = makeProject({ slug: 'a' });
    const errors = validateContent(
      withContent({
        projects: [a, a],
        projectIndex: { featured: ['missing'], displayOrder: ['a', 'ghost'] },
      }),
    ).join('\n');
    expect(errors).toMatch(/duplicate slug\(s\) a/);
    expect(errors).toMatch(/featured: unknown project "missing"/);
    expect(errors).toMatch(/displayOrder: unknown ghost/);
  });

  it('rejects a promotion link to a missing role', () => {
    const roles = [
      {
        id: 'lead',
        role: 'Lead',
        company: 'Co',
        start: { year: 2024 },
        end: 'present' as const,
        description: 'd',
        promotedFrom: 'nobody',
      },
    ];
    const errors = validateContent(
      withContent({ experience: { ...withContent({}).experience, roles } }),
    );
    expect(errors.join('\n')).toMatch(/promotedFrom: no role "nobody"/);
  });
});
