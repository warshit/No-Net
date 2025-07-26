const http = require('http');
const fs = require('fs');
const path = require('path');
const { IncomingForm } = require('formidable'); // ✅ Correct import

const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  if (req.url === '/admin' || req.url === '/admin.html') {
    fs.readFile(path.join(__dirname, 'admin.html'), (err, data) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/send') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const { group, message } = JSON.parse(body);
      const logFile = `messages_${group}.txt`;
      fs.appendFileSync(logFile, `${message}\n`);
      res.writeHead(200);
      res.end('Message received');
    });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/messages')) {
    const url = new URL(`http://localhost${req.url}`);
    const group = url.searchParams.get('group');
    const logFile = `messages_${group}.txt`;
    if (fs.existsSync(logFile)) {
      const messages = fs.readFileSync(logFile, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(messages);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('');
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/upload') {
    const form = new IncomingForm({
      multiples: false,
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: 1024 * 1024 * 1024 // 1GB, adjust as needed
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        res.writeHead(500);
        return res.end('Upload Error');
      }

      const uploadedFile = files.file[0] || files.file; // Handle array or single file
      const savedPath = `/uploads/${path.basename(uploadedFile.filepath)}`;
      fs.appendFileSync(`messages_${fields.group}.txt`, `File: ${savedPath}\n`);
      res.writeHead(200);
      res.end('File uploaded');
    });

    return;
  }

  if (req.url.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, req.url);
    if (fs.existsSync(filePath)) {
      const stream = fs.createReadStream(filePath);
      res.writeHead(200);
      stream.pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}/`);
});
