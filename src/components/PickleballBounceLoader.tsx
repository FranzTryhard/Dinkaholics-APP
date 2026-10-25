import React, { useEffect, useRef } from 'react';

export interface PickleballBouncePlayer {
  id?: string;
  name: string;
  avatar?: string;
  skillRating?: number;
}

export interface PickleballBounceLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light' | 'emerald';
  message?: string;
  submessage?: string;
  winnerPlayers?: PickleballBouncePlayer[];
  overlay?: boolean;
  fullScreen?: boolean;
  duration?: number; // Duration in milliseconds (e.g. 2000 or 3000)
  onComplete?: () => void;
  className?: string;
}

export const PickleballBounceLoader: React.FC<PickleballBounceLoaderProps> = ({
  size = 'md',
  theme = 'dark',
  message,
  submessage,
  winnerPlayers,
  overlay = false,
  fullScreen = false,
  duration,
  onComplete,
  className = '',
}) => {
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);

  // Keep onCompleteRef updated without re-triggering the timer effect
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Clean, reliable duration timer to automatically transition without manual skip
  useEffect(() => {
    if (!duration || duration <= 0) return;

    hasCompletedRef.current = false;
    const timer = setTimeout(() => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration]);

  // Size scales for font-size / transform
  const scaleStyles = {
    sm: 'scale-75 -my-2',
    md: 'scale-100',
    lg: 'scale-125 my-3',
    xl: 'scale-[2.0] my-6',
  };

  const isDarkPaddle = theme === 'light';

  const loaderVisual = (customScale?: string) => (
    <div className="py-2 flex items-center justify-center relative">
      <div
        className={`loader ${customScale || scaleStyles[size]} ${
          isDarkPaddle ? 'loader-paddle-dark' : ''
        }`}
        aria-hidden="true"
      />
    </div>
  );

  // FULL SCREEN CELEBRATION: Pure simplicity with winning players & the animation
  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 p-6 select-none animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={message || 'Match Complete'}
      >
        <div className="flex flex-col items-center justify-center text-center max-w-sm w-full">
          {/* Simple bounce animation */}
          {loaderVisual('scale-[2.0] my-6')}

          {/* Winners tag */}
          <div className="text-xs uppercase tracking-widest font-black text-[#0cffaa] font-mono mt-2 mb-3">
            Winner{winnerPlayers && winnerPlayers.length > 1 ? 's' : ''}
          </div>

          {/* Winning Players list */}
          {winnerPlayers && winnerPlayers.length > 0 ? (
            <div className="flex items-center justify-center gap-6 my-2">
              {winnerPlayers.map((player, idx) => (
                <div key={player.id || idx} className="flex flex-col items-center">
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#0cffaa] shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-[#0cffaa] text-white font-black text-xl flex items-center justify-center shadow-lg">
                      {player.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-base font-bold text-white mt-2">
                    {player.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              {message}
            </h2>
          )}

          {/* Submessage (score) */}
          {submessage && (
            <p className="text-sm font-medium text-emerald-300/80 mt-3 font-mono">
              {submessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  // STANDARD INLINE OR MODAL CARD
  const loaderContent = (
    <div
      className={`flex flex-col items-center justify-center text-center select-none ${className}`}
      role="status"
      aria-live="polite"
    >
      {loaderVisual()}

      {message && (
        <p
          className={`font-display font-bold tracking-tight mt-2 text-sm ${
            theme === 'dark' || theme === 'emerald'
              ? 'text-white'
              : 'text-slate-800'
          }`}
        >
          {message}
        </p>
      )}

      {submessage && (
        <p
          className={`text-xs mt-0.5 max-w-xs ${
            theme === 'dark' || theme === 'emerald'
              ? 'text-emerald-200/90'
              : 'text-slate-500'
          }`}
        >
          {submessage}
        </p>
      )}
      <span className="sr-only">{message || 'Loading...'}</span>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 animate-in fade-in duration-200">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col items-center max-w-xs w-full">
          {loaderContent}
        </div>
      </div>
    );
  }

  return loaderContent;
};
