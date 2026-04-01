import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const useRemoteBindings = process.env.VITE_LOCAL !== 'true';

export default defineConfig({
  server: {
    host: '127.0.0.1',
  },
  plugins: [
    tailwindcss(),
    cloudflare({
      viteEnvironment: { name: 'ssr' },
      experimental: {
        remoteBindings: useRemoteBindings,
      },
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
});
