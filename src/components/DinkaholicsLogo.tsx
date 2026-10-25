import React from 'react';
import dinkaholicsLogoWebp from '../assets/images/dinkaholics_logo.webp';

interface DinkaholicsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const DinkaholicsLogo: React.FC<DinkaholicsLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  const pixelDimensions = {
    sm: 32,
    md: 44,
    lg: 56,
    xl: 112,
  };

  const roundedMap = {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
  };

  const dim = pixelDimensions[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative ${sizeMap[size]} shrink-0 ${roundedMap[size]} overflow-hidden shadow-md bg-[#0C3827]`}
      >
        <picture>
          <source
            type="image/webp"
            srcSet="/assets/images/dinkaholics_logo_64.webp 64w, /assets/images/dinkaholics_logo_140.webp 140w, /assets/images/dinkaholics_logo_280.webp 280w"
            sizes={
              size === 'xl'
                ? '(max-width: 640px) 96px, 112px'
                : `${dim}px`
            }
          />
          <img
            src={dinkaholicsLogoWebp || '/assets/images/dinkaholics_logo_280.webp'}
            srcSet="/assets/images/dinkaholics_logo_140.webp 1x, /assets/images/dinkaholics_logo_280.webp 2x"
            width={dim}
            height={dim}
            loading="eager"
            decoding="async"
            onError={(e) => {
              e.currentTarget.src = '/assets/images/dinkaholics_logo_280.jpg';
            }}
            alt="Dinkaholics DH Logo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </picture>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 text-lg tracking-tight leading-none font-display">
            Dinkaholics
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-lime-600">
            Pickleball Club
          </span>
        </div>
      )}
    </div>
  );
};

