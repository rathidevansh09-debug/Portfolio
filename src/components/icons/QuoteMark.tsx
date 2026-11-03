// Large quote mark for the About quote card (DESIGN §7.4, §11.1): our own drawing. Decorative.

export function QuoteMark({
  size = 76,
  className,
}: {
  readonly size?: number;
  readonly className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M8 34c0-9 4-16 12-20l2 3c-5 3-7 7-7 11h6v12H8v-6Zm20 0c0-9 4-16 12-20l2 3c-5 3-7 7-7 11h6v12H28v-6Z" />
    </svg>
  );
}
