import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Custom inline plugin to copy static files to dist/
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    writeBundle() {
      const srcDir = resolve(__dirname, 'src');
      const distDir = resolve(__dirname, 'dist');

      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      // Files to copy directly
      const filesToCopy = [
        'manifest.json',
        'background.js',
        'content.js',
        'content.css',
        'icon.svg'
      ];

      filesToCopy.forEach(file => {
        const srcPath = resolve(srcDir, file);
        const distPath = resolve(distDir, file);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, distPath);
          console.log(`Copied ${file} to dist/`);
        } else {
          console.warn(`Warning: Source file ${srcPath} does not exist`);
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
