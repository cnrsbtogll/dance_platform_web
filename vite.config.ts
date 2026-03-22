import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// SPA fallback plugin — serves index.html for all non-asset requests in preview mode
function spaFallbackPlugin(): Plugin {
  return {
    name: 'spa-fallback',
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        // Let requests for actual files (with an extension) pass through
        if (req.url && /\.\w+$/.test(req.url.split('?')[0])) {
          return next();
        }
        // Rewrite everything else to /index.html
        req.url = '/index.html';
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
})
