import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

const app = express();
const port = process.env.PORT || 3101;

interface DirectoryContent {
  name: string;
  type: 'file' | 'directory';
}

app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/*', (req: Request, res: Response) => {
  const requestedPath = path.join('.', req.params[0]);

  // Check if the path exists
  fs.stat(requestedPath, (err, stats) => {
    if (err) {
      return res.status(404).json({ error: 'Path not found' });
    }

    if (stats.isDirectory()) {
      // Serve directory contents as JSON
      fs.readdir(requestedPath, { withFileTypes: true }, (err, files) => {
        if (err) {
          return res.status(500).json({ error: 'Unable to read directory' });
        }

        const directoryContents: DirectoryContent[] = files.map(file => ({
          name: file.name,
          type: file.isDirectory() ? 'directory' : 'file'
        }));

        res.json(directoryContents);
      });
    } else if (stats.isFile()) {
      // Serve the file
      const mimeType = mime.lookup(requestedPath) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      fs.createReadStream(requestedPath).pipe(res);
    } else {
      res.status(400).json({ error: 'Unsupported file type' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
