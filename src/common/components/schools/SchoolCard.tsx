import React from 'react';
import { Link } from 'react-router-dom';
import { DanceSchool } from '../../../types';
import { generateInitialsAvatar } from '../../utils/imageUtils';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface SchoolCardProps {
  school: DanceSchool;
  className?: string;
}

const SchoolCard: React.FC<SchoolCardProps> = ({ school, className = '' }) => {
  return (
    <Link to={`/schools/${school.id}`} className={`block h-full ${className}`}>
      <Card noPadding hoverEffect className="h-full flex flex-col overflow-hidden group">
        <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
          <img
            src={school.photoURL || generateInitialsAvatar(school.displayName, 'school')}
            alt={school.displayName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = generateInitialsAvatar(school.displayName, 'school');
            }}
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm z-10">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              {school.rating?.toFixed(1) || '0.0'}
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{school.displayName}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">{school.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {school.danceStyles?.slice(0, 3).map((style, index) => (
              <Badge key={index} variant="secondary" size="sm">
                {style}
              </Badge>
            ))}
            {school.danceStyles && school.danceStyles.length > 3 && (
              <Badge variant="neutral" size="sm">+{school.danceStyles.length - 3}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
            <span className="text-xs text-gray-500 font-medium">
              {school.courseCount || 0} Aktif Kurs
            </span>
            <span className="text-brand-primary text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
              İncele &rarr;
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default SchoolCard;