import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
}

function Avatar({ src, alt, className = '' }: AvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!src) {
    return (
      <div 
        className={`flex items-center justify-center bg-rose-100 text-brand-pink ${className}`}
        title={alt}
      >
        <span className="text-sm font-medium">{getInitials(alt)}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null;
        target.src = '/assets/images/dance/egitmen_default.jpg';
      }}
    />
  );
}

export default Avatar; 