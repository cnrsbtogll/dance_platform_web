import React from 'react';

const Nights = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-pink to-rose-600 bg-clip-text text-transparent leading-tight py-2 inline-block max-w-full">
          Dans Geceleri
        </h1>
        <div className="text-2xl mt-2 text-gray-500 mb-6 font-medium">Çok Yakında!</div>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Şehrinizin en iyi dans gecelerini keşfedin!
          Sosyal dans etkinliklerini takip edin ve dans tutkunlarıyla tanışın.
        </p>
        <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <div className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Beni Haberdar Et
          </div>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl mb-4">🌙</div>
            <h3 className="text-lg font-medium text-gray-900">Dans Geceleri</h3>
            <p className="mt-2 text-sm text-gray-500">Her dans stili için özel sosyal dans geceleri.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl mb-4">🎵</div>
            <h3 className="text-lg font-medium text-gray-900">Canlı Müzik</h3>
            <p className="mt-2 text-sm text-gray-500">DJ'ler ve canlı müzik performansları ile unutulmaz geceler.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl mb-4">✨</div>
            <h3 className="text-lg font-medium text-gray-900">Özel Etkinlikler</h3>
            <p className="mt-2 text-sm text-gray-500">Workshop'lar ve özel dans gösterileri ile dolu geceler.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nights;