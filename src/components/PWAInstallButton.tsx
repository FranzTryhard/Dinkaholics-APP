import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone, Check } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide prompt
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`inline-flex items-center gap-2 rounded-xl bg-lime-400 text-slate-950 font-bold hover:bg-lime-300 transition shadow-sm active:scale-95 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        }`}
      >
        <Download className="w-4 h-4 stroke-[2.5]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (or fallback guidance button)
  return (
    <>
      <button
        onClick={() => setShowIOSGuide(true)}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-emerald-700/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 hover:text-lime-300 transition active:scale-95 ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs font-semibold'
        }`}
        title="Install on iPhone / Safari"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>{isIOS ? 'Install on iPhone' : 'Install PWA'}</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-emerald-800/50 p-6 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center mb-4 border border-lime-400/30 shadow-inner">
              <Smartphone className="w-6 h-6 text-lime-400" />
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">Install PickleMatch on iPhone</h3>
            <p className="mt-1 text-xs text-slate-400">
              Run full-screen without Safari browser bars, with instant offline launch from your Home Screen.
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 mt-0.5">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">1. Tap Share in Safari</div>
                  <div className="text-[11px] text-slate-400">Tap the square Share icon at the bottom of Safari.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 mt-0.5">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">2. Select "Add to Home Screen"</div>
                  <div className="text-[11px] text-slate-400">Scroll down the share sheet and tap Add to Home Screen.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <div className="p-1.5 rounded-lg bg-emerald-950 text-lime-400 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">3. Launch from Home Screen</div>
                  <div className="text-[11px] text-slate-400">Enjoy the standalone app experience with safe-area spacing.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-lime-400 text-slate-950 font-bold hover:bg-lime-300 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
