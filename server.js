const http = require('http');
const fs = require('fs');
const path = require('path');

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.fbx': 'application/octet-stream',
    '.bin': 'application/octet-stream',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  }[ext] || 'application/octet-stream';
}

function serveFile(res, filePath, data) {
  res.writeHead(200, {
    'Content-Type': getContentType(filePath),
    'Access-Control-Allow-Origin': '*'
  });
  res.end(data);
}

const server = http.createServer((req, res) => {
  const requestedPath = req.url === '/' ? 'ai-cardiac-atlas-v7.3.4.html' : req.url;
  const filePath = path.join(__dirname, requestedPath);
  const publicPath = path.join(__dirname, 'public', requestedPath);
  
  // Try root first, then public/ folder
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback to public/ directory
      return fs.readFile(publicPath, (err2, data2) => {
        if (err2) {
          res.writeHead(404);
          res.end('File not found');
          return;
        }
        serveFile(res, publicPath, data2);
      });
    }
    serveFile(res, filePath, data);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} for the cardiac atlas`);
});
