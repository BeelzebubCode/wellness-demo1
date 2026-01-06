// src/components/shared/Avatar.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const iconSizes = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
};

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  if (src) {
    return (
      <div
        className={cn(
          'relative rounded-full overflow-hidden bg-slate-100',
          sizeClasses[size],
          className
        )}
      >
        <Image
          src={src}
          alt={alt || name || 'Avatar'}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  if (initials) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold',
          sizeClasses[size],
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-slate-200 text-slate-500',
        sizeClasses[size],
        className
      )}
    >
      <User size={iconSizes[size]} />
    </div>
  );
}

export default Avatar;