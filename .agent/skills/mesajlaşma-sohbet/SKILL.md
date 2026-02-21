---
name: mesajlasma-sohbet
description: Eğitmen ve öğrencilerin konuşmalarını (conversation) ve mesajlarını Firestore ile tasarla; yetkilendirme, son mesaj özeti, okundu bilgisi ve bildirim ihtiyacını işaretle.
tags: [chat, firestore, conversations, messages, notifications]
---

## Amaç
Mesajlaşmayı ölçeklenebilir ve güvenli yapmak.

## Ne zaman kullanılır?
- DM/sohbet ekranı eklenirken
- “Kim kime yazabilir?” kuralı net değilken
- Bildirim/okundu bilgisi eklenirken

## Uygulama adımları
1) Conversation oluşturma kuralı: iki taraf da eşleşmeye/derse bağlı mı? (projeye göre)
2) `conversations` dokümanında: participantIds + lastMessageAt + lastMessagePreview tut.
3) `messages` alt koleksiyonunda: senderId, text, createdAt; pagination için orderBy createdAt.
4) Okundu bilgisi gerekiyorsa: conversation üzerinde per-user `lastReadAt` alanı tasarla (maliyet/rules etkisini not et).

## Çıktı formatı
- Koleksiyon alanları
- 2 sorgu örneği: kullanıcının konuşmaları; konuşmanın mesajları (pagination)
- Güvenlik notu: sadece participant erişimi
