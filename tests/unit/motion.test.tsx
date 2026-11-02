import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MotionPreferenceProvider,
  useMotionPreference,
} from '../../src/motion/MotionPreference.tsx';
import { Reveal } from '../../src/motion/Reveal.tsx';
import {
  MOTION_STORAGE_KEY,
  REDUCED_MOTION_QUERY,
  applyMotionAttribute,
  initMotion,
  isMotionOn,
  publishMotionCssVariables,
  readOwnerPreference,
  writeOwnerPreference,
} from '../../src/motion/preference.ts';
import { cssMotionVariables, duration, ease } from '../../src/motion/tokens.ts';

// jsdom has no matchMedia: a controllable stand-in for the system "Reduce motion" setting.
let systemReduced = false;
const mediaListeners = new Set<() => void>();
function setSystemReduced(value: boolean) {
  systemReduced = value;
  mediaListeners.forEach((l) => l());
}

beforeEach(() => {
  systemReduced = false;
  mediaListeners.clear();
  localStorage.clear();
  document.documentElement.removeAttribute('data-motion');
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query === REDUCED_MOTION_QUERY ? systemReduced : false;
    },
    media: query,
    addEventListener: (_: string, l: () => void) => mediaListeners.add(l),
    removeEventListener: (_: string, l: () => void) => mediaListeners.delete(l),
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  document.documentElement.removeAttribute('data-motion');
});

function Probe() {
  const p = useMotionPreference();
  return (
    <div>
      <span data-testid="motion">{p.motionOn ? 'on' : 'off'}</span>
      <span data-testid="owner">{p.ownerPreference}</span>
      <button type="button" onClick={p.toggleOwnerPreference}>
        toggle
      </button>
    </div>
  );
}

describe('motion preference logic (MO-5, FR-G3)', () => {
  it('motion runs only when the owner toggle is on AND the system does not reduce motion', () => {
    expect(isMotionOn('on', false)).toBe(true);
    expect(isMotionOn('on', true)).toBe(false);
    expect(isMotionOn('off', false)).toBe(false);
    expect(isMotionOn('off', true)).toBe(false);
  });

  it('reads and writes the saved choice, defaulting to on', () => {
    expect(readOwnerPreference(localStorage)).toBe('on');
    writeOwnerPreference(localStorage, 'off');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('off');
    expect(readOwnerPreference(localStorage)).toBe('off');
    localStorage.setItem(MOTION_STORAGE_KEY, 'garbage');
    expect(readOwnerPreference(localStorage)).toBe('on');
  });

  it('survives unavailable storage (private mode / blocked)', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readOwnerPreference(broken)).toBe('on');
    expect(() => writeOwnerPreference(broken, 'off')).not.toThrow();
    expect(readOwnerPreference(undefined)).toBe('on');
  });

  it('sets and clears data-motion="off" on the root', () => {
    const root = document.documentElement;
    applyMotionAttribute(root, false);
    expect(root.getAttribute('data-motion')).toBe('off');
    applyMotionAttribute(root, true);
    expect(root.hasAttribute('data-motion')).toBe(false);
  });

  it('publishes CSS motion variables equal to the tokens (ARCHITECTURE §5)', () => {
    const root = document.documentElement;
    publishMotionCssVariables(root);
    for (const [name, value] of Object.entries(cssMotionVariables)) {
      expect(root.style.getPropertyValue(name)).toBe(value);
    }
    expect(cssMotionVariables['--ease-signature']).toBe(
      `cubic-bezier(${ease.signature.join(', ')})`,
    );
    expect(cssMotionVariables['--dur-hover']).toBe(`${duration.hover}s`);
  });

  it('initMotion applies the saved choice and system setting before first render', () => {
    localStorage.setItem(MOTION_STORAGE_KEY, 'off');
    initMotion();
    expect(document.documentElement.getAttribute('data-motion')).toBe('off');
    localStorage.clear();
    systemReduced = true;
    initMotion();
    expect(document.documentElement.getAttribute('data-motion')).toBe('off');
    systemReduced = false;
    initMotion();
    expect(document.documentElement.hasAttribute('data-motion')).toBe(false);
  });
});

describe('MotionPreferenceProvider', () => {
  it('toggles both ways, persists, and keeps the root attribute in sync', () => {
    render(
      <MotionPreferenceProvider>
        <Probe />
      </MotionPreferenceProvider>,
    );
    expect(screen.getByTestId('motion').textContent).toBe('on');
    act(() => screen.getByText('toggle').click());
    expect(screen.getByTestId('motion').textContent).toBe('off');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('off');
    expect(document.documentElement.getAttribute('data-motion')).toBe('off');
    act(() => screen.getByText('toggle').click());
    expect(screen.getByTestId('motion').textContent).toBe('on');
    expect(document.documentElement.hasAttribute('data-motion')).toBe(false);
  });

  it('follows the system setting live: reduce turns motion off whatever the toggle says', () => {
    render(
      <MotionPreferenceProvider>
        <Probe />
      </MotionPreferenceProvider>,
    );
    act(() => setSystemReduced(true));
    expect(screen.getByTestId('motion').textContent).toBe('off');
    expect(screen.getByTestId('owner').textContent).toBe('on');
    expect(document.documentElement.getAttribute('data-motion')).toBe('off');
    act(() => setSystemReduced(false));
    expect(screen.getByTestId('motion').textContent).toBe('on');
  });

  it('Reveal renders its final state (no hidden start) when motion is off', () => {
    localStorage.setItem(MOTION_STORAGE_KEY, 'off');
    render(
      <MotionPreferenceProvider>
        <Reveal as="section" data-testid="r">
          Content
        </Reveal>
      </MotionPreferenceProvider>,
    );
    const el = screen.getByTestId('r');
    expect(el.tagName).toBe('SECTION');
    expect(el.getAttribute('style')).toBeNull();
  });

  it('modal Reveal requires the pop-up scroll root', () => {
    expect(() =>
      render(
        <MotionPreferenceProvider>
          <Reveal mode="modal">x</Reveal>
        </MotionPreferenceProvider>,
      ),
    ).toThrow(/RevealScrollRoot/);
  });
});
