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

  // Security: only allow upload to public/ prefix
  if (!objectPath.startsWith('public/')) {
    return res.status(403).json({ error: 'Only public/ paths are allowed' });
  }

  try {
    const uploadUrl = await minioClient.presignedPutObject(BUCKET, objectPath, 15 * 60);
    const publicUrl = `https://minio-sdk.cnrsbtogll.store/${BUCKET}/${objectPath}`;

    res.status(200).json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error('Presign error:', err);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
}
