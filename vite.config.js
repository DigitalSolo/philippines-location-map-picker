import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/index.js',
      name: 'PhilippinesLocationMapPicker',
      formats: ['es', 'umd'],
      fileName: (format) => format === 'umd' ? 'location-map-picker.umd.js' : 'location-map-picker.es.js'
    },
    rollupOptions: { output: { assetFileNames: 'location-map-picker.css' } }
  }
});
