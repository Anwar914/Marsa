import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
// Builds one self-contained HTML file that works when opened directly (file://)
export default defineConfig({ plugins: [react(), viteSingleFile()], build: { outDir: 'dist-single', chunkSizeWarningLimit: 4000 } });
