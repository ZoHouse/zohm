#!/usr/bin/env node

/**
 * Simple HTTP server for serving Swagger UI
 * Usage: node server.js [port]
 * Default port: 8000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.argv[2] || 8000;
const baseDir = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.md': 'text/markdown',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Remove query string and decode URL
  let filePath = '.' + req.url.split('?')[0];
  if (filePath === './') {
    filePath = './index.html';
  }

  const fullPath = path.join(baseDir, filePath);
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(fullPath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log(`Swagger UI server running at http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop the server');
});

