---
name: firestore-guvenlik-kurallari
description: Dans okulu uygulamasında Firestore Security Rules için role bazlı erişim (öğrenci/eğitmen/admin) ve sahiplik (owner) kurallarını tasarla; açık okuma/yazmayı engelle.
tags: [firestore, security-rules, auth, roles, custom-claims]
---

## Amaç
Veriyi istemci manipülasyonuna karşı korumak; UI’da gizlemek yetmez, rules ile kilitlemek gerekir.

## Ne zaman kullanılır?
- Yeni koleksiyon eklenince
- “Öğrenci başka öğrencinin dersini görüyor” gibi güvenlik bug’larında
- Admin paneli eklenirken

## Prensipler
- Varsayılan: kapalı (deny), sonra gerekli izinleri aç.
- Owner okuma/yazma: `request.auth.uid` ile doküman sahibini eşle.
- Role bazlı erişim gerekiyorsa: custom claims veya güvenli bir role kaynağı kullan (projeye göre karar). (Admin SDK'nın kuralları bypass ettiğini unutma.) 

## Kontrol listesi
1) `users` dokümanları: kullanıcı sadece kendi profilini yazabilsin; herkese açık alanlar ayrıştırılsın.
2) `lessons`: sadece lesson’ın katılımcıları (instructorId veya studentId) okuyabilsin; status değişimleri role’e göre sınırlandırılsın.
3) `messages`: sadece conversation katılımcıları okuyup yazabilsin.
4) Admin işlemleri: sadece admin rolü yazabilsin (örn. eğitmen onayı, şikayet yönetimi).

## Çıktı formatı
- Rules taslağı (pseudocode kabul) + her koleksiyon için “kim ne yapabilir” tablosu
- Açık riskler (public read/write, privilege escalation)
