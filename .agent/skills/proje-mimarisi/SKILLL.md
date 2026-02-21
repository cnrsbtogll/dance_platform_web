---
name: proje-mimarisi
description: Dans okulu web uygulaması için React + Firebase mimarisini uygulat; klasör yapısı, feature modülleri, servis katmanı, auth guard ve ortak UI pattern'lerini standartlaştır.
tags: [react, firebase, mimari, feature, routing, ui]
---

## Amaç
Bu projede yeni feature eklerken aynı mimariyi izlemek (okunabilirlik + hız).

## Ne zaman kullanılır?
- Yeni ekran/route ekleneceğinde
- Firebase entegrasyonu UI içine dağılmaya başladığında
- Refactor ve performans düzenlemelerinde

## Mimari kararlar (bu projeye özel)
- Feature bazlı yapı: `src/features/<feature>/...`
- Firebase erişimi sadece `src/services/` ve feature altındaki `data/` katmanından yapılır; component içine direkt SDK çağrısı konmaz.
- UI state: “server state” (Firestore/Functions) ile “local UI state” ayrılır.
- Auth zorunlu sayfalar: route guard + yetki kontrolü (öğrenci/eğitmen/admin).

## Uygulama adımları
1) Yeni feature için klasör iskeleti çıkar: `ui/`, `data/`, `models/`, `hooks/`, `routes.ts`.
2) Firestore/Functions çağrılarını `data/*Service.ts` içine koy.
3) UI komponentlerini “yükleniyor / hata / boş” state’leriyle birlikte yaz.
4) Yetki gerektiren her aksiyonda: hem UI’da gizle, hem Firestore Rules ile kilitle.

## Çıktı formatı
- Oluşturulacak dosya ağacı
- En az 1 örnek service fonksiyonu + 1 örnek UI kullanım
