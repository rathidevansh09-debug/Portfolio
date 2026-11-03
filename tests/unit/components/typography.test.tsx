import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextLink } from '../../../src/components/actions/TextLink/TextLink.tsx';
import { DisplayHeading } from '../../../src/components/typography/DisplayHeading/DisplayHeading.tsx';
import { Eyebrow } from '../../../src/components/typography/Eyebrow/Eyebrow.tsx';
import { SectionHeading } from '../../../src/components/typography/SectionHeading/SectionHeading.tsx';

describe('typography (DESIGN §7.1)', () => {
  it('Eyebrow renders muted by default and accent on request', () => {
    const { rerender } = render(<Eyebrow>01 / TEST</Eyebrow>);
    expect(screen.getByText('01 / TEST').dataset.tone).toBe('muted');
    rerender(<Eyebrow tone="accent">01 / TEST</Eyebrow>);
    expect(screen.getByText('01 / TEST').dataset.tone).toBe('accent');
  });

  it('DisplayHeading colours only the final full stop, keeping the text intact', () => {
    render(<DisplayHeading lines={['TEST ONE', 'TEST TWO.']} level={2} size="display-impact" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe('TEST ONETEST TWO.');
    const accented = heading.querySelectorAll('span span');
    expect(accented).toHaveLength(1);
    expect(accented[0]?.textContent).toBe('.');
    expect(heading.dataset.size).toBe('display-impact');
  });

  it('DisplayHeading can colour the whole final line and set the heading level', () => {
    render(
      <DisplayHeading
        lines={['TEST.', 'ACCENT.']}
        level={3}
        size="display-about"
        accent="last-line"
      />,
    );
    const heading = screen.getByRole('heading', { level: 3 });
    const lines = heading.querySelectorAll(':scope > span');
    expect(lines).toHaveLength(2);
    expect(lines[1]?.className).toMatch(/accent/);
    expect(lines[0]?.className).not.toMatch(/accent/);
  });

  it('SectionHeading renders eyebrow, title with accent stop, and an optional action', () => {
    const { rerender } = render(<SectionHeading eyebrow="01 / TEST" title="TEST TITLE." />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('TEST TITLE.');
    expect(screen.queryByRole('link')).toBeNull();
    rerender(
      <SectionHeading
        eyebrow="03 / TEST"
        title="TEST"
        variant="journey"
        level={3}
        action={<TextLink href="#x">MORE</TextLink>}
      />,
    );
    expect(screen.getByRole('heading', { level: 3 }).dataset.variant).toBe('journey');
    expect(screen.getByRole('link', { name: 'MORE' })).toBeTruthy();
  });
});
