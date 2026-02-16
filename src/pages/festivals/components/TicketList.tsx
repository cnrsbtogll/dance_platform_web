import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';

interface Ticket {
  id: string;
  festivalBilgileri: {
    festivalAdi: string;
    baslangicTarihi: string;
    bitisTarihi: string;
    konum: string;
    aciklama: string;
  };
  fiyatBilgileri: {
    orijinalFiyat: string;
    indirimliFiyat: string;
    indirimOrani: string;
  };
  iletisimBilgileri: {
    telefon: string;
    instagram: string;
  };
  olusturulmaTarihi: any;
  durum: string;
}

export const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Biletleri tarihe göre sıralayarak dinle
    const q = query(
      collection(db, 'tickets'),
      orderBy('olusturulmaTarihi', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      
      setTickets(ticketList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-pink"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Henüz satılık bilet ilanı bulunmuyor.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col h-[400px]"
        >
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-lg font-semibold text-gray-900 flex-1 break-words">
              {ticket.festivalBilgileri.festivalAdi}
            </h3>
            <span className="text-sm font-medium text-green-600 whitespace-nowrap">
              {ticket.fiyatBilgileri.indirimOrani} İndirim
            </span>
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              📍 {ticket.festivalBilgileri.konum}
            </p>
            <p className="text-sm text-gray-600">
              📅 {new Date(ticket.festivalBilgileri.baslangicTarihi).toLocaleDateString('tr-TR')} - {new Date(ticket.festivalBilgileri.bitisTarihi).toLocaleDateString('tr-TR')}
            </p>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto">
            {ticket.festivalBilgileri.aciklama && (
              <p className="text-sm text-gray-600">
                ℹ️ {ticket.festivalBilgileri.aciklama}
              </p>
            )}
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-500 line-through">
              {ticket.fiyatBilgileri.orijinalFiyat}
            </p>
            <p className="text-lg font-semibold text-brand-pink">
              {ticket.fiyatBilgileri.indirimliFiyat}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {ticket.iletisimBilgileri.telefon !== 'Belirtilmedi' && (
                <a
                  href={`tel:${ticket.iletisimBilgileri.telefon.replace(/\s/g, '')}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700 hover:bg-green-100"
                >
                  📞 Ara
                </a>
              )}
              {ticket.iletisimBilgileri.instagram !== 'Belirtilmedi' && (
                <a
                  href={`https://instagram.com/${ticket.iletisimBilgileri.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-50 text-pink-700 hover:bg-pink-100"
                >
                  📱 Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 