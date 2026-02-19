### **DANS PLATFORMU – TÜM ÖZELLİKLER**  

Dans Platformu, eğitmenler, dans okulları ve öğrenciler için özel olarak tasarlanmış, dans dünyasını bir araya getiren yenilikçi bir platformdur. İşte platformun sunduğu tüm özellikler:  

---

## **🧑‍🏫 EĞİTMENLER İÇİN ÖZELLİKLER**  
Eğitmenler, derslerini yönetebilir, öğrenci takibi yapabilir ve gelir elde edebilir.  

✅ **Eğitmen Paneli** – Kendi kurslarını, öğrencilerini ve takvimini yönet.  
✅ **Kurs Oluşturma & Satış** – Dilediğin dans kurslarını aç, öğrenci al ve kurslarını sat.  
✅ **Öğrenci Takibi** – Kurslarına katılan öğrencilerin ilerlemelerini kontrol et.  
✅ **Yoklama Alma** – Derslere katılımı sistem üzerinden kolayca takip et.  
✅ **Rozet & Başarı Sistemi** – Öğrencilere gelişimlerini ödüllendirmek için rozetler tanımla.  
✅ **Takvim & Ders Programı** – Ders programını oluştur ve yönet.  
✅ **Özel & Grup Dersleri** – Hem bireysel hem de grup dersleri oluştur.  
✅ **Festivaller ve Dans Geceleri** – Etkinlik oluştur, dans festivallerine katıl.  
✅ **Özel Mesajlaşma (Chat)** – Öğrencilerin ve diğer eğitmenlerle iletişim kur.  
✅ **Ödeme Sistemi Entegrasyonu** – Kurslarını satarak gelir elde et.  

---

## **🏫 OKULLAR İÇİN ÖZELLİKLER**  
Dans okulları, eğitmenlerini ve derslerini tek bir çatı altında yönetebilir.  

✅ **Okul Yönetici Paneli** – Tüm okul içi süreçleri yönet.  
✅ **Eğitmen & Öğrenci Yönetimi** – Okulundaki eğitmenleri ve öğrencileri takip et.  
✅ **Ders Programı & Takvim** – Tüm dersleri organize et ve öğrencilere duyur.  
✅ **Kurs Satışı** – Okulun kurslarını platform üzerinden sat.  
✅ **Öğrenci Takip Sistemi** – Katılım ve ilerleme takibi yap.  
✅ **Yoklama Alma** – Derslere katılım durumlarını kaydet.  
✅ **Özel & Grup Dersleri** – Hem bireysel hem de toplu dersler planla.  
✅ **Festivaller & Dans Geceleri Yönetimi** – Etkinlikler düzenle ve duyur.  
✅ **Bilet Satışı & Organizasyon** – Festival ve dans geceleri için bilet satışı yap.  
✅ **Özel Mesajlaşma (Chat)** – Eğitmenler ve öğrencilerle doğrudan iletişim kur.  
✅ **İndirim & Kampanya Yönetimi** – Kurs ve etkinlikler için indirimler tanımla.  

---

## **💃 ÖĞRENCİLER İÇİN ÖZELLİKLER**  
Öğrenciler, dans derslerine katılabilir, eğitmenlerle ve diğer dans severlerle bağlantı kurabilir.  

✅ **Kurs Kaydı & Katılım** – Dilediğin eğitmenin kurslarına kaydol ve dans etmeye başla.  
✅ **Özel Dersler & Grup Dersleri** – İster birebir ister grup halinde ders al.  
✅ **İlerleme Takibi & Rozetler** – Derslerdeki başarılarını ve gelişimini takip et.  
✅ **Eğitmenlerle İletişim (Chat)** – Eğitmeninle platform üzerinden doğrudan mesajlaş.  
✅ **Partner Bulma** – Kendine uygun dans partneri bul ve iletişime geç.  
✅ **Festivaller & Dans Geceleri** – Katılmak istediğin etkinlikleri keşfet ve bilet al.  
✅ **Bilet Alım & Satım** – Festival biletlerini satın al veya kullanmayacağın bileti devret.  
✅ **Dans Okulları & Eğitmenleri Keşfet** – Şehrindeki en iyi dans eğitmenleri ve okullarını bul.  
✅ **Özel Etkinlikler & İndirimler** – Platformdaki özel kampanya ve etkinliklerden yararlan.  

---

