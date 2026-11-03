// Lucide icon wrapper (DESIGN §11.1; ARCHITECTURE §1.1): thin 1.5 px outline icons. Only the icons
// listed here are bundled. Decorative by default (hidden from screen readers); pass `label` when
// an icon carries meaning on its own.
//
// Q-4 (owner decision, Phase 7): the installed lucide-react ships no brand marks, so every social
// network uses the generic link icon. No custom brand SVGs.

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  ImageOff,
  Link,
  Mail,
  MapPin,
  Minus,
  Pause,
  Phone,
  Play,
  Plus,
  Search,
  X,
} from 'lucide-react';

const icons = {
  'arrow-down': ArrowDown,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  alert: CircleAlert,
  download: Download,
  'image-off': ImageOff,
  link: Link,
  mail: Mail,
  'map-pin': MapPin,
  minus: Minus,
  pause: Pause,
  phone: Phone,
  play: Play,
  plus: Plus,
  search: Search,
  close: X,
} as const;

export type IconName = keyof typeof icons;

/** Social networks (LinkedIn, Behance, Dribbble, Instagram) all use the generic link icon (Q-4). */
export const SOCIAL_ICON: IconName = 'link';

export interface IconProps {
  readonly name: IconName;
  /** Size in px (DESIGN component specs, e.g. 13 px in the Motion toggle). Default 16. */
  readonly size?: number;
  /** Accessible name when the icon is meaningful on its own; omit for decorative icons. */
  readonly label?: string;
  readonly className?: string;
}

export function Icon({ name, size = 16, label, className }: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      size={size}
      strokeWidth={1.5}
      className={className}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    />
  );
}
