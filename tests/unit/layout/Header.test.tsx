import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Header, type HeaderProps } from '../../../src/layout/Header/Header.tsx';
import { MotionPreferenceProvider } from '../../../src/motion/MotionPreference.tsx';
import { MOTION_STORAGE_KEY, REDUCED_MOTION_QUERY } from '../../../src/motion/preference.ts';

// jsdom has neither matchMedia nor IntersectionObserver: controllable stand-ins.
let systemReduced = false;
let phone = false;
let ioCallback: (entries: { target: Element; isIntersecting: boolean }[]) => void = () => {};

beforeEach(() => {
  systemReduced = false;
  phone = false;
  localStorage.clear();
  window.matchMedia = ((query: string) => ({
    get matches() {
      if (query === REDUCED_MOTION_QUERY) return systemReduced;
      if (query === '(max-width: 600px)') return phone;
      return false;
    },
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  window.IntersectionObserver = class {
    constructor(cb: typeof ioCallback) {
      ioCallback = cb;
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

const props: HeaderProps = {
  wordmark: 'DEVANSH',
  home: { id: 'home', label: 'Home' },
  items: [
    { id: 'portfolio', label: 'Work' },
    { id: 'impact', label: 'Impact' },
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Journey' },
    { id: 'contact', label: 'Contact' },
  ],
  talk: { id: 'contact', label: "Let's talk" },
  motionLabels: { on: 'Motion on', off: 'Motion off', systemNote: 'Test system note' },
  menuLabels: { open: 'Test open menu', close: 'Test close menu' },
};

const renderHeader = () =>
  render(
    <MotionPreferenceProvider>
      <section id="home" />
      <section id="portfolio" />
      <Header {...props} />
    </MotionPreferenceProvider>,
  );

describe('Header (FR-H1–H5, M-16)', () => {
  it('wordmark links home; nav lists the five sections in order; "Let\'s talk →"', () => {
    renderHeader();
    const banner = screen.getByRole('banner');
    expect(within(banner).getByRole('link', { name: 'DEVANSH' }).getAttribute('href')).toBe(
      '#home',
    );
    const nav = within(banner).getByRole('navigation');
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual([
      ['Work', '#portfolio'],
      ['Impact', '#impact'],
      ['About', '#about'],
      ['Journey', '#experience'],
      ['Contact', '#contact'],
    ]);
    const talk = within(banner).getByRole('link', { name: "Let's talk" });
    expect(talk.getAttribute('href')).toBe('#contact');
    // PRD FR-H5 arrow → (owner decision 3).
    expect(talk.querySelector('svg')?.getAttribute('class')).toContain('lucide-arrow-right');
    expect(banner.textContent).not.toMatch(/[®™]/);
  });

  it('marks the active section with aria-current (M-16); the Hero clears it', () => {
    renderHeader();
    const work = screen.getByRole('link', { name: 'Work' });
    expect(work.hasAttribute('aria-current')).toBe(false);
    const target = (id: string) => document.getElementById(id) as Element;
    act(() => ioCallback([{ target: target('portfolio'), isIntersecting: true }]));
    expect(work.getAttribute('aria-current')).toBe('location');
    act(() =>
      ioCallback([
        { target: target('portfolio'), isIntersecting: false },
        { target: target('home'), isIntersecting: true },
      ]),
    );
    expect(work.hasAttribute('aria-current')).toBe(false);
  });
});

describe('MotionToggle (FR-H4, FR-G3, MO-5; owner decision 5B)', () => {
  it('is a switch named by its visible text; toggling saves the choice', () => {
    renderHeader();
    const toggle = screen.getByRole('switch', { name: 'Motion on' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(toggle.querySelector('svg')?.getAttribute('class')).toContain('lucide-pause');
    fireEvent.click(toggle);
    const off = screen.getByRole('switch', { name: 'Motion off' });
    expect(off.getAttribute('aria-checked')).toBe('false');
    expect(off.querySelector('svg')?.getAttribute('class')).toContain('lucide-play');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('off');
    expect(document.documentElement.dataset.motion).toBe('off');
  });

  it('when the system forces reduced motion: shows off, unavailable, explained, inert', () => {
    systemReduced = true;
    renderHeader();
    const toggle = screen.getByRole('switch', { name: 'Motion off' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(toggle.getAttribute('aria-disabled')).toBe('true');
    const noteId = toggle.getAttribute('aria-describedby');
    expect(noteId && document.getElementById(noteId)?.textContent).toBe('Test system note');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull(); // nothing silently accepted
  });
});

describe('MobileMenu (FR-H6, M-17)', () => {
  it('phone: button announces closed/open and lists Home + five sections, numbered', () => {
    phone = true;
    renderHeader();
    const button = screen.getByRole('button', { name: 'Test open menu' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    const close = screen.getByRole('button', { name: 'Test close menu' });
    expect(close.getAttribute('aria-expanded')).toBe('true');
    const menu = document.getElementById(close.getAttribute('aria-controls') ?? '') as HTMLElement;
    expect(
      within(menu)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['01Home', '02Work', '03Impact', '04About', '05Journey', '06Contact']);
    expect(within(menu).getAllByRole('link')[0]?.getAttribute('href')).toBe('#home');
  });

  it('closes on a link tap, on the button and on Escape (focus returns to the button)', () => {
    phone = true;
    renderHeader();
    const open = () => fireEvent.click(screen.getByRole('button', { name: 'Test open menu' }));
    const expanded = () =>
      screen.getByRole('button', { name: /Test (open|close) menu/ }).getAttribute('aria-expanded');

    open();
    fireEvent.click(screen.getByRole('link', { name: '04About' }));
    expect(expanded()).toBe('false');

    open();
    fireEvent.click(screen.getByRole('button', { name: 'Test close menu' }));
    expect(expanded()).toBe('false');

    open();
    screen.getByRole('link', { name: '02Work' }).focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(expanded()).toBe('false');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Test open menu' }));
  });

  it('does not exist above 600 px', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Test open menu' }));
    expect(
      screen.getByRole('button', { name: 'Test open menu' }).getAttribute('aria-expanded'),
    ).toBe('false');
  });
});
