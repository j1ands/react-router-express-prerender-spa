import express from 'express'
import { createServer as createViteServer } from 'vite'
import path from 'path';
import fs from 'fs';

async function createServer() {
  const app = express()
  const PORT = process.env.PORT || 3000;

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    // don't include Vite's default HTML handling middlewares
    appType: 'custom'
  })
  // Use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use(express.static(path.resolve(__dirname, '../build/client')));

  const htmlTemplate = fs.readFileSync(
    path.resolve(__dirname, '../dist/__spa-fallback.html'), 
    'utf-8'
  );

  app.use('/{*splat}', async (_, res) => {
    // Since `appType` is `'custom'`, should serve response here.
    // Note: if `appType` is `'spa'` or `'mpa'`, Vite includes middlewares
    // to handle HTML requests and 404s so user middlewares should be added
    // before Vite's middlewares to take effect instead
    res.send(htmlTemplate);
  })

  app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`);
  })
}

createServer()