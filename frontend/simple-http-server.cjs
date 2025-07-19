const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3002;
const host = '0.0.0.0';

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './optimization-demo.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, function (error, content) {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(
          '<h1>404 Not Found</h1><p>File not found: ' + req.url + '</p>',
          'utf-8'
        );
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, host, () => {
  console.log(`🚀 Server running at http://${host}:${port}/`);
  console.log(
    `📱 Access the optimization demo at: http://172.26.93.180:${port}/optimization-demo.html`
  );
  console.log(`📁 Current directory: ${process.cwd()}`);
  console.log(`📋 Available files:`);

  fs.readdir('.', (err, files) => {
    if (!err) {
      files.forEach(file => {
        if (file.endsWith('.html')) {
          console.log(`   📄 http://172.26.93.180:${port}/${file}`);
        }
      });
    }
  });
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.log(
      `❌ Port ${port} is already in use. Trying to kill existing process...`
    );
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
