import React from 'react';
import { Link } from 'react-router-dom';
import { DanceSchool } from '../../../types';
import { generateInitialsAvatar } from '../../utils/imageUtils';
import { FaStar } from 'react-icons/fa';
import { BsBook } from 'react-icons/bs';

interface SchoolCardProps {
  school: DanceSchool;
  className?: string;
}

const SchoolCard: React.FC<SchoolCardProps> = ({ school, className = '' }) => {
  return (
    <Link
      to={`/schools/${school.id}`}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden ${className}`}
    >
      <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden rounded-t-lg">
        {school.photoURL ? (
          <img
            src={school.photoURL}
            alt={school.displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full">
            <img
              src={generateInitialsAvatar(school.displayName, 'school')}
              alt={school.displayName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{school.displayName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{school.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FaStar className="text-yellow-400" />
              <span>{school.rating?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex items-center gap-1">
              <BsBook className="text-blue-500" />
              <span>{school.courseCount || 0} Kurs</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {school.danceStyles?.slice(0, 3).map((style, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
              >
                {style}
              </span>
            ))}
            {school.danceStyles && school.danceStyles.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                +{school.danceStyles.length - 3} daha
              </span>
            )}
          </div>
        </div>
        <div className="mt-6">
          <div className="inline-flex items-center text-brand-pink font-medium">
            Detayları Görüntüle
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SchoolCard; 