/**
 * MinIO Presigned URL Server
 * Generates presigned PUT URLs for direct browser-to-MinIO uploads.
 * Run alongside Vite dev server: node server/presign.cjs
 */
const express = require('express');
const cors = require('cors');
const Minio = require('minio');

const app = express();
app.use(cors());
app.use(express.json());

// MinIO client — credentials are server-side only
const minioClient = new Minio.Client({
  endPoint: 'minio-sdk.cnrsbtogll.store',
  port: 443,
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

const BUCKET = 'feriha-danceapp';

/**
 * POST /api/presign
 * Body: { objectPath: "public/avatars/user123/1234567890.jpg" }
 * Returns: { uploadUrl, publicUrl }
 */
app.post('/api/presign', async (req, res) => {
  const { objectPath } = req.body;

  if (!objectPath || typeof objectPath !== 'string') {
    return res.status(400).json({ error: 'objectPath is required' });
  }

  // Security: only allow upload to public/ prefix
  if (!objectPath.startsWith('public/')) {
    return res.status(403).json({ error: 'Only public/ paths are allowed' });
  }

  try {
    // Presigned PUT URL valid for 15 minutes
    const uploadUrl = await minioClient.presignedPutObject(BUCKET, objectPath, 15 * 60);
    const publicUrl = `https://minio-sdk.cnrsbtogll.store/${BUCKET}/${objectPath}`;

    res.json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error('Presign error:', err);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PRESIGN_PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ MinIO presign server running on http://localhost:${PORT}`);
});
