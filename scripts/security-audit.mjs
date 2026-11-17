// Only an integrity-verified local mitigation may account for the known extglob advisory.
// All other advisories and audit/registry failures remain blocking.
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const expected = {
  '2.3.2': '09a1e05329d59f55aa76163a10a613f33f4ac1c6788441ab54da12617d7b197e',
  '4.0.7': '132b7d13316898ea1d0e5bf040db29c515252ff66aaea14a4c4579a7cbb8a8bb',
};
export async function verifyGlobMitigation() {
  const listed = spawnSync('pnpm', ['list', 'picomatch', '--depth', 'Infinity', '--json'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (listed.status !== 0) throw Error('Cannot enumerate installed glob dependencies');
  const roots = new Set();
  async function walk(node) {
    for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      for (const [name, dependency] of Object.entries(node[field] || {})) {
        if (name === 'picomatch') roots.add(await realpath(dependency.path));
        await walk(dependency);
      }
    }
  }
  for (const node of JSON.parse(listed.stdout)) await walk(node);
  if (roots.size !== 2) throw Error('Both installed picomatch versions must carry the local patch');
  for (const root of roots) {
    const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
    const source = await readFile(path.join(root, 'lib/parse.js'));
    if (createHash('sha256').update(source).digest('hex') !== expected[pkg.version])
      throw Error('picomatch mitigation integrity mismatch');
    const require = createRequire(path.join(root, 'package.json')),
      picomatch = require('./');
    for (const glob of ['+(*)', '+(*a)', '*(a*)', '**/+(*)', '@(+(*a))']) {
      for (const api of [
        () => picomatch(glob),
        () => picomatch.parse(glob),
        () => picomatch.makeRe(glob),
      ]) {
        let rejected = false;
        try {
          api();
        } catch (error) {
          rejected = error.message === 'SORALINK_REPEATED_EXTGLOB_DISABLED';
        }
        if (!rejected) throw Error('Repeated extglob reached regex generation');
      }
    }
    if (!picomatch('**/*.{ts,tsx}')('app/page.tsx'))
      throw Error('Ordinary glob compatibility failed');
  }
  return roots.size;
}
export function blockingAdvisories(report) {
  const known = 'GHSA-fc5q-39xc-vjpf';
  return Object.values(report.advisories || {}).filter((a) => {
    if (a.github_advisory_id !== known && !String(a.url || '').endsWith('/' + known)) return true;
    return (
      a.module_name !== 'picomatch' ||
      !a.findings?.length ||
      a.findings.some((f) => !Object.hasOwn(expected, f.version))
    );
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await verifyGlobMitigation();
  const result = spawnSync('pnpm', ['audit', '--json'], { encoding: 'utf8' });
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw Error('Registry audit did not return valid JSON');
  }
  if (
    result.error ||
    result.status === null ||
    report.error ||
    !report.metadata ||
    !report.advisories
  )
    throw Error('Registry audit unavailable');
  const blocked = blockingAdvisories(report);
  if (blocked.length) {
    console.error(
      JSON.stringify(
        blocked.map((a) => ({ package: a.module_name, severity: a.severity, url: a.url })),
      ),
    );
    process.exitCode = 1;
  } else
    console.log(
      'Security audit: no unmitigated advisories. GHSA-fc5q-39xc-vjpf remains reported upstream; both installed picomatch parsers reject repeated extglobs and match reviewed SHA-256 fingerprints.',
    );
}
