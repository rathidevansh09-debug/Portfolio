// Reference-capture runner. Usage (Node 24 runs TypeScript directly):
//   npm run capture:reference                      # live reference only
//   npm run capture:reference -- --target=both     # reference + local build (needs `npm run preview`)
//   npm run capture:reference -- --target=local --local-url=http://localhost:4173
//   npm run capture:reference -- --only=logo-strip,accordion   # re-record only these videos
// Output: reference-captures/<timestamp>/ (local only, git-ignored). Each run uses a new folder,
// so the baseline is never overwritten.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { BASELINE_VIEWPORTS } from '../e2e/helpers/viewports.ts';
import {
  captureScreens,
  launchCaptureBrowser,
  recordInteraction,
  type CaptureMeta,
  type CaptureTarget,
} from './helpers/capture.ts';
import { LOCAL_INTERACTIONS, REFERENCE_INTERACTIONS } from './helpers/interactions.ts';

export const REFERENCE_URL =
  'https://renando.duingzcreative.site/?utm_source=ig&utm_medium=social&utm_content=link_in_bio';

/** Motion recordings run at the two widths used for side-by-side checks (ARCHITECTURE §6.3). */
const VIDEO_VIEWPORT_NAMES = ['desktop-1440', 'phone-390'];

const { values } = parseArgs({
  options: {
    target: { type: 'string', default: 'reference' },
    'local-url': { type: 'string', default: 'http://localhost:4173' },
    'skip-videos': { type: 'boolean', default: false },
    only: { type: 'string' },
  },
});

/** --only=a,b re-records just those videos and skips screenshots. */
const only = values.only ? values.only.split(',').map((s) => s.trim()) : null;

const targets: CaptureTarget[] =
  values.target === 'both'
    ? ['reference', 'local']
    : values.target === 'local'
      ? ['local']
      : ['reference'];

const capturedAt = new Date().toISOString();
const outDir = join('reference-captures', capturedAt.replace(/:/g, '-').replace(/\..+$/, ''));
mkdirSync(outDir, { recursive: true });

const browser = await launchCaptureBrowser();
const results: CaptureMeta[] = [];
try {
  for (const target of targets) {
    const url = target === 'reference' ? REFERENCE_URL : values['local-url'];
    for (const viewport of only ? [] : BASELINE_VIEWPORTS) {
      console.log(`[${target}] screenshots @ ${viewport.name}`);
      results.push(
        ...(await captureScreens({ browser, target, url, viewport, outDir, capturedAt })),
      );
    }
    if (values['skip-videos']) continue;
    const interactions = target === 'reference' ? REFERENCE_INTERACTIONS : LOCAL_INTERACTIONS;
    for (const viewport of BASELINE_VIEWPORTS.filter((v) =>
      VIDEO_VIEWPORT_NAMES.includes(v.name),
    )) {
      const isPhone = viewport.width <= 600;
      for (const def of interactions) {
        if ((def.desktopOnly && isPhone) || (def.phoneOnly && !isPhone)) continue;
        if (only && !only.includes(def.name)) continue;
        console.log(`[${target}] video ${def.name} @ ${viewport.name}`);
        results.push(
          await recordInteraction({
            browser,
            target,
            url,
            viewport,
            outDir,
            capturedAt,
            name: def.name,
            description: `Covers ${def.covers}`,
            waitForLoad: def.waitForLoad,
            interaction: def.run,
          }),
        );
      }
    }
  }
} finally {
  await browser.close();
}

const count = (status: CaptureMeta['status']) => results.filter((r) => r.status === status).length;
const manifest = {
  capturedAt,
  referenceUrl: REFERENCE_URL,
  targets,
  browser: results[0]?.browser ?? null,
  totals: { ok: count('ok'), missing: count('missing'), failed: count('failed') },
  results,
};
writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `\nSaved to ${outDir} — ok ${manifest.totals.ok}, missing ${manifest.totals.missing}, failed ${manifest.totals.failed}`,
);
for (const r of results.filter((x) => x.status !== 'ok')) {
  console.log(
    `  ${r.status.toUpperCase()}: ${r.target} ${r.kind} ${r.name} @ ${r.viewport.name} — ${r.note ?? ''}`,
  );
}
