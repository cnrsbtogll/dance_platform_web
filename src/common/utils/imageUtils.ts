/**
 * İsimden baş harfleri alır ve avatar oluşturur
 * @param name Kişi veya kurum adı
 * @param userType Kullanıcı türü (öğrenci, eğitmen, okul)
 * @returns Avatar URL'i
 */
export const generateInitialsAvatar = (name: string, userType: 'student' | 'instructor' | 'school' = 'student'): string => {
  if (!name) {
    name = '?';
  }

  // Define background colors based on userType
  let background = '6366f1'; // default student (indigo)
  if (userType === 'instructor') {
    background = 'f59e0b'; // amber
  } else if (userType === 'school') {
    background = '059669'; // emerald
  }

  // Return ui-avatars URL
  // We use color=fff (white text), size=128 (default), rounded=true so it looks good everywhere
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=fff`;
};

/**
 * Kurs için resim URL'ini döndürür. Mobil projedeki mantığa benzer bir yapı kurulmuştur.
 * @param imageUrl Filtrelenmiş veya orijinal görsel yolu
 * @param danceStyle Dans stili (salsa, bachata, vb.)
 * @returns Kullanılabilir resim yolu
 */
export const getCourseImage = (imageUrl?: string, danceStyle?: string): string => {
  const MINIO_LESSONS_BASE = 'https://minio-sdk.cnrsbtogll.store/feriha-danceapp/public/lessons';

  // Eğer imageUrl zaten geçerli MinIO/http URL ise onu döndür
  if (imageUrl && typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
    return imageUrl;
  }

  // Varsayılan resim haritası — MinIO S3 public/lessons klasöründen okunur
  const styleDefaults: { [key: string]: string } = {
    salsa: `${MINIO_LESSONS_BASE}/salsa/salsa-1.jpeg`,
    bachata: `${MINIO_LESSONS_BASE}/bachata/bachata-1.jpeg`,
    kizomba: `${MINIO_LESSONS_BASE}/kizomba/kizomba-1.jpeg`,
    tango: `${MINIO_LESSONS_BASE}/tango/tango-1.jpeg`,
    'modern-dans': `${MINIO_LESSONS_BASE}/moderndance/moderndance-1.jpeg`,
    moderndance: `${MINIO_LESSONS_BASE}/moderndance/moderndance-1.jpeg`,
    vals: `${MINIO_LESSONS_BASE}/vals/vals-1.jpeg`,
    'hip hop': `${MINIO_LESSONS_BASE}/moderndance/moderndance-3.jpeg`,
  };

  const lowerStyle = (danceStyle || '').toLowerCase();

  // Eski /assets/images/lessons/{folder}/{file} yollarını MinIO'ya çevir
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('/assets/images/lessons/')) {
    // /assets/images/lessons/salsa/salsa-2.jpeg  →  {MINIO_LESSONS_BASE}/salsa/salsa-2.jpeg
    const relativePath = imageUrl.replace('/assets/images/lessons/', '');
    return `${MINIO_LESSONS_BASE}/${relativePath}`;
  }

  // imageUrl boş/placeholder ise dans stiline göre eşleştir
  if (!imageUrl || (typeof imageUrl === 'string' && (imageUrl.includes('kurs') || imageUrl.startsWith('/placeholder')))) {
    if (lowerStyle.includes('salsa')) return styleDefaults.salsa;
    if (lowerStyle.includes('bachata')) return styleDefaults.bachata;
    if (lowerStyle.includes('kizomba')) return styleDefaults.kizomba;
    if (lowerStyle.includes('tango')) return styleDefaults.tango;
    if (lowerStyle.includes('modern')) return styleDefaults['modern-dans'];
    if (lowerStyle.includes('vals')) return styleDefaults.vals;
    if (lowerStyle.includes('hip hop')) return styleDefaults['hip hop'];
    return styleDefaults.salsa; // genel varsayılan
  }

  // Geçerli string ise döndür, aksi halde salsa varsayılanı
  return (typeof imageUrl === 'string' && imageUrl) ? imageUrl : styleDefaults.salsa;
};

/**
 * Resolves a given path to a full MinIO S3 URL if it is a relative path.
 * @param path The file path or full URL
 * @returns Full MinIO URL or the original URL
 */
export const getMinioUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  // If it's already a full HTTP/HTTPS URL or base64 data URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `https://minio-sdk.cnrsbtogll.store/feriha-danceapp/${cleanPath}`;
};

/**
 * Fetches a presigned GET URL for a private or public object path.
 * If the path is already a full URL, returns it immediately.
 * @param path The file path or full URL
 * @returns Promise resolving to the full URL (presigned if private) or null
 */
export const getPresignedUrl = async (path: string | null | undefined): Promise<string | null> => {
  if (!path) return null;
  
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  if (cleanPath.startsWith('private/')) {
    try {
      const res = await fetch('/api/presign-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectPath: cleanPath }),
      });
      
      if (res.ok) {
        const data = await res.json();
        return data.url;
      } else {
        console.error('Failed to get presigned URL:', res.statusText);
      }
    } catch (err) {
      console.error('Error fetching presigned GET URL:', err);
    }
  }
  
  // For public/ paths or fallbacks, use the standard public URL
  return `https://minio-sdk.cnrsbtogll.store/feriha-danceapp/${cleanPath}`;
};