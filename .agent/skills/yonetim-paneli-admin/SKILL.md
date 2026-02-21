---
name: yonetim-paneli-admin
description: Admin paneli ihtiyaçlarını ve yetkilerini tasarla; eğitmen onayı, rapor/şikayet yönetimi, içerik moderasyonu ve ayrıcalıklı işlemler için güvenli akış öner.
tags: [admin, moderation, firestore, security]
---

## Amaç
Admin işlemlerini istemci tarafı hilesinden korumak ve izlenebilir yapmak.

## Ne zaman kullanılır?
- Eğitmen onay süreci eklenince
- Şikayet/rapor ve moderasyon gelince
- Admin rol yönetimi yapılırken

## Uygulama adımları
1) Admin rol kaynağını belirle (custom claims vb.) ve rules ile kilitle.
2) Admin aksiyonlarını audit log’la: kim, ne zaman, ne yaptı?
3) Eğitmen onayı: `pending -> approved/rejected` durumları ve görünürlük etkisi.

## Çıktı formatı
- Admin ekran listesi + her ekranın yetkisi
- Güvenlik kontrol listesi + audit önerisi
