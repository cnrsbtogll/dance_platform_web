import React from 'react';
import { generateInitialsAvatar, getMinioUrl } from '../../utils/imageUtils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
  userType?: 'student' | 'instructor' | 'school';
}

function Avatar({ src, alt, className = '', userType = 'student' }: AvatarProps) {
  const resolvedSrc = getMinioUrl(src);

  // Check if src is missing or is the default placeholder image
  const isDefaultImage = !resolvedSrc || resolvedSrc.includes('egitmen_default.jpg') || resolvedSrc === '/assets/placeholders/default-instructor.png';

  if (isDefaultImage) {
    return (
      <img
        src={generateInitialsAvatar(alt, userType)}
        alt={alt}
        className={`object-cover rounded-full ${className}`}
      />
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={`object-cover rounded-full ${className}`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null;
        target.src = generateInitialsAvatar(alt, userType);
      }}
    />
  );
}

export default Avatar; 