🎯 **Dans Platformu ile dans dünyasını keşfet, gelişimini takip et ve dans etmeye hemen başla!**  
📌 **Hemen dene:** [https://dance-platform.vercel.app/](https://dance-platform.vercel.app/)


# Dans Platformu React Template

## Yeni Klasör Yapısı Rehberi

Projenin klasör yapısı yeniden düzenlenmiştir. Bu yeni yapı daha iyi ölçeklenebilirlik ve maintainability sağlamak için özellik/rol tabanlı organizasyon prensiplerini takip eder.

### Yeni Klasör Yapısı

```
/src/
│
├── features/                           # Rol ve özellik bazlı organizasyon
│   ├── admin/                          # Ana admin (süper admin) özellikleri
│   │   ├── components/                 # Admin'e özgü bileşenler
│   │   ├── pages/                      # Admin sayfaları
│   │   └── services/                   # Admin'e özgü servisler
│   │
│   ├── school/                         # Okul yönetim özellikleri
│   │   ├── components/                 # Okul yönetimine özgü bileşenler
│   │   ├── pages/                      # Okul sayfaları
│   │   └── services/                   # Okul yönetimine özgü servisler
│   │
│   ├── instructor/                     # Eğitmen özellikleri
│   │   ├── components/                 # Eğitmene özgü bileşenler
│   │   ├── pages/                      # Eğitmen sayfaları
│   │   └── services/                   # Eğitmene özgü servisler
│   │
│   ├── student/                        # Öğrenci özellikleri
│   │   ├── components/                 # Öğrenciye özgü bileşenler
│   │   ├── pages/                      # Öğrenci sayfaları
│   │   └── services/                   # Öğrenciye özgü servisler
│   │
│   └── auth/                           # Kimlik doğrulama özellikleri
│       ├── components/                 # Giriş, kayıt bileşenleri
│       ├── pages/                      # Giriş, kayıt sayfaları
│       └── services/                   # Kimlik doğrulama servisleri
│
├── common/                             # Tüm roller için ortak
│   ├── components/                     # Genel tekrar kullanılabilir bileşenler
│   │   ├── layout/                     # Sayfa düzeni bileşenleri
│   │   └── ui/                         # UI bileşenleri
│   ├── hooks/                          # Özel React hook'ları 
│   └── utils/                          # Yardımcı fonksiyonlar
│
├── api/                                # API istek yönetimi
│   ├── firebase/                       # Firebase konfigürasyonu
│   └── services/                       # Backend servis istekleri
│
├── contexts/                           # Global state yönetimi
├── types/                              # TypeScript tip tanımlamaları
```

### Taşıma Rehberi

Dosyaları yeni yapıya taşırken aşağıdaki adımları takip edin:

1. **Dosya Kopyalama**
```bash
# Örnek: Bir dosyayı eski konumundan yeni konumuna kopyalama
cp src/components/auth/SignIn.tsx src/features/auth/pages/
```

2. **Import Yollarını Güncelleme**
   - Taşıdığınız dosyadaki import yollarını güncelleyin
   - Aşağıdaki temel yapıyı takip edin:

```typescript
// Eski
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../config/firebase';

// Yeni 
import { useAuth } from '../../../common/hooks/useAuth';
import { db } from '../../../api/firebase/firebase';
```

3. **Klasör Taşıma Eşleştirmesi**

| Eski Konum | Yeni Konum |
|------------|------------|
| `src/components/admin/` | `src/features/admin/components/` |
| `src/components/admin/schoolAdmin/` | `src/features/school/components/` |
| `src/components/instructor/` | `src/features/instructor/components/` |
| `src/components/auth/` | `src/features/auth/components/` |
| `src/components/layout/` | `src/common/components/layout/` |
| `src/components/profile/` | `src/features/student/components/profile/` |
| `src/components/partners/` | `src/features/student/components/partners/` |
| `src/components/progress/` | `src/features/student/components/progress/` |
| `src/components/search/` | `src/features/student/components/search/` |
| `src/components/classes/` | `src/features/student/components/classes/` |
| `src/components/home/` | `src/features/student/pages/` |
| `src/services/authService.ts` | `src/features/auth/services/` |
| `src/services/userService.ts` | `src/api/services/` |
| `src/services/classService.ts` | `src/api/services/` |
| `src/config/firebase.ts` | `src/api/firebase/` |
| `src/hooks/useAuth.ts` | `src/common/hooks/` |

4. **Barrel Dosyaları**
   - Her bileşen klasörü içinde `index.ts` oluşturun
   - Re-export'lar için barrel pattern kullanılabilir:

```typescript
// src/features/school/components/index.ts
export { default as StudentManagement } from './StudentManagement';
export { default as InstructorManagement } from './InstructorManagement';
// ... diğer bileşenler
```

### Taşıma Öncelikleri

1. Önce servis ve util dosyaları taşıyın
2. Ardından ortak bileşenleri (common) taşıyın
3. Son olarak özellik bazlı bileşenleri taşıyın

### İpuçları

- Bir dosyayı taşımadan önce gereklilikleri kontrol edin
- Değişikliklerden sonra test edin
- Circular dependency'lere dikkat edin
- Geçiş süreci boyunca branch kullanın

### Ek Kaynaklar

- Bu dökümantasyon projenin root klasöründe bulunmaktadır
- Sorunlarınız için issue açabilirsiniz

## Lisans

MIT
