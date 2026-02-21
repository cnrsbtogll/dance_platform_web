import React from 'react';

interface ProgressTrackingProps {
  schoolInfo?: any;
  instructorId?: string;
  isAdmin?: boolean;
  colorVariant?: 'default' | 'instructor' | 'school';
}

const ProgressTracking: React.FC<ProgressTrackingProps> = ({
  schoolInfo,
  instructorId,
  isAdmin = false,
  colorVariant = 'default'
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Öğrenci İlerleme Durumu</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? 'Öğrencilerin dans eğitimindeki gelişimini takip edin'
              : 'Öğrencilerinizin dans eğitimindeki gelişimini takip edin'}
          </p>
        </div>
      </div>

      <div className={`bg-white shadow-sm border rounded-lg p-6 ${colorVariant === 'school' ? 'dark:bg-[#1a120b] dark:border-[#493322]' : 'dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">İlerleme takibi özelliği yakında aktif olacak</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Bu özellik şu anda geliştirme aşamasındadır.</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracking; 