---
name: ui-kit-usage
description: Bu projede kullanılan UI Kit / tasarım sistemi kurallarını uygulat; bileşen seçim rehberi, form/list/detail pattern'leri, erişilebilirlik ve tema token'ları ile tutarlı UI üret.
tags: [ui, design-system, components, accessibility, react]
---

## Amaç
Uygulamadaki tüm ekranların aynı görsel/UX diliyle çıkmasını sağlamak.

## Ne zaman kullanılır?
- Yeni sayfa/ekran yapılırken
- “Bu UI’ı tasarım sistemine uygun yap” dendiğinde
- Form, modal, takvim/slot seçimi gibi karmaşık UI’larda

## Projeye özel kaynaklar
- Eğer repoda varsa şu dosyaları referans al:
  - `src/ui/` veya `src/components/`
  - `src/styles/` veya `src/theme/`
  - `src/design-tokens.*`
  - Storybook/Docs sayfaları (varsa)

## Kurallar
1) Yeni bileşen yazmadan önce mevcut bileşenleri ara ve yeniden kullan.
2) Form standardı:
   - Label, error message, helper text yerleşimi aynı olmalı
   - Loading/disabled state’leri belirgin olmalı
3) Liste ve detay standardı:
   - Empty state + error state + skeleton/loading state zorunlu
4) Erişilebilirlik:
   - Klavye ile gezilebilirlik, focus görünürlüğü, uygun aria etiketleri (React’ta)
5) Responsive:
   - Mobil kırılımlarda grid/stack davranışı tutarlı

## Çıktı formatı
- Hangi hazır bileşenler kullanılacak (liste)
- Gerekirse eklenecek yeni bileşen(ler) ve API’leri
- Ekran için state’ler: loading/error/empty/success
- Tasarım sistemiyle uyum notları

## Not
Bu skill UI kit’in adını bilmeden de çalışır; ancak projedeki mevcut komponentleri okuyup onların API’lerine sadık kalır.
