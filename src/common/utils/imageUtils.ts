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