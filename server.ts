import express from 'express'
import path from 'path';
import fs from 'fs';

async function createServer() {
  const app = express()
  const PORT = process.env.PORT || 3000;
  const isDev = process.env.NODE_ENV === 'development';

  app.use(express.static(path.resolve(__dirname, '../build/client')));

  const htmlTemplate = isDev ? null : fs.readFileSync(
    path.resolve(__dirname, '../dist/__spa-fallback.html'), 
    'utf-8'
  );

  app.use('/{*splat}', async (_, res) => {
    if (!isDev) {
      res.send(htmlTemplate);
    } else {
      res.send("Not found").status(404);
    }
  })

  app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`);
  })
}

createServer()