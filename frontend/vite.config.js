import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify("AIzaSyDBTwp5Y2Hl2gC-_nTXIXfc-ioc-YI2F5w"),
        'process.env.GEMINI_API_KEY': JSON.stringify("AIzaSyDBTwp5Y2Hl2gC-_nTXIXfc-ioc-YI2F5w")
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
