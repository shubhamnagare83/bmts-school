import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

export const Avatar: React.FC<AvatarProps> = ({ src, alt = 'Avatar', initials, size = 'md', className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-blue-100 text-blue-700 flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold uppercase">{initials || alt.charAt(0) || 'U'}</span>
      )}
    </div>
  );
};
