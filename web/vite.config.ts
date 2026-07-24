import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolveMapboxBuildToken } from './src/buildConfig';

export default defineConfig(({ mode }) => {
  const mapboxToken = resolveMapboxBuildToken(mode, process.env);

  return {
    root: __dirname,
    plugins: [react()],
    define: {
      'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(mapboxToken),
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
