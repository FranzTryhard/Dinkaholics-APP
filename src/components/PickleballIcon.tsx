import React from 'react';

interface PickleballIconProps {
  className?: string;
  size?: number;
}

export const PickleballIcon: React.FC<PickleballIconProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
    >
      {/* Outer Ball with vibrant pickleball volt/lime gradient */}
      <defs>
        <radialGradient id="pballGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F2FF59" />
          <stop offset="100%" stopColor="#C5E627" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#pballGrad)" stroke="#A2C318" strokeWidth="4" />
      
      {/* Holes / Perforations */}
      <circle cx="50" cy="50" r="7.5" fill="#0F382C" />
      <circle cx="34" cy="34" r="6.5" fill="#0F382C" />
      <circle cx="66" cy="34" r="6.5" fill="#0F382C" />
      <circle cx="34" cy="66" r="6.5" fill="#0F382C" />
      <circle cx="66" cy="66" r="6.5" fill="#0F382C" />
      <circle cx="50" cy="22" r="5.5" fill="#0F382C" />
      <circle cx="50" cy="78" r="5.5" fill="#0F382C" />
      <circle cx="22" cy="50" r="5.5" fill="#0F382C" />
      <circle cx="78" cy="50" r="5.5" fill="#0F382C" />
    </svg>
  );
};
