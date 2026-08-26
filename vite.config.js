import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: '记账助手',
        short_name: '记账',
        description: '个人记账工具',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'https://via.placeholder.com/192x192/4CAF50/FFFFFF?text=App',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'https://via.placeholder.com/512x512/4CAF50/FFFFFF?text=App',
            sizes: '512x512',
            type: 'image/png',
          }
        ]
      }
    })
  ]
});