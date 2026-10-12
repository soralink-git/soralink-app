import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire, builtinModules } from 'node:module';
const require = createRequire(import.meta.url);
// Reuse the esbuild version installed by the pinned Wrangler dependency.
const { build } = createRequire(require.resolve('wrangler'))('esbuild');
await rm('dist/pages', { recursive: true, force: true });
await mkdir('dist/pages', { recursive: true });
await cp('dist/client', 'dist/pages', { recursive: true });
// Publish one module instead of a directory of separately attached RSC chunks.
await build({
  entryPoints: ['dist/server/index.js'],
  outfile: 'dist/pages/_worker.js',
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  conditions: ['workerd', 'browser'],
  minify: true,
  external: ['node:*', 'cloudflare:*', 'workerd:*'],
  plugins: [
    {
      name: 'node-builtins',
      setup(b) {
        b.onResolve({ filter: /.*/ }, (args) =>
          builtinModules.includes(args.path)
            ? {
                path: args.path.startsWith('node:') ? args.path : 'node:' + args.path,
                external: true,
              }
            : undefined,
        );
      },
    },
  ],
});
await writeFile(
  'dist/pages/_routes.json',
  JSON.stringify({
    version: 1,
    include: ['/*'],
    exclude: [
      '/_next/static/*',
      '/assets/*',
      '/icons/*',
      '/favicon.svg',
      '/manifest.webmanifest',
      '/sw.js',
      '/offline.html',
      '/og-soralink.png',
      '/demo-design.svg',
    ],
  }),
);
console.log('Application Pages prête : dist/pages');
