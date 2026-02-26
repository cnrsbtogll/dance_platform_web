---
name: rezervasyon-ders-akisi
description: Eğitmen–öğrenci ders rezervasyonu akışını tasarla; slot seçimi, onay/iptal, çakışma önleme ve bildirim adımlarını netleştir.
tags: [booking, lessons, availability, react, firestore]
---

## Amaç
Ders oluşturma ve saat seçimi akışını tutarlı ve çakışmasız hale getirmek.

## Ne zaman kullanılır?
- Takvim/slot seçimi ekranı yapılırken
- Lesson status geçişleri eklendiğinde
- Çift rezervasyon (double booking) problemi çıktığında

## Akış (öneri)
1) Öğrenci eğitmeni bulur (filtre: şehir, stil, seviye, fiyat).
2) Eğitmenin müsaitlik slotları listelenir.
3) Öğrenci slot seçer -> `lesson` oluştur (status: requested veya pending).
4) Eğitmen onaylar -> status confirmed.
5) İptal/erteleme kuralları (kim, ne zaman, hangi koşulla?).

## Çakışma önleme
- Aynı slot için iki rezervasyon riskini işaretle.
- Gerekirse “transaction/atomik kontrol” veya Cloud Functions ile doğrulama öner (projeye göre).

## Çıktı formatı
- Ekranlar: InstructorProfile -> Availability -> Checkout/Confirm -> LessonDetail
- Firestore yazma adımları (hangi dokümanlar güncellenir)
- Edge-case listesi: timezone, iptal, no-show, tekrar eden ders
