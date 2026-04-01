import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const useRemoteBindings = process.env.VITE_LOCAL !== 'true';

export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  server: {
    host: '127.0.0.1',
  },
  plugins: [
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
