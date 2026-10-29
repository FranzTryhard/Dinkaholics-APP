import React, { useState, useEffect } from 'react';

interface AppSplashLoaderProps {
  durationMs?: number; // default 3000ms
  onComplete?: () => void;
  allowSkip?: boolean;
}

export const AppSplashLoader: React.FC<AppSplashLoaderProps> = ({
  durationMs = 3000,
  onComplete,
  allowSkip = true,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Start fade out slightly before full duration
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, Math.max(0, durationMs - 400));

    // Fully dismiss and unmount
    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    if (!allowSkip) return;
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white text-[#172033] select-none transition-opacity duration-400 ease-out cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="dialog"
      aria-label="Loading Dinkaholics"
    >
      {/* Background Soft Court Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,248,236,0.65)_0%,rgba(246,248,247,0.45)_55%,#FFFFFF_100%)] pointer-events-none" />

      {/* Decorative Subtle Court Dot Matrix */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#103F32_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full">
        {/* The Bouncing Pickleball / Paddle Loader with Mint Halo Anchor */}
        <div className="py-7 flex items-center justify-center relative">
          <div className="absolute w-28 h-28 rounded-full bg-[#E5F8EC] border border-[#C4EED3]/80 shadow-2xs" />
          <div className="loader loader-paddle-dark scale-[1.7] transform-gpu relative z-10" aria-hidden="true" />
        </div>

        {/* Brand Lockup */}
        <div className="mt-3 space-y-1.5 flex flex-col items-center">
          <h1 className="text-3xl font-black tracking-tight text-[#172033] font-display flex items-center justify-center gap-1">
            <span>DINK</span>
            <span className="text-[#103F32]">AHOLICS</span>
          </h1>

          <p className="text-xs text-[#64748B] font-medium tracking-wide">
            Smart Pickleball Matchmaking & Rotation
          </p>
        </div>

        {/* 3-Second Loading Bar Indicator */}
        <div className="w-48 h-1.5 bg-[#E0E7E4] rounded-full mt-8 overflow-hidden shadow-2xs">
          <div
            className="h-full bg-gradient-to-r from-[#103F32] via-[#22C55E] to-[#84CC16] rounded-full"
            style={{
              animation: `splashProgress ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          />
        </div>

        {/* Touch-Friendly Skip Hint */}
        {allowSkip && (
          <p className="text-[11px] text-[#94A3B8] hover:text-[#64748B] mt-5 font-mono tracking-wider transition-colors">
            Tap anywhere to skip
          </p>
        )}
      </div>

      <style>{`
        @keyframes splashProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
