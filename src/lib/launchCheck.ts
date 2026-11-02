// Launch gate rules (ARCHITECTURE §4.7; PRD §11, §15; AGENTS §13.2).
// Pure function: scripts/check-launch.ts loads the content and index.html and prints the result.

import { isPending } from '../content/pending.ts';
import { assetSize, type ImageRef, type PortfolioContent } from '../content/schema.ts';
import { validateContent, walk } from '../content/validate.ts';

export interface LaunchIssue {
  readonly rule: string;
  readonly detail: string;
}

export interface LaunchReport {
  /** Any blocking issue fails the launch check. */
  readonly blocking: LaunchIssue[];
  /** Checks a script cannot do; a person must confirm them before launch. */
  readonly manual: string[];
  /** Information only (does not block). */
  readonly notices: string[];
}

const SURNAME = /rathi/i;
const MARKS = /[®™]/;

/** String fields that are not visitor-facing: file paths, URLs, ids and internal flags. */
const NON_VISITOR_KEYS = new Set([
  'src',
  'href',
  'url',
  'slug',
  'id',
  'promotedFrom',
  'kind',
  'status',
  'type',
  'lang',
  'key',
  'network',
  'fullNameForMetadata',
  'format',
]);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const lastKey = (path: string) =>
  path
    .replace(/\[\d+\]$/, '')
    .split('.')
    .pop() ?? '';

/** Visitor-facing text in content: every string except file paths, URLs, ids and internal flags. */
function visitorStrings(c: PortfolioContent): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  walk(c, 'content', (v, path) => {
    // Image srcsets (`asset.sources.<format>`) are file paths, not visitor-facing text.
    const isSrcset = /\.sources\.\w+$/.test(path);
    if (typeof v === 'string' && !isSrcset && !NON_VISITOR_KEYS.has(lastKey(path))) {
      out.push({ path, text: v });
    }
  });
  return out;
}

/** index.html split into permitted metadata (author meta, JSON-LD Person) and everything else. */
export function splitIndexHtml(html: string): { permitted: string[]; visitorFacing: string } {
  const permitted: string[] = [];
  const authorMeta = /<meta\s+[^>]*name=["']author["'][^>]*>/gi;
  const jsonLd = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let rest = html.replace(authorMeta, (m) => (permitted.push(m), ''));
  rest = rest.replace(jsonLd, (m, body: string) =>
    /"@type"\s*:\s*"Person"/.test(body) ? (permitted.push(m), '') : m,
  );
  return { permitted, visitorFacing: rest };
}

export function runLaunchCheck(c: PortfolioContent, indexHtml: string): LaunchReport {
  const blocking: LaunchIssue[] = [];
  const notices: string[] = [];
  // Readable paths: content.projects[3] → content.projects.ranka-jewellers
  const readable = (detail: string) =>
    detail.replace(/content\.projects\[(\d+)\]/g, (m, i: string) => {
      const slug = c.projects[Number(i)]?.slug;
      return slug ? `content.projects.${slug}` : m;
    });
  const add = (rule: string, detail: string) => blocking.push({ rule, detail: readable(detail) });

  for (const error of validateContent(c)) add('Content does not match the schema', error);

  walk(c, 'content', (v, path) => {
    if (isPending(v)) add('PENDING content', `${path}: ${v.note}`);
    else if (isRecord(v) && v.status === 'draft' && typeof v.text === 'string') {
      add('Draft copy not yet approved', `${path}: "${v.text}"`);
    } else if (isRecord(v) && v.verified === false) {
      notices.push(`${path}: unverified item present (hidden from the site until verified)`);
    }
  });

  for (const p of c.projects) {
    if (p.permissionConfirmed !== true) {
      add('Project without confirmed permission', `${p.title} (${p.slug})`);
    }
    if (isPending(p.tags) || p.tags.length === 0) add('Project with no tags', p.title);
  }
  if (!isPending(c.brands)) {
    for (const b of c.brands) {
      if (!b.permissionConfirmed) add('Logo without confirmed permission', b.name);
    }
  }

  const strings = visitorStrings(c);
  for (const { path, text } of strings) {
    if (MARKS.test(text)) add('® or ™ character', `${path}: "${text}"`);
    if (SURNAME.test(text)) add('Surname in visitor-facing content (D-11)', `${path}: "${text}"`);
  }
  const html = splitIndexHtml(indexHtml);
  if (MARKS.test(indexHtml)) add('® or ™ character', 'index.html');
  if (SURNAME.test(html.visitorFacing)) {
    add(
      'Surname in visitor-facing content (D-11)',
      'index.html outside the author meta tag and JSON-LD Person data',
    );
  }
  if (html.permitted.length > 0) {
    notices.push(
      `index.html: ${html.permitted.length} permitted metadata block(s) may contain the full name (D-11)`,
    );
  }

  const verifiedMilestones = isPending(c.impact.milestones)
    ? 0
    : c.impact.milestones.filter((m) => m.verified).length;
  if (verifiedMilestones === 0 && c.impact.zeroItemsDecision !== 'hide') {
    add(
      'Impact section has no verified milestones',
      'owner decision needed: hide the section or add content (FR-I4)',
    );
  }
  const verifiedJourney = isPending(c.experience.milestones)
    ? 0
    : c.experience.milestones.filter((m) => m.verified).length;
  if (verifiedJourney === 0 && c.experience.emptyPanelDecision !== 'hide') {
    add(
      'Journey milestones panel is empty',
      'owner decision needed: hide the panel or add content (FR-J5)',
    );
  }
  if (isPending(c.breakdown.project)) {
    add('Breakdown project not selected (D-09)', 'choose after matching images are supplied');
  }

  // Before/after pairs should share an aspect ratio; otherwise they are letterboxed (§8.1).
  walk(c, 'content', (v, path) => {
    if (!isRecord(v) || v.kind !== 'beforeAfter') return;
    const ratio = (img: unknown) => {
      const { width, height } = assetSize((img as ImageRef).asset);
      return width / height;
    };
    if (Math.abs(ratio(v.before) - ratio(v.after)) > 0.01) {
      notices.push(
        `${readable(path)}: before/after aspect ratios differ; shown letterboxed, not stretched`,
      );
    }
  });

  const manual = [
    'Inspect the actual share image by eye: its text must match site.shareImageWording and must not show the surname (ARCHITECTURE §4.7).',
  ];
  return { blocking, manual, notices };
}

/** Plain-English report for the terminal. */
export function formatLaunchReport(report: LaunchReport): string {
  const lines: string[] = [];
  const byRule = new Map<string, string[]>();
  for (const issue of report.blocking) {
    byRule.set(issue.rule, [...(byRule.get(issue.rule) ?? []), issue.detail]);
  }
  lines.push(
    report.blocking.length === 0
      ? 'Launch check: no blocking issues.'
      : `Launch check: BLOCKED — ${report.blocking.length} issue(s) in ${byRule.size} rule(s).`,
  );
  for (const [rule, details] of byRule) {
    lines.push('', `✗ ${rule} (${details.length})`, ...details.map((d) => `  - ${d}`));
  }
  lines.push(
    '',
    'Manual confirmation required before launch:',
    ...report.manual.map((m) => `  ☐ ${m}`),
  );
  if (report.notices.length) {
    lines.push('', 'Notices (not blocking):', ...report.notices.map((n) => `  · ${n}`));
  }
  return lines.join('\n');
}
