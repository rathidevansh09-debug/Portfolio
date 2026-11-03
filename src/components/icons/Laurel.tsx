// Laurel branch beside the Impact figure (DESIGN §7.4: 42 × 89 px, `laurel` colour): our own
// drawing. `side="right"` mirrors it. Decorative: hidden from screen readers.

export function Laurel({
  side = 'left',
  className,
}: {
  readonly side?: 'left' | 'right';
  readonly className?: string;
}) {
  return (
    <svg
      width={42}
      height={89}
      viewBox="0 0 42 89"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={side === 'right' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M32 86C14 72 8 52 12 30 15 18 22 9 30 3" />
      <path d="M13 70c-6-1-10-5-11-11 6 0 10 4 11 11ZM10 54c-6-2-9-7-9-13 6 1 9 6 9 13ZM11 38c-5-3-7-8-6-14 5 2 7 7 6 14ZM16 24c-4-4-5-9-3-14 4 3 5 8 3 14Z" />
      <path d="M17 76c4-4 10-5 15-3-4 4-10 5-15 3ZM14 61c4-5 9-7 15-6-3 5-9 7-15 6ZM14 45c3-5 8-8 14-8-3 6-8 8-14 8ZM18 30c2-5 7-9 13-9-2 5-7 9-13 9Z" />
    </svg>
  );
}
