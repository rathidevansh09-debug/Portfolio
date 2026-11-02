import { describe, expect, it } from 'vitest';
import { content } from '../../src/content/index.ts';
import { isPending } from '../../src/content/pending.ts';

// The populated content holds confirmed facts only; everything else is PENDING (Phase 5, Task 3).
describe('site content: confirmed facts only, nothing invented', () => {
  it('lists the nine confirmed project names (FR-W9)', () => {
    expect(content.projects.map((p) => p.title)).toEqual([
      'TruFlo Intelligence',
      'PNG Jewellers',
      'YOOU by PNG',
      'Ranka Jewellers',
      'Yera Glassware',
      'Purple United Kids',
      'DS Mills',
      'Healthify',
      'Plantigo',
    ]);
  });

  it('keeps every project detail other than slug and title PENDING', () => {
    for (const p of content.projects) {
      const { slug, title, ...rest } = p;
      expect(slug).toBeTruthy();
      expect(title).toBeTruthy();
      for (const [field, value] of Object.entries(rest)) {
        expect(isPending(value), `${slug}.${field} should be PENDING`).toBe(true);
      }
    }
  });

  it('features PNG Jewellers, YOOU by PNG and Yera Glassware in that order (DS-4)', () => {
    expect(content.projectIndex.featured).toEqual([
      'png-jewellers',
      'yoou-by-png',
      'yera-glassware',
    ]);
    expect(isPending(content.projectIndex.displayOrder)).toBe(true);
  });

  it('has the six approved filter tags (D-03)', () => {
    expect(content.filters.map((f) => f.label)).toEqual([
      'Product & SaaS',
      'Dashboards & Data',
      'eCommerce',
      'Design Systems',
      'Motion & Video',
      'Visual Design',
    ]);
  });

  it('lists five Journey roles newest first with the confirmed promotions (D-10, D-15)', () => {
    const roles = content.experience.roles;
    expect(roles.map((r) => (isPending(r.role) ? 'PENDING' : r.role))).toEqual([
      'Lead UX Designer',
      'UX Designer',
      'UI Designer & Video Editor',
      'Junior Visualizer',
      'PENDING',
    ]);
    expect(roles[0]?.promotedFrom).toBe(roles[1]?.id);
    expect(roles[2]?.promotedFrom).toBe(roles[3]?.id);
    expect(roles.filter((r) => r.promotedFrom).length).toBe(2);
  });

  it('has the five confirmed process step titles (D-13) with descriptions PENDING', () => {
    expect(content.about.processSteps.map((s) => s.title)).toEqual([
      'RESEARCH',
      'STRUCTURE',
      'DESIGN',
      'HANDOFF',
      'OPTIMISE',
    ]);
    expect(content.about.processSteps.every((s) => isPending(s.description))).toBe(true);
  });

  it('has the confirmed closing statement (D-18) and contact details PENDING', () => {
    expect(content.contact.closingStatement).toBe("LET'S MAKE THE NEXT SCREEN COUNT.");
    expect(isPending(content.contact.email)).toBe(true);
    expect(isPending(content.contact.whatsapp)).toBe(true);
  });

  it('keeps the full name only in the metadata field (D-11)', () => {
    expect(content.site.fullNameForMetadata).toBe('Devansh Rathi');
    expect(content.profile.displayName).toBe('Devansh');
  });

  it('leaves impact, breakdown (D-09), brands and stats PENDING', () => {
    expect(isPending(content.impact.milestones)).toBe(true);
    expect(isPending(content.breakdown.project)).toBe(true);
    expect(isPending(content.brands)).toBe(true);
    expect(isPending(content.profile.stats)).toBe(true);
  });

  it('keeps example-only wording PENDING and exact document wording approved (copy rule)', () => {
    const ui = content.ui;
    for (const [group, key] of [
      ['work', 'typeCaseStudy'],
      ['work', 'typeWebsite'],
      ['work', 'typeVideoMotion'],
      ['journey', 'promotedFrom'],
      ['popup', 'visitLiveSite'],
    ] as const) {
      expect(isPending(ui[group]?.[key]), `${group}.${key}`).toBe(true);
    }
    expect(ui.journey?.promoted).toEqual({ text: 'PROMOTED', status: 'approved' });
    expect(ui.work?.headline).toEqual({ text: 'WORK THAT SPEAKS.', status: 'draft' });
  });

  it('holds social links once, in the profile (ARCHITECTURE §4.2)', () => {
    expect(isPending(content.profile.socialLinks.linkedin)).toBe(true);
    expect('linkedin' in content.contact).toBe(false);
  });
});
