/**
 * İsimden baş harfleri alır ve avatar oluşturur
 * @param name Kişi veya kurum adı
 * @param userType Kullanıcı türü (öğrenci, eğitmen, okul)
 * @returns Avatar URL'i
 */
export const generateInitialsAvatar = (name: string, userType: 'student' | 'instructor' | 'school' = 'student'): string => {
  // Boş veya undefined isim kontrolü
  if (!name) {
    return `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#6366f1"/><text x="50" y="50" font-family="Arial" font-size="35" fill="white" text-anchor="middle" dy=".3em">?</text></svg>')}`;
  }

  // İsimden baş harfleri al (en fazla 2 harf)
  const initials = name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toLocaleUpperCase('tr-TR'))
    .slice(0, 2)
    .join('');

  // Kullanıcı tipine göre renk seç
  const colors = {
    student: ['#6366f1', '#3b82f6'], // indigo to blue
    instructor: ['#f59e0b', '#ea580c'], // amber to orange
    school: ['#059669', '#0891b2'] // emerald to cyan
  };

  const [startColor, endColor] = colors[userType];

  // SVG oluştur
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${startColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${endColor};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#grad)"/>
    <text x="50" y="50" font-family="Arial" font-size="${initials.length > 1 ? '35' : '40'}" fill="white" text-anchor="middle" dy=".3em">${initials}</text>
  </svg>`;

  // SVG'yi base64'e çevir (UTF-8 karakterleri destekleyecek şekilde)
  const encodedSvg = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encodedSvg}`;
};

/**
 * Kurs için resim URL'ini döndürür. Mobil projedeki mantığa benzer bir yapı kurulmuştur.
 * @param imageUrl Filtrelenmiş veya orijinal görsel yolu
 * @param danceStyle Dans stili (salsa, bachata, vb.)
 * @returns Kullanılabilir resim yolu
 */
export const getCourseImage = (imageUrl?: string, danceStyle?: string): string => {
  // Eğer imageUrl zaten geçerli bir URL ise onu döndür
  if (imageUrl && typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
    return imageUrl;
  }

  // Varsayılan resim haritası (Mobil projedeki lessons klasörü yapısına uygun)
  const styleDefaults: { [key: string]: string } = {
    salsa: '/assets/images/lessons/salsa/salsa-1.jpeg',
    bachata: '/assets/images/lessons/bachata/bachata-1.jpeg',
    kizomba: '/assets/images/lessons/kizomba/kizomba-1.jpeg',
    tango: '/assets/images/lessons/tango/tango-1.jpeg',
    'modern-dans': '/assets/images/lessons/moderndance/moderndance-1.jpeg',
    vals: '/assets/images/lessons/moderndance/moderndance-2.jpeg',
    'hip hop': '/assets/images/lessons/moderndance/moderndance-3.jpeg',
  };

  // Eğer imageUrl boşsa veya varsayılan kurs resimlerinden biriyse, dans stiline göre eşleştir
  const lowerStyle = (danceStyle || '').toLowerCase();
  const isString = typeof imageUrl === 'string';
  
  if (!imageUrl || (isString && imageUrl.includes('kurs'))) {
    // Dans stiline göre eşleştirme yap
    if (lowerStyle.includes('salsa')) return styleDefaults.salsa;
    if (lowerStyle.includes('bachata')) return styleDefaults.bachata;
    if (lowerStyle.includes('kizomba')) return styleDefaults.kizomba;
    if (lowerStyle.includes('tango')) return styleDefaults.tango;
    if (lowerStyle.includes('modern')) return styleDefaults['modern-dans'];
    if (lowerStyle.includes('vals')) return styleDefaults.vals;
    if (lowerStyle.includes('hip hop')) return styleDefaults['hip hop'];
  }

  // Eğer imageUrl geçerli bir string ise döndür, yoksa genel varsayılan (salsa) döndür
  return (isString && imageUrl) ? (imageUrl as string) : styleDefaults.salsa;
};