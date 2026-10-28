import React from 'react';
import { DEFAULT_PLAYER_AVATAR } from '../types';

interface PlayerAvatarProps {
  avatar?: string;
  name?: string;
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  avatar,
  name = 'Player',
  className = 'w-10 h-10 rounded-full',
  imgClassName = 'w-full h-full object-cover',
  children,
}) => {
  const displaySrc = avatar && avatar.trim().length > 0 ? avatar : DEFAULT_PLAYER_AVATAR;

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center ${className}`}
    >
      <img
        src={displaySrc}
        alt={name}
        loading="lazy"
        onError={(e) => {
          if (e.currentTarget.src !== DEFAULT_PLAYER_AVATAR) {
            e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
          }
        }}
        className={imgClassName}
      />
      {children}
    </div>
  );
};
