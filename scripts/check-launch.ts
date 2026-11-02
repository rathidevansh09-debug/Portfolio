// Launch gate runner: `npm run check:launch` (ARCHITECTURE §4.7).
// Loads the content through Vite (so content files that import images resolve exactly as in the
// build), runs the launch rules and exits 1 if anything blocks launch.

import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});

let exitCode = 1;
try {
  const { content } = await server.ssrLoadModule('/src/content/index.ts');
  const { runLaunchCheck, formatLaunchReport } =
    await server.ssrLoadModule('/src/lib/launchCheck.ts');
  const report = runLaunchCheck(content, readFileSync('index.html', 'utf8'));
  console.log(formatLaunchReport(report));
  exitCode = report.blocking.length === 0 ? 0 : 1;
} catch (error) {
  console.error('check:launch could not run:', error);
} finally {
  await server.close();
}
process.exit(exitCode);
