import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3002');

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      // Handle health check endpoint separately
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
      }

      // Parse the request URL
      const parsedUrl = parse(req.url, true);

      // Handle the request using Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Frontend ready on http://localhost:${port}`);
      console.log(`> Health check: http://localhost:${port}/health`);
    });
});