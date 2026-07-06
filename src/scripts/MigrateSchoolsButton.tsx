import React, { useState } from 'react';
import { db } from '../api/firebase/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  writeBatch,
  query
} from 'firebase/firestore';

// Koleksiyon adları
const SOURCE_COLLECTION = 'dansOkullari';
const TARGET_COLLECTION = 'schools';

const MigrateSchoolsButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Migrasyon fonksiyonu
  const migrateSchools = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log(`📦 "${SOURCE_COLLECTION}" koleksiyonundan "${TARGET_COLLECTION}" koleksiyonuna veri taşıma başlatılıyor...`);
      
      // Source koleksiyondan tüm belgeleri çek
      const sourceQuery = query(collection(db, SOURCE_COLLECTION));
      const sourceSnapshot = await getDocs(sourceQuery);
      
      // Belge sayısını kontrol et
      if (sourceSnapshot.empty) {
        const message = `⚠️ "${SOURCE_COLLECTION}" koleksiyonunda belge bulunamadı.`;
        console.log(message);
        setResult({ success: false, message });
        setIsLoading(false);
        return;
      }
      
      console.log(`✅ "${SOURCE_COLLECTION}" koleksiyonunda ${sourceSnapshot.size} belge bulundu.`);
      
      // Firestore batch kullanarak toplu işlem yap (500 belge sınırı var)
      let batch = writeBatch(db);
      let documentsProcessed = 0;
      let batchCount = 1;
      
      for (const sourceDoc of sourceSnapshot.docs) {
        const sourceData = sourceDoc.data();
        const docId = sourceDoc.id;
        
        // Hedef koleksiyonda aynı ID ile belge oluştur
        const targetDocRef = doc(db, TARGET_COLLECTION, docId);
        batch.set(targetDocRef, sourceData);
        
        documentsProcessed++;
        
        // Her 500 belgede bir batch işlemini tamamla (Firestore sınırı)
        if (documentsProcessed % 500 === 0) {
          console.log(`🔄 Batch ${batchCount} işlemi tamamlanıyor (${documentsProcessed} belge)...`);
          await batch.commit();
          batch = writeBatch(db);
          batchCount++;
        }
      }
      
      // Kalan belgeleri işle
      if (documentsProcessed % 500 !== 0) {
        console.log(`🔄 Son batch işlemi tamamlanıyor (toplam ${documentsProcessed} belge)...`);
        await batch.commit();
      }
      
      const successMessage = `✅ Migrasyon tamamlandı. Toplam ${documentsProcessed} belge "${TARGET_COLLECTION}" koleksiyonuna taşındı.`;
      console.log(successMessage);
      setResult({ success: true, message: successMessage });
      
    } catch (error: any) {
      console.error('❌ Migrasyon sırasında hata oluştu:', error);
      setResult({ 
        success: false, 
        message: `Migrasyon sırasında hata: ${error.message || 'Bilinmeyen hata'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-4 p-4 border rounded-lg bg-white dark:bg-slate-800">
      <h3 className="text-xl font-semibold mb-4">Dans Okulları Veri Taşıma</h3>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Bu işlem, <strong>{SOURCE_COLLECTION}</strong> koleksiyonundaki tüm verileri <strong>{TARGET_COLLECTION}</strong> koleksiyonuna taşıyacaktır.
      </p>
      
      <button
        onClick={migrateSchools}
        disabled={true}
        className="px-4 py-2 rounded font-medium bg-gray-400 dark:bg-slate-700 text-gray-200 cursor-not-allowed"
      >
        Veri Taşımayı Başlat (Devre Dışı)
      </button>
      
      {result && (
        <div className={`mt-4 p-3 rounded ${
          result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  );
};

export default MigrateSchoolsButton; 