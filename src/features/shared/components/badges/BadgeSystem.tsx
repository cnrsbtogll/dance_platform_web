import React from 'react';

interface BadgeSystemProps {
  schoolInfo?: any;
  instructorId?: string;
  isAdmin?: boolean;
}

const BadgeSystem: React.FC<BadgeSystemProps> = ({
  schoolInfo,
  instructorId,
  isAdmin = false
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rozet Sistemi</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin 
              ? 'Öğrencilerin başarılarını rozetlerle ödüllendirin'
              : 'Öğrencilerinizin başarılarını rozetlerle ödüllendirin'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 rounded-lg p-6">
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
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Rozet sistemi özelliği yakında aktif olacak</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Bu özellik şu anda geliştirme aşamasındadır.</p>
        </div>
      </div>
    </div>
  );
};

export default BadgeSystem; 