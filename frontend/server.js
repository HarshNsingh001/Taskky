import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Railway sets PORT env var — always use it
const PORT = process.env.PORT || 3000;

// Serve static files from the Vite build output
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true,
}));

// SPA fallback — all non-file routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Taskky frontend running on http://0.0.0.0:${PORT}`);
});
