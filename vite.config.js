import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        editor: 'public/assets/js/editor/editor-init.js',
      },
      output: {
        dir: 'public/build',
        entryFileNames: '[name].js',
      },
    },
    outDir: 'public/build',
    emptyOutDir: true,
  }
})
