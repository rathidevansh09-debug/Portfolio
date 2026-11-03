import { describe, expect, it } from 'vitest';
import { embedAddress } from '../../src/lib/videoEmbed.ts';

// Fictional ids only.
const YT = 'abcdefghijk';

describe('privacy-friendly embed addresses (ARCHITECTURE §8.2, A-5)', () => {
  it('maps every YouTube URL form to youtube-nocookie.com with autoplay after Play', () => {
    for (const url of [
      `https://www.youtube.com/watch?v=${YT}`,
      `https://youtube.com/watch?v=${YT}&t=10`,
      `https://m.youtube.com/watch?v=${YT}`,
      `https://youtu.be/${YT}`,
      `https://www.youtube.com/embed/${YT}`,
      `https://www.youtube-nocookie.com/embed/${YT}`,
      `https://www.youtube.com/shorts/${YT}`,
    ]) {
      expect(embedAddress({ type: 'youtube', url })).toEqual({
        ok: true,
        embedUrl: `https://www.youtube-nocookie.com/embed/${YT}?autoplay=1`,
        originalUrl: `https://www.youtube.com/watch?v=${YT}`,
      });
    }
  });

  it('maps Vimeo URLs to the player with do-not-track, keeping private-link hashes', () => {
    expect(embedAddress({ type: 'vimeo', url: 'https://vimeo.com/123456789' })).toEqual({
      ok: true,
      embedUrl: 'https://player.vimeo.com/video/123456789?dnt=1&autoplay=1',
      originalUrl: 'https://vimeo.com/123456789',
    });
    expect(
      embedAddress({ type: 'vimeo', url: 'https://player.vimeo.com/video/123456789' }),
    ).toMatchObject({
      ok: true,
      embedUrl: 'https://player.vimeo.com/video/123456789?dnt=1&autoplay=1',
    });
    expect(
      embedAddress({ type: 'vimeo', url: 'https://player.vimeo.com/video/123456789?h=abc123' }),
    ).toMatchObject({
      ok: true,
      embedUrl: 'https://player.vimeo.com/video/123456789?h=abc123&dnt=1&autoplay=1',
    });
    expect(embedAddress({ type: 'vimeo', url: 'https://vimeo.com/123456789/abc123' })).toEqual({
      ok: true,
      embedUrl: 'https://player.vimeo.com/video/123456789?h=abc123&dnt=1&autoplay=1',
      originalUrl: 'https://vimeo.com/123456789/abc123',
    });
  });

  const rejected = (type: 'youtube' | 'vimeo', url: string) => {
    const result = embedAddress({ type, url });
    expect(result.ok, `${type}: ${url}`).toBe(false);
    return result.ok ? '' : result.reason;
  };

  it('returns a controlled result (never throws) for malformed addresses', () => {
    for (const url of ['not a url', '', '   ', 'https://', '//youtube.com/watch?v=abcdefghijk']) {
      expect(() => embedAddress({ type: 'youtube', url })).not.toThrow();
      expect(rejected('youtube', url)).toMatch(/Invalid video URL/);
      expect(rejected('vimeo', url)).toMatch(/Invalid video URL/);
    }
    expect(rejected('youtube', `http://www.youtube.com/watch?v=${YT}`)).toMatch(/https/);
    expect(rejected('vimeo', 'http://vimeo.com/123456789')).toMatch(/https/);
    expect(rejected('youtube', `javascript:alert(1)//youtu.be/${YT}`)).toMatch(/https/);
  });

  it('rejects unsupported hosts, including look-alikes and the other platform', () => {
    for (const url of [
      `https://example.com/watch?v=${YT}`,
      `https://youtube.com.evil.example/watch?v=${YT}`,
      `https://notyoutube.com/watch?v=${YT}`,
      `https://www.youtube.com.example/embed/${YT}`,
      'https://vimeo.com/123456789',
    ]) {
      expect(rejected('youtube', url)).toMatch(/Not a YouTube video URL/);
    }
    for (const url of [
      'https://example.com/123456789',
      'https://vimeo.com.evil.example/123456789',
      'https://notvimeo.com/123456789',
      `https://www.youtube.com/watch?v=${YT}`,
    ]) {
      expect(rejected('vimeo', url)).toMatch(/Not a Vimeo video URL/);
    }
  });

  it('rejects invalid video ids', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=short',
      'https://www.youtube.com/watch?v=abcdefghijkl', // 12 characters
      'https://www.youtube.com/watch?v=abc%22def%3Cgh', // quotes / angle brackets
      'https://www.youtube.com/watch',
      'https://youtu.be/',
      `https://youtu.be/${YT}/extra`,
      'https://www.youtube.com/embed/',
      'https://www.youtube.com/channel/abcdefghijk',
    ]) {
      expect(rejected('youtube', url)).toMatch(/Not a YouTube video URL/);
    }
    for (const url of [
      'https://vimeo.com/channels/staffpicks',
      'https://vimeo.com/abc',
      'https://vimeo.com/',
      'https://player.vimeo.com/video/abc',
      'https://vimeo.com/123456789/abc-123', // hash must be alphanumeric
      'https://player.vimeo.com/video/123456789?h=%22onload%3D', // injected h= parameter
    ]) {
      expect(rejected('vimeo', url)).toMatch(/Not a Vimeo video URL/);
    }
  });
});
