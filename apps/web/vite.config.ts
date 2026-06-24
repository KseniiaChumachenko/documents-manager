import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const useRemoteBindings = process.env.VITE_LOCAL !== 'true';

const EMPTY_MODULE = new URL('./app/lib/empty-module.ts', import.meta.url).pathname;

// `xlsx-js-style` ships only a minified CJS bundle that does guarded, static
// `require("stream")` / `require("fs")` calls. With no `nodejs_compat` flag,
// workerd leaves those as runtime `__require(...)` shims that throw
// ("Dynamic require of stream is not supported") at import time. The Cloudflare
// worker bundle does not honour `resolve.alias` for these bare builtins, so we
// force-resolve them to an empty module for *every* environment with an
// `enforce: 'pre'` resolver. Our XLSX path (`XLSX.write(.., {type:'array'})`)
// never touches streams or the filesystem, so the stubs are inert.
const STUBBED_BUILTINS = new Set(['stream', 'node:stream', 'fs', 'node:fs']);
function stubNodeBuiltins(): Plugin {
  return {
    name: 'stub-node-builtins',
    enforce: 'pre',
    resolveId(id) {
      return STUBBED_BUILTINS.has(id) ? EMPTY_MODULE : null;
    },
  };
}

// The `enforce: 'pre'` plugin above only runs in Vite's main transform pipeline.
// `xlsx-js-style` is a CJS dep, so Vite hands it to the esbuild dep-optimizer,
// which inlines `require("stream")` into a pre-bundled chunk *before* the main
// pipeline ever sees it — producing a throwing `__require` shim. This esbuild
// plugin runs inside the optimizer itself and rewrites the same builtins to an
// empty module, so no dynamic require survives into the worker.
const stubBuiltinsEsbuildPlugin = {
  name: 'stub-node-builtins-esbuild',
  setup(build: {
    onResolve: (o: { filter: RegExp }, cb: () => { path: string; namespace: string }) => void;
    onLoad: (
      o: { filter: RegExp; namespace: string },
      cb: () => { contents: string; loader: string }
    ) => void;
  }) {
    build.onResolve({ filter: /^(node:)?(stream|fs)$/ }, () => ({
      path: 'stubbed-node-builtin',
      namespace: 'stub-empty',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub-empty' }, () => ({
      contents: 'module.exports = {};',
      loader: 'js',
    }));
  },
};

export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  server: {
    host: '127.0.0.1',
  },
  resolve: {
    alias: {
      fs: new URL('./app/lib/empty-module.ts', import.meta.url).pathname,
      path: new URL('./app/lib/empty-module.ts', import.meta.url).pathname,
      stream: new URL('./app/lib/empty-module.ts', import.meta.url).pathname,
    },
  },
  ssr: {
    resolve: {
      conditions: ['browser', 'default'],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [stubBuiltinsEsbuildPlugin],
    },
  },
  // The Cloudflare worker runs in the "ssr" environment, whose dep-optimizer
  // (`deps_ssr`) is configured by @cloudflare/vite-plugin and does NOT inherit
  // the top-level `optimizeDeps` above. Inject the same stub plugin here so the
  // worker's pre-bundle of `xlsx-js-style` never emits a `require("stream")`.
  environments: {
    ssr: {
      optimizeDeps: {
        esbuildOptions: {
          plugins: [stubBuiltinsEsbuildPlugin],
        },
      },
    },
  },
  plugins: [
    stubNodeBuiltins(),
    tailwindcss(),
    cloudflare({
      configPath: new URL('./wrangler.jsonc', import.meta.url).pathname,
      viteEnvironment: { name: 'ssr' },
      experimental: {
        remoteBindings: useRemoteBindings,
      },
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
});
