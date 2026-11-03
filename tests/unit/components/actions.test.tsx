import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionBase } from '../../../src/components/actions/ActionBase.tsx';
import { IconButton } from '../../../src/components/actions/IconButton/IconButton.tsx';
import { OutlineButton } from '../../../src/components/actions/OutlineButton/OutlineButton.tsx';
import { PlayCircle } from '../../../src/components/actions/PlayCircle/PlayCircle.tsx';
import { PrimaryButton } from '../../../src/components/actions/PrimaryButton/PrimaryButton.tsx';
import { RoundArrowCta } from '../../../src/components/actions/RoundArrowCta/RoundArrowCta.tsx';
import { TextLink } from '../../../src/components/actions/TextLink/TextLink.tsx';
import { MotionPreferenceProvider } from '../../../src/motion/MotionPreference.tsx';

beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

describe('ActionBase: one implementation for links and buttons (AGENTS §14.1)', () => {
  it('renders a link for href and a type="button" button otherwise', () => {
    const onClick = vi.fn();
    render(
      <>
        <ActionBase href="#work">Link</ActionBase>
        <ActionBase onClick={onClick}>Button</ActionBase>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Link' }).getAttribute('href')).toBe('#work');
    const button = screen.getByRole('button', { name: 'Button' });
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('opens external links in a new tab with rel="noopener noreferrer" only', () => {
    render(
      <>
        <ActionBase href="https://example.com" external>
          External
        </ActionBase>
        <ActionBase href="/documents/cv.pdf" download>
          Internal
        </ActionBase>
      </>,
    );
    const external = screen.getByRole('link', { name: 'External' });
    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toBe('noopener noreferrer');
    const internal = screen.getByRole('link', { name: 'Internal' });
    expect(internal.hasAttribute('target')).toBe(false);
    expect(internal.hasAttribute('download')).toBe(true);
  });
});

describe('buttons and links (DESIGN §7.2)', () => {
  it('PrimaryButton renders label + decorative arrow, with a solid variant', () => {
    const { rerender } = render(<PrimaryButton onClick={() => {}}>Send</PrimaryButton>);
    const button = screen.getByRole('button', { name: 'Send' });
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(button.className).not.toMatch(/solid/);
    rerender(
      <PrimaryButton variant="solid" type="submit">
        Send
      </PrimaryButton>,
    );
    const solid = screen.getByRole('button', { name: 'Send' });
    expect(solid.className).toMatch(/solid/);
    expect(solid.getAttribute('type')).toBe('submit');
  });

  it('OutlineButton, TextLink: accessible names are the visible text only', () => {
    render(
      <>
        <OutlineButton onClick={() => {}} icon="arrow-down">
          Show more
        </OutlineButton>
        <TextLink href="#all">ALL WORK</TextLink>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Show more' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'ALL WORK' })).toBeTruthy();
  });

  it('IconButton and PlayCircle carry their required accessible label', () => {
    render(
      <>
        <IconButton icon="close" label="Close test" onClick={() => {}} />
        <PlayCircle label="Play test" onClick={() => {}} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Close test' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Play test' })).toBeTruthy();
  });

  it('RoundArrowCta renders its label inside the magnetic wrapper', () => {
    render(
      <MotionPreferenceProvider>
        <RoundArrowCta href="#contact">START</RoundArrowCta>
      </MotionPreferenceProvider>,
    );
    expect(screen.getByRole('link', { name: 'START' })).toBeTruthy();
  });
});
