import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ContentItem,
  JourneyMilestone,
  LocalVideo,
  Project,
} from '../../../src/content/schema.ts';
import { approved } from '../../../src/content/schema.ts';
import { pending } from '../../../src/content/pending.ts';
import { isScrollLocked, unlockScroll } from '../../../src/lib/scrollLock.ts';
import type { ModalItem } from '../../../src/modal/ModalProvider.tsx';
import { ProjectModal, type ProjectModalLabels } from '../../../src/modal/ProjectModal.tsx';
import { MOTION_STORAGE_KEY } from '../../../src/motion/preference.ts';
import { MotionPreferenceProvider } from '../../../src/motion/MotionPreference.tsx';
import { image, makeProject, poster } from '../fixtures.ts';

// Fictional content only. jsdom has no showModal/close, so minimal stand-ins record the calls;
// the real dialog (top layer, inert page, Escape, focus) is covered end-to-end in Playwright.
let closeCalls = 0;
beforeEach(() => {
  closeCalls = 0;
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    closeCalls += 1;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  localStorage.setItem(MOTION_STORAGE_KEY, 'off');
});
afterEach(() => {
  localStorage.clear();
  vi.unstubAllEnvs();
  unlockScroll();
});

const fallback = { mark: 'T.', label: 'Test unavailable' };
const labels: ProjectModalLabels = {
  close: 'Test close',
  sections: {
    overview: 'TEST OVERVIEW',
    problem: 'TEST PROBLEM',
    research: 'TEST RESEARCH',
    processAndDecisions: 'TEST PROCESS',
    finalDesigns: 'TEST FINAL DESIGNS',
    outcomes: 'TEST OUTCOMES',
  },
  facts: {
    client: 'T-CLIENT',
    year: 'T-YEAR',
    myRole: 'T-ROLE',
    team: 'T-TEAM',
    platform: 'T-PLATFORM',
    tools: 'T-TOOLS',
  },
  showreelEyebrow: 'TEST MOTION',
  openDocument: 'Test open document',
  visitLiveSite: 'Test fallback link',
  media: {
    sliderLabel: 'Test compare',
    toggleWireframe: 'Test wireframe',
    toggleFinal: 'Test final',
    video: {
      play: 'Test play {title}',
      loading: 'Test loading',
      error: 'Test error',
      tryAgain: 'Test try again',
      openOriginal: 'Test original',
      restrictedNote: 'Test restricted',
    },
    imageFallback: fallback,
  },
  gallery: { previous: 'Test previous image', next: 'Test next image', imageFallback: fallback },
  unavailable: 'Test section unavailable',
};

const para = (text: string): ContentItem => ({ kind: 'paragraph', text });
const full: Project = makeProject({
  slug: 'full',
  title: 'Test full project',
  externalLink: { href: 'https://example.com/test', label: approved('Test live site') },
  facts: {
    tools: { value: 'Test tools', verified: true },
    client: { value: 'Test client', verified: true },
    team: { value: 'Test team', verified: false },
    myRole: { value: 'Test role', verified: true },
  },
  sections: {
    overview: { items: [para('Test overview text.')] },
    problem: { items: [] }, // empty: hidden, numbering stays continuous
    research: {
      heading: 'Test research sub-title',
      items: [{ kind: 'bullets', items: ['Test point A', 'Test point B'] }, image('Test inline')],
    },
    finalDesigns: {
      items: [
        image('Test final 1'),
        image('Test final 2'),
        image('Test final 3'),
        para('Test end.'),
      ],
    },
    outcomes: [
      { value: '+10%', label: 'Test verified outcome', verified: true },
      { value: '+99%', label: 'Test unverified outcome', verified: false },
    ],
  },
});

function renderModal(item: ModalItem, opener: HTMLElement | null = null) {
  const onClosed = vi.fn();
  const view = render(
    <MotionPreferenceProvider>
      <ProjectModal item={item} opener={opener} onClosed={onClosed} labels={labels} />
    </MotionPreferenceProvider>,
  );
  const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
  return { ...view, dialog, onClosed };
}

