import React from 'react';
import { generateInitialsAvatar } from '../../utils/imageUtils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
  userType?: 'student' | 'instructor' | 'school';
}

function Avatar({ src, alt, className = '', userType = 'student' }: AvatarProps) {
  // Check if src is missing or is the default placeholder image
  const isDefaultImage = !src || src.includes('egitmen_default.jpg') || src === '/assets/placeholders/default-instructor.png';

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
      src={src}
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