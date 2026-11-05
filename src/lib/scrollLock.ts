// Page scroll lock behind the pop-up (PRD FR-M7; ARCHITECTURE R-7). Framework-free.
// Fixing <body> at the current scroll offset is the technique that also holds on iOS Safari, where
// `overflow: hidden` alone lets the page scroll behind a modal. The scrollbar's width is replaced
// with padding so the page does not shift sideways. Both calls are idempotent: a second lock or
// unlock does nothing, so overlapping close paths can never restore the position twice.

let saved: { readonly y: number; readonly style: string } | null = null;

export function lockScroll(): void {
  if (saved) return;
  const { body, documentElement } = document;
  const y = window.scrollY;
  const gutter = window.innerWidth - documentElement.clientWidth;
  saved = { y, style: body.getAttribute('style') ?? '' };
  body.style.position = 'fixed';
  body.style.top = `${-y}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.overflow = 'hidden';
  if (gutter > 0) body.style.paddingRight = `${gutter}px`;
}

export function unlockScroll(): void {
  if (!saved) return;
  const { y, style } = saved;
  saved = null;
  const { body, documentElement } = document;
  if (style) body.setAttribute('style', style);
  else body.removeAttribute('style');
  // Jump back without the page's smooth scrolling (MO-3 applies to anchors, not restoration).
  const behaviour = documentElement.style.scrollBehavior;
  documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, y);
  documentElement.style.scrollBehavior = behaviour;
}

export function isScrollLocked(): boolean {
  return saved !== null;
}
