import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting Vite debug script...');

async function startViteServer() {
  try {
    const server = await createServer({
      root: __dirname,
      server: {
        port: 3000,
        host: 'localhost',
        strictPort: true,
      },
      logLevel: 'info',
    });

    console.log('Server created, now listening...');

    await server.listen();

    console.log('Server listening!');
    console.log('Resolved URLs:', server.resolvedUrls);

    // Try to access the server
    const http = await import('http');

    setTimeout(() => {
      http
        .get('http://localhost:3000', res => {
          console.log(
            'Successfully connected to server, status:',
            res.statusCode
          );
        })
        .on('error', err => {
          console.error('Failed to connect to server:', err.message);
        });
    }, 1000);

    // Keep process alive
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting Vite server:', error);
    process.exit(1);
  }
}

startViteServer();
