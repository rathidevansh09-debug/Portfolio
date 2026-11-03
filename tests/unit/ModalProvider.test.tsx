import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { content } from '../../src/content/index.ts';
import { ModalProvider, useModal } from '../../src/modal/ModalProvider.tsx';

// Phase 8: the pop-up state only (ARCHITECTURE §3.2). The pop-up itself is Phase 11.
function Probe() {
  const { item, opener, openModal, closeModal } = useModal();
  const project = content.projects[0];
  return (
    <div>
      <span data-testid="item">{item ? item.kind : 'none'}</span>
      <span data-testid="opener">{opener?.textContent ?? 'none'}</span>
      <button
        type="button"
        onClick={(e) => project && openModal({ kind: 'project', project }, e.currentTarget)}
      >
        open project
      </button>
      <button type="button" onClick={closeModal}>
        close
      </button>
    </div>
  );
}

describe('ModalProvider', () => {
  it('records the open item and the element that opened it; closing clears both', () => {
    render(
      <ModalProvider>
        <Probe />
      </ModalProvider>,
    );
    expect(screen.getByTestId('item').textContent).toBe('none');
    fireEvent.click(screen.getByRole('button', { name: 'open project' }));
    expect(screen.getByTestId('item').textContent).toBe('project');
    expect(screen.getByTestId('opener').textContent).toBe('open project');
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(screen.getByTestId('item').textContent).toBe('none');
    expect(screen.getByTestId('opener').textContent).toBe('none');
  });

  it('fails clearly when used outside the provider', () => {
    const quiet = console.error;
    console.error = () => {};
    expect(() => render(<Probe />)).toThrow(/inside <ModalProvider>/);
    console.error = quiet;
  });
});