describe('pop-up content (FR-M2–M6; DESIGN §8.10)', () => {
  it('opens as a modal dialog labelled by the title, locks the page and focuses the panel', () => {
    const { dialog } = renderModal({ kind: 'project', project: full });
    expect(dialog.hasAttribute('open')).toBe(true);
    const title = screen.getByRole('heading', { level: 2, name: 'Test full project' });
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    expect(isScrollLocked()).toBe(true);
    expect(document.activeElement?.getAttribute('tabindex')).toBe('-1');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('heading bar: "category · year" and the close button', () => {
    const { dialog } = renderModal({ kind: 'project', project: full });
    const eyebrow = dialog.querySelector('p') as HTMLElement;
    expect(eyebrow.textContent).toBe('Test category·2024');
    expect(screen.getByRole('button', { name: 'Test close' })).toBeTruthy();
  });

  it('summary row: summary and a safe external link button when a link exists', () => {
    renderModal({ kind: 'project', project: full });
    expect(screen.getByText('Test summary.')).toBeTruthy();
    const link = screen.getByRole('link', { name: /Test live site/ });
    expect(link.getAttribute('href')).toBe('https://example.com/test');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('external link: the project label wins; a missing or blank label uses the fallback', () => {
    const own = renderModal({ kind: 'project', project: full });
    expect(screen.getByRole('link').textContent).toBe('Test live site');
    own.unmount();
    for (const externalLink of [
      { href: 'https://example.com/a' },
      { href: 'https://example.com/b', label: approved('   ') },
    ]) {
      const view = renderModal({
        kind: 'project',
        project: makeProject({ slug: 'l', externalLink }),
      });
      const link = screen.getByRole('link');
      expect(link.textContent).toBe('Test fallback link');
      expect(link.getAttribute('href')).toBe(externalLink.href);
      view.unmount();
    }
  });

  it('facts strip: verified facts only, in the fixed D-22 order', () => {
    const { container } = renderModal({ kind: 'project', project: full });
    const terms = [...container.querySelectorAll('dt')].map((d) => d.textContent);
    expect(terms).toEqual(['T-CLIENT', 'T-ROLE', 'T-TOOLS']);
    expect(screen.queryByText('Test team')).toBeNull();
  });

  it('blocks: D-16 order, empty hidden, continuous numbers; H3 eyebrows, H4 sub-titles', () => {
    renderModal({ kind: 'project', project: full });
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      '01 / TEST OVERVIEW',
      '02 / TEST RESEARCH',
      '03 / TEST FINAL DESIGNS',
      '04 / TEST OUTCOMES',
    ]);
    expect(screen.getByRole('heading', { level: 4, name: 'Test research sub-title' })).toBeTruthy();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toContain('Test point A');
  });

  it('Final Designs: consecutive images become one gallery; single images elsewhere stay inline', () => {
    renderModal({ kind: 'project', project: full });
    expect(screen.getByRole('img', { name: 'Test inline' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Test final 1' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Test final 2' })).toBeNull();
    expect(screen.getByText('01 / 03')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Test next image' })).toBeTruthy();
    expect(screen.getByText('Test end.')).toBeTruthy();
  });

  it('outcomes: verified only, through the shared milestone row', () => {
    renderModal({ kind: 'project', project: full });
    expect(screen.getByText('Test verified outcome')).toBeTruthy();
    expect(screen.getByText('+10%')).toBeTruthy();
    expect(screen.queryByText('Test unverified outcome')).toBeNull();
  });

  it('minimal project (FR-M6): top area and images only — no facts, link or empty headings', () => {
    const minimal = makeProject({
      slug: 'min',
      title: 'Test minimal',
      sections: { finalDesigns: { items: [image('Test only 1'), image('Test only 2')] } },
    });
    const { container } = renderModal({ kind: 'project', project: minimal });
    expect(container.querySelector('dl')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      '01 / TEST FINAL DESIGNS',
    ]);
  });

  it('production: PENDING parts render nothing (no markers, no stray separator)', () => {
    vi.stubEnv('DEV', false);
    const project = makeProject({
      slug: 'pend',
      title: 'Test pending project',
      year: pending('Test year'),
      summary: pending('Test summary note'),
      heroMedia: pending('Test hero note'),
      facts: pending('Test facts note'),
      externalLink: pending('Test link note'),
      sections: pending('Test sections note'),
    });
    const { dialog } = renderModal({ kind: 'project', project });
    expect(dialog.querySelectorAll('[data-pending]')).toHaveLength(0);
    expect((dialog.querySelector('p') as HTMLElement).textContent).toBe('Test category');
    expect(dialog.textContent).not.toContain('PENDING');
  });

  it('development: PENDING parts show their markers', () => {
    const project = makeProject({
      slug: 'pend',
      title: 'Test pending project',
      summary: pending('Test summary note'),
      heroMedia: pending('Test hero note'),
    });
    const { dialog } = renderModal({ kind: 'project', project });
    expect(dialog.querySelectorAll('[data-pending]').length).toBe(2);
  });

  it('showreel: "MOTION / VIDEO" eyebrow, title, poster + Play only (nothing loaded)', () => {
    const video: LocalVideo = {
      kind: 'video',
      poster: poster(),
      title: 'Test reel',
      source: { type: 'local', src: '/media/video/test.mp4' },
      hasSpeech: false,
    };
    const { dialog } = renderModal({ kind: 'showreel', video });
    expect((dialog.querySelector('p') as HTMLElement).textContent).toBe('TEST MOTION');
    expect(screen.getByRole('heading', { level: 2, name: 'Test reel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Test play Test reel' })).toBeTruthy();
    expect(dialog.querySelector('video, iframe')).toBeNull();
  });

  it('milestone document: preview image + "Open document" (A-6); year eyebrow', () => {
    const milestone: JourneyMilestone = {
      title: 'Test milestone',
      year: 2023,
      verified: true,
      opens: {
        kind: 'document',
        href: '/documents/test.pdf',
        label: 'Test doc',
        preview: image('Test preview'),
      },
    };
    const { dialog } = renderModal({ kind: 'milestone', milestone });
    expect((dialog.querySelector('p') as HTMLElement).textContent).toBe('2023');
    expect(screen.getByRole('img', { name: 'Test preview' })).toBeTruthy();
    const link = screen.getByRole('link', { name: /Test open document/ });
    expect(link.getAttribute('href')).toBe('/documents/test.pdf');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('milestone image: the image only, no document button', () => {
    const milestone: JourneyMilestone = {
      title: 'Test image milestone',
      year: 2022,
      verified: true,
      opens: image('Test award'),
    };
    renderModal({ kind: 'milestone', milestone });
    expect(screen.getByRole('img', { name: 'Test award' })).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('before/after: neither toggle selected at 50 %; Wireframe → 100, Final → 0; drag clears', () => {
    const project = makeProject({
      slug: 'ba',
      heroMedia: { kind: 'beforeAfter', before: image('Test before'), after: image('Test after') },
    });
    renderModal({ kind: 'project', project });
    const range = screen.getByRole('slider', { name: 'Test compare' }) as HTMLInputElement;
    const wire = screen.getByRole('button', { name: 'Test wireframe' });
    const fin = screen.getByRole('button', { name: 'Test final' });
    expect(range.value).toBe('50');
    expect([wire, fin].map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false']);
    fireEvent.click(wire);
    expect(range.value).toBe('100');
    expect(wire.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(fin);
    expect(range.value).toBe('0');
    expect(fin.getAttribute('aria-pressed')).toBe('true');
    expect(wire.getAttribute('aria-pressed')).toBe('false');
    fireEvent.input(range, { target: { value: '30' } });
    expect([wire, fin].map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false']);
    fireEvent.click(wire); // selecting again after a drag moves the divider again
    expect(range.value).toBe('100');
  });
});

describe('closing (FR-M8; R-6; owner decision, Phase 11)', () => {
  const opener = () => {
    const button = document.createElement('button');
    button.textContent = 'Test opener';
    document.body.appendChild(button);
    return button;
  };

  it('close button: closes once, restores scroll and focus, resets state; repeats do nothing', () => {
    const from = opener();
    const { dialog, onClosed } = renderModal({ kind: 'project', project: full }, from);
    const close = screen.getByRole('button', { name: 'Test close' });
    fireEvent.click(close);
    fireEvent.click(close);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(closeCalls).toBe(1);
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(isScrollLocked()).toBe(false);
    expect(document.activeElement).toBe(from);
    from.remove();
  });

  it('Escape: the cancel event is prevented and the same close sequence runs', () => {
    const { dialog, onClosed } = renderModal({ kind: 'project', project: full });
    const cancel = new Event('cancel', { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(closeCalls).toBe(1);
  });

  it('unexpected native closure: cleaned up at once, and only once', () => {
    const from = opener();
    const { dialog, onClosed } = renderModal({ kind: 'project', project: full }, from);
    act(() => dialog.close());
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(isScrollLocked()).toBe(false);
    expect(document.activeElement).toBe(from);
    // A later close request or close event changes nothing (the closed dialog is hidden).
    fireEvent.click(screen.getByRole('button', { name: 'Test close', hidden: true }));
    act(() => {
      dialog.dispatchEvent(new Event('close'));
    });
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(closeCalls).toBe(1);
    from.remove();
  });

  it('backdrop: closes only when the press starts and ends on the backdrop', () => {
    const { onClosed } = renderModal({ kind: 'project', project: full });
    const backdrop = screen.getByTestId('modal-backdrop');
    const inside = screen.getByText('Test summary.');
    // Press inside, release on the backdrop (e.g. selecting text): stays open.
    fireEvent.pointerDown(inside);
    fireEvent.pointerUp(backdrop);
    fireEvent.click(backdrop);
    // Press on the backdrop, release inside: stays open.
    fireEvent.pointerDown(backdrop);
    fireEvent.pointerUp(inside);
    fireEvent.click(backdrop);
    // A click inside the panel: stays open.
    fireEvent.pointerDown(inside);
    fireEvent.pointerUp(inside);
    fireEvent.click(inside);
    expect(onClosed).not.toHaveBeenCalled();
    fireEvent.pointerDown(backdrop);
    fireEvent.pointerUp(backdrop);
    fireEvent.click(backdrop);
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('motion on: the dialog stays open until the M-13 exit has finished', async () => {
    localStorage.setItem(MOTION_STORAGE_KEY, 'on');
    const { dialog, onClosed } = renderModal({ kind: 'project', project: full });
    fireEvent.click(screen.getByRole('button', { name: 'Test close' }));
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(onClosed).not.toHaveBeenCalled();
    // Further requests during the exit are ignored.
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(closeCalls).toBe(1);
  });

  it('unmounting without closing still unlocks the page (safety net)', () => {
    const { unmount } = renderModal({ kind: 'project', project: full });
    expect(isScrollLocked()).toBe(true);
    unmount();
    expect(isScrollLocked()).toBe(false);
  });

  it('content that fails to render is contained with the quiet message; close still works', () => {
    const broken = makeProject({
      slug: 'broken',
      // An image without an asset: rendering it throws.
      sections: { overview: { items: [{ kind: 'image', alt: 'x' } as unknown as ContentItem] } },
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { onClosed } = renderModal({ kind: 'project', project: broken });
    error.mockRestore();
    expect(screen.getByText('Test section unavailable')).toBeTruthy();
    fireEvent.click(within(document.body).getByRole('button', { name: 'Test close' }));
    expect(onClosed).toHaveBeenCalledTimes(1);
  });
});
