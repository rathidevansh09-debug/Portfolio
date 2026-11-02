import { describe, expect, it } from 'vitest';
import { content } from '../../src/content/index.ts';
import { approved, draft } from '../../src/content/schema.ts';
import { runLaunchCheck, splitIndexHtml } from '../../src/lib/launchCheck.ts';
import { image, makeProject, picture, withContent } from './fixtures.ts';
import indexHtml from '../../index.html?raw';

const html =
  '<html><head><title>Devansh</title></head><body><noscript>Devansh</noscript></body></html>';
const rules = (r: ReturnType<typeof runLaunchCheck>) => new Set(r.blocking.map((i) => i.rule));

/** Content with every blocking item resolved, so each test can add exactly one problem. */
function launchReady() {
  const project = makeProject({ slug: 'ready', tags: ['product-saas'] });
  return withContent({
    site: {
      ...content.site,
      title: approved('Devansh'),
      description: approved('Desc'),
      shareImage: { src: '/og-image.jpg', width: 1200, height: 630 },
      shareImageWording: 'Devansh',
    },
    ui: { states: { loading: approved('Loading…') } },
    profile: {
      ...content.profile,
      supportingLine: approved('S'),
      intro: 'Intro',
      location: 'City',
      availability: { text: approved('A'), shown: true },
      manifestoLines: [approved('M')],
      stats: [],
      cv: { kind: 'document', href: '/documents/cv.pdf', preview: image('CV'), label: 'CV' },
      showreel: null,
      editionStartYear: 2020,
      socialLinks: { linkedin: 'https://www.linkedin.com/in/example', others: [] },
    },
    projects: [project],
    projectIndex: { featured: ['ready'], displayOrder: ['ready'] },
    brands: [],
    impact: {
      paragraph: 'P',
      proofLink: null,
      highlight: null,
      milestones: [],
      zeroItemsDecision: 'hide',
    },
    breakdown: {
      project: 'ready',
      pair: { kind: 'beforeAfter', before: image('Before'), after: image('After') },
      credit: 'C',
      paragraph: 'P',
    },
    about: {
      ...content.about,
      intro: 'I',
      education: [],
      courses: [],
      toolkit: [],
      processSteps: content.about.processSteps.map((s) => ({ ...s, description: 'D' })),
      quote: 'Q',
    },
    experience: {
      roles: [
        {
          id: 'r',
          role: 'Role',
          company: 'Co',
          start: { year: 2024 },
          end: 'present',
          description: 'D',
        },
      ],
      milestones: [],
      emptyPanelDecision: 'hide',
    },
    contact: {
      ...content.contact,
      email: 'hello@example.com',
      whatsapp: '441234567890',
      basedIn: 'City',
      projectTypes: [approved('Other')],
      messageTemplates: { whatsapp: '{message}', emailSubject: 'Brief', emailBody: '{message}' },
    },
  });
}

