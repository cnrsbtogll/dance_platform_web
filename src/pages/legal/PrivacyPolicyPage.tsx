import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gizlilik Politikası
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          <strong>Son Güncelleme:</strong> 12 Şubat 2026
        </p>

        <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
          "Feriha" (bundan böyle "Uygulama" olarak anılacaktır) olarak, gizliliğinize önem veriyor ve kişisel
          verilerinizin güvenliğini sağlamak için gerekli hassasiyeti gösteriyoruz. Bu Gizlilik Politikası,
          Uygulamayı kullanırken hangi verilerin toplandığını, nasıl kullanıldığını ve haklarınızı
          açıklamaktadır.
        </p>

        {/* Section 1 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            1. Toplanan Veriler
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
            Uygulama, hizmet sunabilmek için aşağıdaki veri türlerini toplayabilir:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 pl-2">
            <li>
              <strong>Hesap Bilgileri:</strong> E-posta adresi, ad-soyad (Firebase Auth aracılığıyla).
            </li>
            <li>
              <strong>Profil Bilgileri:</strong> Profil fotoğrafı, eğitmenlik başvurusu sırasında paylaşılan
              belgeler ve bilgiler.
            </li>
            <li>
              <strong>Kullanım Verileri:</strong> Uygulama içindeki etkileşimleriniz, tercihleriniz ve
              ayarlarınız.
            </li>
            <li>
              <strong>Cihaz Bilgileri:</strong> İşletim sistemi versiyonu, cihaz modeli.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            2. Verilerin Kullanım Amacı
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
            Toplanan veriler aşağıdaki amaçlarla kullanılır:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 pl-2">
            <li>Kullanıcı hesaplarının oluşturulması ve yönetilmesi.</li>
            <li>Eğitmenlik başvurularının değerlendirilmesi ve süreç yönetimi.</li>
            <li>Uygulama içi bildirimlerin ve güncellemelerin gönderilmesi.</li>
            <li>Uygulama performansının iyileştirilmesi ve hataların giderilmesi.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            3. Veri Paylaşımı ve Üçüncü Taraflar
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
            Kişisel verileriniz, yasal zorunluluklar haricinde üçüncü şahıslarla paylaşılmaz. Ancak,
            Uygulama aşağıdaki güvenilir hizmet sağlayıcılarını kullanmaktadır:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 pl-2">
            <li>
              <strong>Google Firebase:</strong> Kimlik doğrulama, veritabanı yönetimi ve bulut depolama
              hizmetleri için.
            </li>
            <li>
              <strong>Apple:</strong> Apple ile Giriş Yap seçeneği için.
            </li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">
            Bu servis sağlayıcıların kendi gizlilik politikaları mevcuttur.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            4. Veri Güvenliği
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Verilerinizin güvenliğini sağlamak için endüstri standardı güvenlik önlemleri (SSL şifreleme,
            güvenli sunucular vb.) kullanmaktayız. Ancak internet üzerinden iletilen hiçbir yöntemin %100
            güvenli olmadığını hatırlatmak isteriz.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            5. Kullanıcı Hakları (KVKK/GDPR)
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
            Kullanıcılar olarak aşağıdaki haklara sahipsiniz:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 pl-2">
            <li>Verilerinizin toplanıp toplanmadığını öğrenme.</li>
            <li>Eksik veya yanlış verilerin düzeltilmesini isteme.</li>
            <li>Hesabınızı ve verilerinizi silme talebinde bulunma.</li>
            <li>Veri işleme süreçleri hakkında bilgi alma.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            6. Çocuk Güvenliği Standartları (Child Safety Standards)
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
            Feriha Dance App, platformumuzda çocukların güvenliğini sağlamaya kararlıdır. Çocuğun Cinsel
            İstismarı ve Sömürüsüne (CSAE - Child Sexual Abuse and Exploitation) karşı sıfır tolerans
            politikamız vardır.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 pl-2">
            <li>
              Feriha Dance App üzerinde çocukların cinsel istismarı veya sömürüsünü içeren, teşvik eden
              veya dağıtan hiçbir içeriğe izin verilmez.
            </li>
            <li>
              Bu tür içerikler derhal kaldırılacak ve ilgili hesaplar kalıcı olarak kapatılacaktır.
            </li>
            <li>
              Tespit edilen tüm CSAE içerikleri, yetkili makamlara ve Ulusal Kayıp ve İstismara Uğramış
              Çocuklar Merkezi'ne (NCMEC) bildirilecektir.
            </li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            7. İletişim
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
            Bu Gizlilik Politikası ile ilgili sorularınız veya talepleriniz için lütfen bizimle iletişime
            geçin:
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>E-posta:</strong>{' '}
            <a
              href="mailto:destek@ferihasdance.com"
              className="text-pink-500 hover:text-pink-600 underline transition-colors"
            >
              destek@ferihasdance.com
            </a>{' '}
            (veya uygulama içi destek bölümü)
          </p>
        </section>

        <hr className="border-gray-200 dark:border-gray-700 my-8" />

        <p className="text-gray-500 dark:text-gray-400 text-sm italic leading-relaxed">
          Bu politikayı kullanarak, Uygulama'nın şartlarını ve veri işleme yöntemlerini kabul etmiş
          sayılırsınız.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
