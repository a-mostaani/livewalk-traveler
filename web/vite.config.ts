import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolveLiveKitBuildUrl, resolveMapboxBuildToken } from './src/buildConfig';

export default defineConfig(({ mode }) => {
  const mapboxToken = resolveMapboxBuildToken(mode, process.env);
  const liveKitWsUrl = resolveLiveKitBuildUrl(mode, process.env);

  return {
    root: __dirname,
    plugins: [react()],
    define: {
      'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(mapboxToken),
      'import.meta.env.VITE_LIVEKIT_WS_URL': JSON.stringify(liveKitWsUrl),
    },
    build: {
      outDir: '../dist-web',
      emptyOutDir: true,
      sourcemap: false,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './vitest.setup.ts',
      css: true,
      restoreMocks: true,
    },
  };
});
