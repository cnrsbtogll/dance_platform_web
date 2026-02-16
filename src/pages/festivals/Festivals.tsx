import React, { useState, useEffect } from 'react';
import { TicketSaleForm } from './components/TicketSaleForm';
import { TicketList } from './components/TicketList';
import { useLocation } from 'react-router-dom';

const Festivals = () => {
  const location = useLocation();
  const [showTicketForm, setShowTicketForm] = useState(false);

  // URL'den veya navigation state'inden gelen showTickets değerini kontrol et
  useEffect(() => {
    const state = location.state as { showTickets?: boolean };
    if (state?.showTickets) {
      setShowTicketForm(false);
      // state'i temizle
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-rose-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-pink to-rose-600 bg-clip-text text-transparent leading-tight py-2 inline-block">
            Dans Festivalleri
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Türkiye'nin en kapsamlı dans festivalleri platformu!
            Tüm dans festivallerini tek bir platformda keşfedin.
          </p>
          <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
            <button
              onClick={() => setShowTicketForm(false)}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md ${!showTicketForm ? 'text-white bg-brand-pink hover:bg-rose-700' : 'text-brand-pink bg-white hover:bg-gray-50'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Biletleri Görüntüle
            </button>
            <button
              onClick={() => setShowTicketForm(true)}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md ${showTicketForm ? 'text-white bg-brand-pink hover:bg-rose-700' : 'text-brand-pink bg-white hover:bg-gray-50'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Bilet Sat
            </button>
          </div>
        </div>

        {showTicketForm ? (
          <TicketSaleForm />
        ) : (
          <div id="tickets" className="mt-12">
            <TicketList />
          </div>
        )}
      </div>
    </div>
  );
};

export default Festivals;