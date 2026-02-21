---
name: firestore-veri-modeli
description: Dans okulu uygulaması için Firestore veri modelini tasarla; eğitmen/öğrenci profilleri, dersler, uygunluk (availability), rezervasyonlar ve mesajlaşma koleksiyonlarını sorgu dostu şekilde kurgula.
tags: [firestore, data-model, booking, scheduling, schema]
---

## Amaç
Rezervasyon/scheduling ve eşleştirme sorgularını maliyet ve performans açısından yönetilebilir yapmak.

## Ne zaman kullanılır?
- Yeni koleksiyon/alan eklerken
- “Uygun eğitmenleri bul” veya “müsait saatleri listele” gibi sorgular eklenirken
- Okuma maliyeti/performans sorunları olduğunda

## Önerilen temel koleksiyonlar (başlangıç)
- `users/{uid}`: ortak profil (role: student|instructor|admin), displayName, photoURL, city, createdAt
- `instructors/{uid}`: uzmanlıklar (styles), seviye, ders formatı (online/studio), fiyat, aktif mi
- `students/{uid}`: hedefler, seviye, tercih edilen stiller
- `lessons/{lessonId}`: instructorId, studentId, startAt, endAt, status (requested|confirmed|canceled|completed), price, createdAt
- `availability/{instructorId}_{date}` veya `instructorAvailability/{instructorId}/days/{yyyy-mm-dd}`: slot listesi (proje kararına göre)
- `conversations/{conversationId}`: participantIds [uid...], lastMessageAt
- `conversations/{conversationId}/messages/{messageId}`: senderId, text, createdAt

## Modelleme kuralları
1) Query’yi önce yaz, sonra şemayı seç (hangi ekranda nasıl listeleyeceğiz?).
2) Çok okunacak alanları “liste dokümanında” düz tut; derin nested objelerden kaçın.
3) “Kritik liste ekranları” için index ihtiyacını not et (orderBy + where kombinasyonları).
4) Durum makinesi: lesson status geçişlerini netleştir (kim hangi statüye çekebilir?).

## Availability (müsaitlik) yaklaşımı
- Amaç: “eğitmenin belirli tarihteki slotları” hızlı listelensin.
- Slot çakışması/rezervasyon çakışması riskini işaretle ve gerekirse Cloud Functions ile atomik doğrulama öner.

## Çıktı formatı
- Koleksiyon listesi + alanlar (field list)
- 3 kritik sorgu örneği (örn: eğitmene göre yaklaşan dersler; öğrenciye göre rezervasyonlar; şehir+stil filtreli eğitmen listesi)
- Riskler: çakışma, maliyet, index
