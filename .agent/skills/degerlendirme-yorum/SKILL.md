---
name: degerlendirme-yorum
description: Ders sonrası eğitmen değerlendirme/yorum sistemini tasarla; sadece dersi gerçekten alan öğrenci yorum yazabilsin, ortalama puan hesaplama ve suistimal risklerini ele al.
tags: [ratings, reviews, firestore, integrity]
---

## Amaç
Güvenilir bir yorum sistemi (sahte yorumları azaltmak) ve hızlı listeleme.

## Ne zaman kullanılır?
- Eğitmen profiline puan/yorum eklenirken
- “Sadece tamamlanan ders sonrası yorum” kuralı konulurken

## Kurallar
1) Yorum yazma şartı: studentId == request.auth.uid ve lesson status completed olmalı.
2) Listeleme: eğitmen profili sayfasında yorumlar pagination ile gösterilmeli.
3) Ortalama puan: maliyet için “denormalize” alan (ör. instructors/{uid}.ratingAvg, ratingCount) önerilebilir; tutarlılık riskini işaretle.

## Çıktı formatı
- Şema önerisi (reviews koleksiyonu veya instructors altı)
- Yetki ve doğrulama kuralları
- Edge-case: yorum silme/düzenleme, kötüye kullanım/şikayet
