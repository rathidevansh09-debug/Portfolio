// VideoPlayer (ARCHITECTURE §8.2; PRD §13, D-07, A-4, A-5, A-10): one player for local clips and
// YouTube/Vimeo embeds.
//
// States:
//   poster      local poster + Play button. Nothing is loaded: no <video>, no iframe, and no
//               request to YouTube or Vimeo (A-5).
//   loading     after the visitor presses Play: the <video> or iframe is created; ring + "Loading…".
//   playing     LOCAL only — set solely by the media element's real `playing` event.
//   embed-ready EMBED only — set by the iframe `load` event. A loaded iframe is NOT confirmed
//               playback: the browser cannot tell whether the video itself plays or is
//               restricted (R-8), so the restricted-video note always stays visible for embeds.
//   error       a media error, or no `playing` (local) / no iframe `load` (embed) within
//               VIDEO_LOAD_TIMEOUT_MS → message + "Try again" + "Open original" (when available).
//               An embed address that is malformed, on another host or has an invalid id starts
//               here with the message only (no Play, retry or link; no third-party request).
// Videos never autoplay: playback begins only from the visitor's Play press (A-4; owner decision
// Phase 7: an embed starts playing on that press).

import { useEffect, useState } from 'react';
import type { LocalVideo, Video } from '../../../content/schema.ts';
import { embedAddress } from '../../../lib/videoEmbed.ts';
import { ActionBase } from '../../actions/ActionBase.tsx';
import { OutlineButton } from '../../actions/OutlineButton/OutlineButton.tsx';
import { PlayCircleGlyph } from '../../actions/PlayCircle/PlayCircle.tsx';
import { Icon } from '../../icons/Icon.tsx';
import { LoadingRing } from '../LoadingRing/LoadingRing.tsx';
import styles from './VideoPlayer.module.css';

/**
 * PRD §13: "Video fails or takes longer than 14 s". For embeds this detects only the iframe
 * failing to load. A state timeout, not a motion value, so it is not in motion/tokens.ts.
 */
export const VIDEO_LOAD_TIMEOUT_MS = 14_000;

const isLocal = (v: Video): v is LocalVideo => v.source.type === 'local';

export type VideoState = 'poster' | 'loading' | 'playing' | 'embed-ready' | 'error';

export interface VideoPlayerLabels {
  /** Accessible name of the Play button (ui.states.playVideo — PENDING wording). */
  readonly play: string;
  readonly loading: string;
  readonly error: string;
  readonly tryAgain: string;
  readonly openOriginal: string;
  readonly restrictedNote: string;
}

export interface VideoPlayerProps {
  readonly video: Video;
  readonly labels: VideoPlayerLabels;
  /** Stage proportion: 16 : 9 everywhere, or the pop-up box (16 : 9, phones 4 : 3 — DESIGN §8.10). */
  readonly ratio?: 'wide' | 'popup';
  readonly className?: string;
}

export function VideoPlayer({ video, labels, ratio = 'wide', className }: VideoPlayerProps) {
  const [playerState, setState] = useState<VideoState>('poster');
  const [attempt, setAttempt] = useState(0);
  const local = isLocal(video) ? video : null;
  const address = isLocal(video) ? null : embedAddress(video.source);
  const embed = address?.ok ? address : null;
  const invalidReason = address && !address.ok ? address.reason : null;
  // An address that cannot be embedded shows the error state at once: nothing to play or retry.
  const state: VideoState = invalidReason ? 'error' : playerState;

  useEffect(() => {
    // Content mistake: tell the developer; visitors see only the approved error message.
    if (invalidReason && import.meta.env.DEV) console.error(`VideoPlayer: ${invalidReason}`);
  }, [invalidReason]);

  useEffect(() => {
    if (state !== 'loading') return;
    const timer = window.setTimeout(() => setState('error'), VIDEO_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [state, attempt]);

  const start = () => {
    setAttempt((n) => n + 1);
    setState('loading');
  };

  return (
    <div className={[styles.player, className].filter(Boolean).join(' ')} data-state={state}>
      <div className={styles.stage} data-ratio={ratio}>
        {state === 'poster' ? (
          <>
            <img
              className={styles.poster}
              src={video.poster.src}
              width={video.poster.width}
              height={video.poster.height}
              alt=""
            />
            <button type="button" className={styles.play} aria-label={labels.play} onClick={start}>
              <PlayCircleGlyph />
            </button>
          </>
        ) : null}

        {state === 'loading' || state === 'playing' || state === 'embed-ready' ? (
          local ? (
            <video
              key={attempt}
              className={styles.media}
              src={local.source.src}
              poster={video.poster.src}
              preload="none"
              playsInline
              controls
              autoPlay
              title={video.title}
              onPlaying={() => setState('playing')}
              onError={() => setState('error')}
            >
              {/* Required by the schema for any local video with speech (A-10). */}
              {local.captionsFile ? (
                <track
                  kind="captions"
                  src={local.captionsFile.src}
                  srcLang={local.captionsFile.lang}
                  default
                />
              ) : null}
            </video>
          ) : embed ? (
            <iframe
              key={attempt}
              className={styles.media}
              src={embed.embedUrl}
              title={video.title}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setState((s) => (s === 'loading' ? 'embed-ready' : s))}
            />
          ) : null
        ) : null}

        {state === 'loading' ? (
          <div className={styles.overlay}>
            <LoadingRing label={labels.loading} />
          </div>
        ) : null}

        {state === 'error' ? (
          <div className={styles.overlay} role="alert">
            <p className={styles.message}>{labels.error}</p>
            <div className={styles.actions}>
              {invalidReason ? null : (
                <OutlineButton onClick={start}>{labels.tryAgain}</OutlineButton>
              )}
              {embed ? (
                <ActionBase href={embed.originalUrl} external className={styles.original}>
                  {labels.openOriginal}
                  <Icon name="arrow-up-right" />
                </ActionBase>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {embed ? (
        <p className={styles.note}>
          {labels.restrictedNote}{' '}
          <ActionBase href={embed.originalUrl} external className={styles.original}>
            {labels.openOriginal}
            <Icon name="arrow-up-right" />
          </ActionBase>
        </p>
      ) : null}
    </div>
  );
}
