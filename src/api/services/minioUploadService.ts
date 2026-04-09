/**
 * MinIO S3 Upload Service
 * Uploads files to MinIO S3 via a presigned PUT URL obtained from the presign server.
 */

const PRESIGN_ENDPOINT = '/api/presign';

export interface MinioUploadResult {
  publicUrl: string;
}

/**
 * Compress an image File and return a Blob.
 */
async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        let w = img.width;
        let h = img.height;

        if (w > maxWidth || h > maxHeight) {
          const scale = Math.min(maxWidth / w, maxHeight / h);
          w = Math.floor(w * scale);
          h = Math.floor(h * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not available'));
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Compression failed'));
          },
          'image/jpeg',
          quality,
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('File read failed'));
  });
}

/**
 * Upload a file to MinIO S3.
 * @param file - The File object to upload
 * @param objectPath - MinIO object path, e.g. "public/avatars/user123/photo.jpg"
 * @param compress - Whether to compress image before upload (default: true)
 * @returns MinioUploadResult with the public URL
 */
export async function uploadToMinio(
  file: File,
  objectPath: string,
  compress = true,
): Promise<MinioUploadResult> {
  // 1. Get presigned PUT URL from our server
  const presignRes = await fetch(PRESIGN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectPath }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get presigned URL');
  }

  const { uploadUrl, publicUrl } = await presignRes.json();

  // 2. Optionally compress
  let uploadBlob: Blob = file;
  if (compress && file.type.startsWith('image/')) {
    uploadBlob = await compressImage(file);
  }

  // 3. PUT directly to MinIO
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: uploadBlob,
    headers: {
      'Content-Type': 'image/jpeg',
    },
  });

  if (!uploadRes.ok) {
    throw new Error(`MinIO upload failed: ${uploadRes.status}`);
  }

  return { publicUrl };
}

/**
 * Generate a unique object path for uploads.
 * @param prefix - e.g. "public/avatars" or "public/course-covers"
 * @param userId - user or course ID
 * @param extension - file extension (default: jpg)
 */
export function generateObjectPath(
  prefix: 'public/avatars' | 'public/course-covers',
  userId: string,
  extension = 'jpg',
): string {
  const timestamp = Date.now();
  return `${prefix}/${userId}/${timestamp}.${extension}`;
}
