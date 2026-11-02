import { describe, expect, it } from 'vitest';
import {
  buildMailtoLink,
  buildWhatsAppLink,
  composeBrief,
  normaliseWhatsAppNumber,
} from '../../src/lib/contactLinks.ts';

// Fictional test numbers and addresses only (FR-C5).
describe('contact links encode visitor text safely (FR-C5)', () => {
  it('normalises an international WhatsApp number to digits', () => {
    expect(normaliseWhatsAppNumber('+00 12 3456-7890'.replace('00', '44'))).toBe('441234567890');
    expect(() => normaliseWhatsAppNumber('0123')).toThrow(/international format/);
    expect(() => normaliseWhatsAppNumber('+44 abc')).toThrow();
  });

  it('builds a wa.me link with the whole message encoded', () => {
    const text = 'Hi & hello? 100% "quotes" #1\nNew line 😀 ठीक';
    const link = buildWhatsAppLink('+44 1234 567890', text);
    expect(link.startsWith('https://wa.me/441234567890?text=')).toBe(true);
    const encoded = link.split('?text=')[1] ?? '';
    expect(encoded).not.toMatch(/[\s&#?"]/);
    expect(decodeURIComponent(encoded)).toBe(text);
  });

  it('builds a mailto link with encoded subject and body, CRLF line breaks', () => {
    const link = buildMailtoLink('hello@example.com', 'Brief: A&B?', 'Line 1\nLine 2 & more #3');
    const [address, query] = link.split('?') as [string, string];
    expect(address).toBe('mailto:hello@example.com');
    const params = new URLSearchParams(query);
    expect(params.get('subject')).toBe('Brief: A&B?');
    expect(params.get('body')).toBe('Line 1\r\nLine 2 & more #3');
    expect(() => buildMailtoLink('not-an-email', 's', 'b')).toThrow(/Invalid email/);
    expect(() => buildMailtoLink('a@b.com?cc=x@y.com', 's', 'b')).toThrow(/Invalid email/);
  });

  it('fills an owner template with the trimmed brief', () => {
    expect(
      composeBrief('{name} — {projectTypes}: {message}', {
        name: '  Sam ',
        projectTypes: ['Product Design', 'Other'],
        message: ' Hello ',
      }),
    ).toBe('Sam — Product Design, Other: Hello');
  });
});
