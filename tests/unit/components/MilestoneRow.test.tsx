import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MilestoneItem } from '../../../src/components/MilestoneRow/MilestoneItem.tsx';
import { MilestoneRow } from '../../../src/components/MilestoneRow/MilestoneRow.tsx';

describe('MilestoneRow and MilestoneItem (DESIGN §7.4)', () => {
  it('large row: two-digit index, title, context and trailing value (year or outcome)', () => {
    render(
      <ul>
        <MilestoneRow index={3} title="Test milestone" context="Test context" value="2024" />
        <MilestoneRow index={12} title="Test outcome" value="+40%" />
      </ul>,
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]?.textContent).toBe('03Test milestoneTest context2024');
    expect(rows[1]?.textContent).toBe('12Test outcome+40%');
  });

  it('can render as a div outside lists', () => {
    const { container } = render(<MilestoneRow as="div" index={1} title="T" />);
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  it('small item is one button that activates by click and keyboard', () => {
    const onActivate = vi.fn();
    render(<MilestoneItem index={1} title="Test item" year="2025" onActivate={onActivate} />);
    const button = screen.getByRole('button', { name: /Test item/ });
    expect(button.textContent).toBe('01Test item2025');
    fireEvent.click(button);
    expect(onActivate).toHaveBeenCalledOnce();
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
