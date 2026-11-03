import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VIDEO_LOAD_TIMEOUT_MS,
  VideoPlayer,
} from '../../../src/components/media/VideoPlayer/VideoPlayer.tsx';
import type { Video } from '../../../src/content/schema.ts';

// Mocked media events only (owner decision: real playback is verified in Phase 11).
const labels = {
  play: 'Play test video',
  loading: 'Loading…',
  error: "Preview couldn't load. Open the original source to watch.",
  tryAgain: 'Try again',
  openOriginal: 'Open original',
  restrictedNote: "If the video is restricted, use 'Open original'.",
};
const poster = { src: '/media/video/test-poster.jpg', width: 1600, height: 900 };
const local: Video = {
  kind: 'video',
  title: 'Test clip',
  poster,
  source: { type: 'local', src: '/media/video/test.mp4' },
  hasSpeech: true,
  captionsFile: { src: '/media/video/test.en.vtt', lang: 'en' },
};
const youtube: Video = {
  kind: 'video',
  title: 'Test reel',
  poster,
  source: { type: 'youtube', url: 'https://www.youtube.com/watch?v=abcdefghijk' },
  hasSpeech: false,
};

const state = (c: HTMLElement) => (c.firstElementChild as HTMLElement).dataset.state;

beforeEach(() => {
  vi.useFakeTimers();
  // jsdom does not implement media playback.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('VideoPlayer — local clip', () => {
  it('shows only the poster and Play button until the visitor presses Play (A-4)', () => {
    const { container } = render(<VideoPlayer video={local} labels={labels} />);
    expect(state(container)).toBe('poster');
    expect(container.querySelector('video')).toBeNull();
    expect(screen.getByRole('button', { name: 'Play test video' })).toBeTruthy();
  });

  it('becomes "playing" only on the real media playing event', () => {
    const { container } = render(<VideoPlayer video={local} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play test video' }));
    expect(state(container)).toBe('loading');
    expect(screen.getByRole('status').textContent).toBe('Loading…');
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.hasAttribute('playsinline')).toBe(true);
    const track = video.querySelector('track');
    expect(track?.getAttribute('kind')).toBe('captions');
    expect(track?.getAttribute('src')).toBe('/media/video/test.en.vtt');
    expect(track?.getAttribute('srclang')).toBe('en');
    fireEvent.loadedData(video);
    expect(state(container)).toBe('loading');
    fireEvent.playing(video);
    expect(state(container)).toBe('playing');
  });

  it('shows the error state on a media error; "Try again" restarts loading', () => {
    const { container } = render(<VideoPlayer video={local} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play test video' }));
    fireEvent.error(container.querySelector('video') as HTMLVideoElement);
    expect(state(container)).toBe('error');
    expect(screen.getByRole('alert').textContent).toContain(labels.error);
    expect(screen.queryByRole('link', { name: /Open original/ })).toBeNull(); // no external source
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(state(container)).toBe('loading');
  });

  it(`times out to the error state after ${VIDEO_LOAD_TIMEOUT_MS / 1000} s without playback`, () => {
    const { container } = render(<VideoPlayer video={local} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play test video' }));
    act(() => vi.advanceTimersByTime(VIDEO_LOAD_TIMEOUT_MS - 1));
    expect(state(container)).toBe('loading');
    act(() => vi.advanceTimersByTime(1));
    expect(state(container)).toBe('error');
  });

  it('a silent clip without a captions file has no track', () => {
    const silent: Video = { ...local, hasSpeech: false, captionsFile: undefined } as Video;
    const { container } = render(<VideoPlayer video={silent} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play test video' }));
    expect(container.querySelector('track')).toBeNull();
  });
});

describe('VideoPlayer — YouTube/Vimeo embed', () => {
  it('creates no iframe before Play; after Play loads the privacy URL', () => {
    const { container } = render(<VideoPlayer video={youtube} labels={labels} />);
    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Play test video' }));
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1',
    );
    expect(iframe.getAttribute('title')).toBe('Test reel');
  });

  it('iframe load means "embed-ready", never confirmed playback', () => {
    const { container } = render(<VideoPlayer video={youtube} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play test video' }));
    fireEvent.load(container.querySelector('iframe') as HTMLIFrameElement);
    expect(state(container)).toBe('embed-ready');
    expect(state(container)).not.toBe('playing');
  });

  it('times out only when the iframe fails to load, offering Open original', () => {
    const { container } = render(<VideoPlayer video={youtube} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play test video' }));
    act(() => vi.advanceTimersByTime(VIDEO_LOAD_TIMEOUT_MS));
    expect(state(container)).toBe('error');
    const original = screen.getAllByRole('link', { name: /Open original/ })[0] as HTMLAnchorElement;
    expect(original.getAttribute('href')).toBe('https://www.youtube.com/watch?v=abcdefghijk');
    expect(original.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('a loaded iframe does not time out', () => {
    const { container } = render(<VideoPlayer video={youtube} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play test video' }));
    fireEvent.load(container.querySelector('iframe') as HTMLIFrameElement);
    act(() => vi.advanceTimersByTime(VIDEO_LOAD_TIMEOUT_MS * 2));
    expect(state(container)).toBe('embed-ready');
  });

  it('always shows the restricted-video note for embeds, never for local clips', () => {
    const { rerender } = render(<VideoPlayer video={youtube} labels={labels} />);
    expect(screen.getByText(labels.restrictedNote, { exact: false })).toBeTruthy();
    rerender(<VideoPlayer key="local" video={local} labels={labels} />);
    expect(screen.queryByText(labels.restrictedNote, { exact: false })).toBeNull();
  });
});

describe('VideoPlayer — invalid embed address', () => {
  const invalidVideos: Video[] = [
    { ...youtube, source: { type: 'youtube', url: 'not a url' } },
    { ...youtube, source: { type: 'youtube', url: 'https://example.com/watch?v=abcdefghijk' } },
    { ...youtube, source: { type: 'youtube', url: 'https://www.youtube.com/watch?v=short' } },
    { ...youtube, source: { type: 'vimeo', url: 'https://vimeo.com/channels/staffpicks' } },
  ];

  it('does not crash: shows the approved error message only, with nothing to play or open', () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const video of invalidVideos) {
      const { container, unmount } = render(<VideoPlayer video={video} labels={labels} />);
      expect(state(container)).toBe('error');
      expect(screen.getByRole('alert').textContent).toBe(labels.error);
      expect(screen.queryByRole('button')).toBeNull(); // no Play, no Try again
      expect(screen.queryByRole('link')).toBeNull(); // no unvalidated "Open original"
      expect(screen.queryByText(labels.restrictedNote, { exact: false })).toBeNull();
      expect(container.querySelector('iframe')).toBeNull();
      act(() => vi.advanceTimersByTime(VIDEO_LOAD_TIMEOUT_MS));
      expect(state(container)).toBe('error');
      unmount();
    }
    // Development only: the content mistake is reported to the developer, never to visitors.
    expect(report).toHaveBeenCalledTimes(invalidVideos.length);
    expect(String(report.mock.calls[1]?.[0])).toMatch(/^VideoPlayer: Not a YouTube video URL/);
  });
});
