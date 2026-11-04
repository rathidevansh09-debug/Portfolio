import { describe, expect, it } from 'vitest';
import { content } from '../../src/content/index.ts';
import { pending } from '../../src/content/pending.ts';
import type { Video } from '../../src/content/schema.ts';
import { showreelTarget } from '../../src/lib/showreel.ts';

const { projects, projectIndex } = content;
const video: Video = {
  kind: 'video',
  title: 'Test reel',
  poster: { src: '/test.jpg', width: 1600, height: 900 },
  source: { type: 'youtube', url: 'https://www.youtube.com/watch?v=abcdefghijk' },
  hasSpeech: false,
};

describe('showreelTarget (FR-HE7, FR-HE8, A-7)', () => {
  it('opens the showreel when one is supplied', () => {
    expect(showreelTarget(video, projects, projectIndex)).toEqual({ kind: 'showreel', video });
  });

  it('with no showreel, opens PNG Jewellers — the first featured project in DS-4 order', () => {
    const target = showreelTarget(null, projects, projectIndex);
    expect(target?.kind).toBe('project');
    expect(target?.kind === 'project' && target.project.title).toBe('PNG Jewellers');
    expect(projectIndex.featured[0]).toBe('png-jewellers');
  });

  it('while the showreel is still PENDING, the same A-7 fallback applies', () => {
    const target = showreelTarget(pending('Showreel'), projects, projectIndex);
    expect(target?.kind === 'project' && target.project.slug).toBe('png-jewellers');
  });

  it('returns nothing if no featured project exists (never invents a target)', () => {
    expect(showreelTarget(null, projects, { ...projectIndex, featured: [] })).toBeNull();
  });
});
