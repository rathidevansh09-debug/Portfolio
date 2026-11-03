// Left/right chevrons inside the comparison handle (DESIGN §7.4, §11.1): our own drawing. Decorative.

export function HandleChevrons({ className }: { readonly className?: string }) {
  return (
    <svg
      width={20}
      height={12}
      viewBox="0 0 20 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M6 1 1 6l5 5M14 1l5 5-5 5" />
    </svg>
  );
}
