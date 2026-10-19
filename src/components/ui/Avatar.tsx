import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | 'busy';
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusClasses = {
  online: 'bg-emerald-500',
  offline: 'bg-gray-400',
  busy: 'bg-rose-500',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  name,
  size = 'md',
  className = '',
  status,
}) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (text?: string) => {
    if (!text) return 'U';
    const parts = text.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = name || alt;

  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${sizeClasses[size]} ${className}`}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || displayName || 'Avatar'}
          onError={() => setImageError(true)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 font-semibold text-white shadow-xs">
          {getInitials(displayName)}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusClasses[status]}`}
        />
      )}
    </div>
  );
};

export default Avatar;
