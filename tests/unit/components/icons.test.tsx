import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Asterisk } from '../../../src/components/icons/Asterisk.tsx';
import { HandleChevrons } from '../../../src/components/icons/HandleChevrons.tsx';
import { Icon, SOCIAL_ICON } from '../../../src/components/icons/Icon.tsx';
import { Laurel } from '../../../src/components/icons/Laurel.tsx';
import { QuoteMark } from '../../../src/components/icons/QuoteMark.tsx';

describe('icons (DESIGN §11.1; Q-4)', () => {
  it('Lucide icons are decorative by default, at a 1.5 px stroke', () => {
    const { container } = render(<Icon name="search" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('stroke-width')).toBe('1.5');
  });

  it('a labelled icon is exposed as an image with its name', () => {
    render(<Icon name="mail" label="Email" />);
    expect(screen.getByRole('img', { name: 'Email' })).toBeTruthy();
  });

  it('social networks use the generic link icon (Q-4: no brand marks)', () => {
    expect(SOCIAL_ICON).toBe('link');
  });

  it('custom SVGs are hidden from screen readers', () => {
    const { container } = render(
      <>
        <Asterisk />
        <QuoteMark />
        <Laurel />
        <Laurel side="right" />
        <HandleChevrons />
      </>,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);
    svgs.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'));
  });
});
