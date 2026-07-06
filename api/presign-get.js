import Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: 'minio-sdk.cnrsbtogll.store',
  port: 443,
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

const BUCKET = 'feriha-danceapp';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { objectPath } = req.body;

  if (!objectPath || typeof objectPath !== 'string') {
    return res.status(400).json({ error: 'objectPath is required' });
  }

  // Security: only allow private/ and public/ prefixes
  if (!objectPath.startsWith('private/') && !objectPath.startsWith('public/')) {
    return res.status(403).json({ error: 'Invalid path prefix. Must start with private/ or public/' });
  }

  try {
    const url = await minioClient.presignedGetObject(BUCKET, objectPath, 2 * 60 * 60);
    res.status(200).json({ url });
  } catch (err) {
    console.error('Presign GET error:', err);
    res.status(500).json({ error: 'Failed to generate presigned GET URL' });
  }
}