describe('launch check (ARCHITECTURE §4.7)', () => {
  it('passes fully resolved content, but always lists the manual share-image inspection', () => {
    const r = runLaunchCheck(launchReady(), html);
    expect(r.blocking).toEqual([]);
    expect(r.manual.join(' ')).toMatch(/share image by eye/);
  });

  it('blocks the current site content and lists every PENDING item', () => {
    const r = runLaunchCheck(content, indexHtml);
    const pendingCount = r.blocking.filter((i) => i.rule === 'PENDING content').length;
    expect(pendingCount).toBeGreaterThan(100);
    expect(rules(r)).toEqual(
      new Set([
        'PENDING content',
        'Draft copy not yet approved',
        'Project without confirmed permission',
        'Project with no tags',
        'Impact section has no verified milestones',
        'Journey milestones panel is empty',
        'Breakdown project not selected (D-09)',
      ]),
    );
  });

  it('blocks draft copy, ® / ™, and the surname in visitor-facing text', () => {
    const c = launchReady();
    const r = runLaunchCheck(
      {
        ...c,
        ui: { x: { a: draft('Hello'), b: approved('Brand™'), c: approved('Devansh Rathi') } },
      },
      html,
    );
    expect(rules(r)).toEqual(
      new Set([
        'Draft copy not yet approved',
        '® or ™ character',
        'Surname in visitor-facing content (D-11)',
      ]),
    );
  });

  it('scans the share-image wording for the surname', () => {
    const c = launchReady();
    const r = runLaunchCheck(
      { ...c, site: { ...c.site, shareImageWording: 'DEVANSH RATHI' } },
      html,
    );
    expect(r.blocking.map((i) => i.detail).join()).toMatch(/shareImageWording/);
  });

  it('allows the surname only in the author meta tag and JSON-LD Person data', () => {
    const ok = `<html><head><title>Devansh</title><meta name="author" content="Devansh Rathi">
      <script type="application/ld+json">{"@type":"Person","name":"Devansh Rathi"}</script></head></html>`;
    expect(runLaunchCheck(launchReady(), ok).blocking).toEqual([]);
    expect(splitIndexHtml(ok).permitted).toHaveLength(2);
    const bad = ok.replace('<title>Devansh</title>', '<title>Devansh Rathi</title>');
    expect(rules(runLaunchCheck(launchReady(), bad))).toEqual(
      new Set(['Surname in visitor-facing content (D-11)']),
    );
    const otherJsonLd =
      '<script type="application/ld+json">{"@type":"WebSite","name":"Devansh Rathi"}</script>';
    expect(rules(runLaunchCheck(launchReady(), otherJsonLd)).size).toBe(1);
  });

  it('does not flag the surname inside non-visitor fields such as file paths', () => {
    const c = launchReady();
    const p = makeProject({
      slug: 'ready',
      cover: image('Cover', {
        sources: { avif: '/assets/devansh-rathi-cover.avif 800w' },
        img: { src: '/assets/devansh-rathi-cover.jpg', w: 800, h: 485 },
      }),
    });
    expect(runLaunchCheck({ ...c, projects: [p] }, html).blocking).toEqual([]);
  });

  it('blocks missing permission, missing tags, missing alt text and unpermitted logos', () => {
    const c = launchReady();
    const p = makeProject({
      slug: 'ready',
      permissionConfirmed: false,
      tags: [],
      cover: { ...image(''), alt: '' },
    });
    const r = runLaunchCheck(
      {
        ...c,
        projects: [p],
        brands: [{ name: 'Logo', logo: image('Logo'), permissionConfirmed: false }],
      },
      html,
    );
    expect(rules(r)).toEqual(
      new Set([
        'Project without confirmed permission',
        'Project with no tags',
        'Content does not match the schema',
        'Logo without confirmed permission',
      ]),
    );
  });

  it('blocks empty Impact/Journey panels without a hide decision, and an unselected D-09', () => {
    const c = launchReady();
    const r = runLaunchCheck(
      {
        ...c,
        impact: { ...c.impact, zeroItemsDecision: 'add-content-before-launch' },
        experience: { ...c.experience, emptyPanelDecision: 'add-content-before-launch' },
      },
      html,
    );
    expect(rules(r)).toEqual(
      new Set(['Impact section has no verified milestones', 'Journey milestones panel is empty']),
    );
  });

  it('reports unverified items as notices, not blockers (they are hidden from the site)', () => {
    const c = launchReady();
    const r = runLaunchCheck(
      { ...c, profile: { ...c.profile, stats: [{ value: '5', label: 'x', verified: false }] } },
      html,
    );
    expect(r.blocking).toEqual([]);
    expect(r.notices.join()).toMatch(/unverified item present/);
  });

  it('notes before/after pairs with different aspect ratios (shown letterboxed, §8.1)', () => {
    const c = launchReady();
    const pair = {
      kind: 'beforeAfter' as const,
      before: image('B', picture(175, 100)),
      after: image('A', picture(150, 100)),
    };
    const r = runLaunchCheck({ ...c, breakdown: { ...c.breakdown, pair } }, html);
    expect(r.blocking).toEqual([]);
    expect(r.notices.join()).toMatch(
      /content\.breakdown\.pair: before\/after aspect ratios differ/,
    );
    const same = { ...pair, after: image('A', picture(350, 200)) };
    expect(
      runLaunchCheck({ ...c, breakdown: { ...c.breakdown, pair: same } }, html).notices.join(),
    ).not.toMatch(/aspect/);
  });
});
