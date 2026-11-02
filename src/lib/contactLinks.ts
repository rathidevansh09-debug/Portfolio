// WhatsApp and email links for the brief form and contact list (PRD FR-C5, NFR-PR1).
// Nothing is sent or stored by the site: these links open the visitor's own app. Every piece of
// visitor text is URL-encoded, so special characters never break the link (AGENTS §14.1).

import { fillTemplate } from './format.ts';

/** wa.me needs the international number as digits only, without "+" or leading zeros. */
export function normaliseWhatsAppNumber(input: string): string {
  const digits = input.replace(/[\s().-]/g, '').replace(/^\+/, '');
  if (!/^[1-9]\d{6,14}$/.test(digits)) {
    throw new Error(
      `Invalid WhatsApp number "${input}": use the international format with country code`,
    );
  }
  return digits;
}

export function buildWhatsAppLink(number: string, message: string): string {
  return `https://wa.me/${normaliseWhatsAppNumber(number)}?text=${encodeURIComponent(message)}`;
}

const EMAIL = /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/;

/** mailto: link with encoded subject and body; line breaks become CRLF (RFC 6068). */
export function buildMailtoLink(email: string, subject: string, body: string): string {
  if (!EMAIL.test(email)) throw new Error(`Invalid email address "${email}"`);
  const crlf = (s: string) => s.replace(/\r?\n/g, '\r\n');
  return `mailto:${email}?subject=${encodeURIComponent(crlf(subject))}&body=${encodeURIComponent(crlf(body))}`;
}

export interface BriefFields {
  readonly name: string;
  readonly projectTypes: readonly string[];
  readonly message: string;
}

/** Fills an owner-written template ({name}, {projectTypes}, {message}) with the visitor's brief. */
export function composeBrief(template: string, brief: BriefFields): string {
  return fillTemplate(template, {
    name: brief.name.trim(),
    projectTypes: brief.projectTypes.join(', '),
    message: brief.message.trim(),
  });
}
