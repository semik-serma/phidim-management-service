'use client';

import React, { useState } from 'react';

/**
 * Robust UserAvatar component
 * - Supports Google OAuth profile pictures (with referrerPolicy="no-referrer")
 * - Handles broken URLs / network error fallbacks gracefully
 * - Supports custom image URLs, uploads, or UI Avatars
 */
export default function UserAvatar({
  user,
  size = 'sm', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className = '',
  showBadge = false,
  onClick = null,
}) {
  const [imgError, setImgError] = useState(false);

  const name = user?.full_name || user?.name || user?.email || 'User';
  const rawPicture =
    user?.picture ||
    user?.avatar ||
    user?.profile_picture ||
    user?.profilePicture ||
    user?.image_url ||
    '';

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';

  const sizeClasses = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl font-bold',
    '2xl': 'h-24 w-24 text-2xl font-bold',
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.sm;

  // Fallback high-res generated avatar with Phidim brand colors
  const generatedFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=072A44&color=FFD600&bold=true&format=svg`;

  const pictureSrc = !imgError && rawPicture ? rawPicture : null;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 select-none items-center justify-center rounded-full overflow-hidden border-2 border-[#072A44]/15 bg-[#072A44] shadow-sm ${
        onClick ? 'cursor-pointer hover:ring-2 hover:ring-[#0B5ED7] transition' : ''
      } ${selectedSizeClass} ${className}`}
      title={name}
    >
      {pictureSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pictureSrc}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : rawPicture && imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={generatedFallback}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-extrabold text-[#FFD600] tracking-wider leading-none">
          {initials}
        </span>
      )}

      {showBadge && (
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
          title="Online"
        />
      )}
    </div>
  );
}
