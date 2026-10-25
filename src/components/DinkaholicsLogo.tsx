import React from 'react';
import dinkaholicsLogoImg from '../assets/images/dinkaholics_reclub_style_1792884764544.jpg';

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
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  const roundedMap = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${sizeMap[size]} shrink-0 ${roundedMap[size]} overflow-hidden shadow-sm border border-emerald-800/40 bg-[#0F382C]`}>
        <img
          src={dinkaholicsLogoImg || '/assets/images/dinkaholics_logo.jpg'}
          onError={(e) => {
            e.currentTarget.src = '/assets/images/dinkaholics_logo.jpg';
          }}
          alt="Dinkaholics DH Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
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
