// Interface wording → display text (ARCHITECTURE §4.1; AGENTS §5). Wording the owner has not
// supplied yet shows the visible PENDING marker; the launch check blocks it from shipping.

import { isPending, PENDING_LABEL, type OrPending } from '../content/pending.ts';
import type { Copy } from '../content/schema.ts';

export function copyText(copy: OrPending<Copy>): string {
  return isPending(copy) ? PENDING_LABEL : copy.text;
}
