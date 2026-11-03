// Privacy-friendly embed addresses for YouTube and Vimeo (ARCHITECTURE §8.2, A-5).
// YouTube uses its privacy-enhanced domain (youtube-nocookie.com); Vimeo uses do-not-track
// (dnt=1). These reduce, but do not eliminate, third-party data collection once a video loads.
// `autoplay=1` is added only because the iframe is created after the visitor presses our Play
// button (A-4; owner decision Phase 7: playback starts on that press).

export interface EmbedAddress {
  /** Address loaded in the iframe after the visitor presses Play. */
  readonly embedUrl: string;
  /** The video's own page, for "Open original". */
  readonly originalUrl: string;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_HASH = /^[A-Za-z0-9]+$/; // private-link hash

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1);
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const match = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
      id = match?.[1] ?? null;
    }
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

function vimeoIds(url: URL): { id: string; hash?: string } | null {
  const host = url.hostname.replace(/^www\./, '');
  const path =
    host === 'vimeo.com'
      ? url.pathname.match(/^\/(\d+)(?:\/([A-Za-z0-9]+))?\/?$/)
      : host === 'player.vimeo.com'
        ? url.pathname.match(/^\/video\/(\d+)\/?$/)
        : null;
  if (!path?.[1]) return null;
  const hash = path[2] ?? url.searchParams.get('h') ?? undefined;
  if (hash === undefined) return { id: path[1] };
  return VIMEO_HASH.test(hash) ? { id: path[1], hash } : null;
}

/** A valid embed, or the reason the address cannot be embedded (for developers, not visitors). */
export type EmbedResult =
  ({ readonly ok: true } & EmbedAddress) | { readonly ok: false; readonly reason: string };

const invalid = (reason: string): EmbedResult => ({ ok: false, reason });

/**
 * Builds the privacy embed and original addresses. Never throws: a malformed address, another
 * host or an invalid video id returns `{ ok: false }`, so one bad content entry cannot crash a page.
 */
export function embedAddress(source: {
  readonly type: 'youtube' | 'vimeo';
  readonly url: string;
}): EmbedResult {
  let url: URL;
  try {
    url = new URL(source.url);
  } catch {
    return invalid(`Invalid video URL "${String(source.url)}"`);
  }
  if (url.protocol !== 'https:') return invalid(`Video URL must use https: "${source.url}"`);

  if (source.type === 'youtube') {
    const id = youtubeId(url);
    if (!id) return invalid(`Not a YouTube video URL: "${source.url}"`);
    return {
      ok: true,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`,
      originalUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  const vimeo = vimeoIds(url);
  if (!vimeo) return invalid(`Not a Vimeo video URL: "${source.url}"`);
  const hash = vimeo.hash ? `h=${vimeo.hash}&` : '';
  return {
    ok: true,
    embedUrl: `https://player.vimeo.com/video/${vimeo.id}?${hash}dnt=1&autoplay=1`,
    originalUrl: `https://vimeo.com/${vimeo.id}${vimeo.hash ? `/${vimeo.hash}` : ''}`,
  };
}
