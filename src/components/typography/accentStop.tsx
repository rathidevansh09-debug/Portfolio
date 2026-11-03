// Shared helper: render a final full stop in the accent colour (DESIGN §7.1 "accent stop").
// The text itself is unchanged, so screen readers read it as written.

import type { ReactNode } from 'react';

export function withAccentStop(text: string, accentClassName: string): ReactNode {
  if (!text.endsWith('.')) return text;
  return (
    <>
      {text.slice(0, -1)}
      <span className={accentClassName}>.</span>
    </>
  );
}
