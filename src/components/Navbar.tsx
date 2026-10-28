import React from 'react';
import { Session, RotationMode } from '../types';
import { Plus, RotateCcw, Trophy, Sliders, Tv } from 'lucide-react';
import { PickleballIcon } from './PickleballIcon';
import { DinkaholicsLogo } from './DinkaholicsLogo';

interface NavbarProps {
  session: Session | null;
  activeMatchesCount: number;
  currentTab: string;
  onNewSession: () => void;
  onResetDemo: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenKiosk?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  activeMatchesCount,
  currentTab,
  onNewSession,
  onResetDemo,
  onNavigateTab,
  onOpenKiosk,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E0E7E4] transition-all">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => onNavigateTab('dashboard')}>
          <DinkaholicsLogo size="md" />

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[#172033] text-lg tracking-tight leading-none font-display">
                Dinkaholics
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#103F32] text-[#35D879] shadow-2xs">
                DH
              </span>
            </div>
            {session ? (
              <div className="text-[11px] text-[#64748B] font-medium truncate max-w-[140px] sm:max-w-xs mt-0.5">
                {session.name}
              </div>
            ) : (
              <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
                Matchmaking & Courts
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#64748B]">
          <button
            onClick={() => onNavigateTab('dashboard')}
            className={`transition-colors whitespace-nowrap py-1 ${
              currentTab === 'dashboard'
                ? 'text-[#103F32] border-b-2 border-[#103F32] font-bold'
                : 'hover:text-[#172033]'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigateTab('courts')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
              currentTab === 'courts'
                ? 'text-[#103F32] border-b-2 border-[#103F32] font-bold'
                : 'hover:text-[#172033]'
            }`}
          >
            <span>Courts</span>
            {activeMatchesCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#E5F8EC] text-[#103F32] border border-[#C4EED3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35D879] animate-pulse" />
                <span>{activeMatchesCount} live</span>
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigateTab('tournament')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
              currentTab === 'tournament'
                ? 'text-[#103F32] border-b-2 border-[#103F32] font-bold'
                : 'hover:text-[#172033]'
            }`}
          >
            <span>Round Robin</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#E5F8EC] text-[#103F32] border border-[#C4EED3]">
              Bracket
            </span>
          </button>
          <button
            onClick={() => onNavigateTab('players')}
            className={`transition-colors whitespace-nowrap py-1 ${
              currentTab === 'players'
                ? 'text-[#103F32] border-b-2 border-[#103F32] font-bold'
                : 'hover:text-[#172033]'
            }`}
          >
            Players & Waiting
          </button>
          <button
            onClick={() => onNavigateTab('leaderboard')}
            className={`transition-colors whitespace-nowrap py-1 ${
              currentTab === 'leaderboard'
                ? 'text-[#103F32] border-b-2 border-[#103F32] font-bold'
                : 'hover:text-[#172033]'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => onNavigateTab('history')}
            className={`transition-colors whitespace-nowrap py-1 ${
              currentTab === 'history'
                ? 'text-[#103F32] border-b-2 border-[#103F32] font-bold'
                : 'hover:text-[#172033]'
            }`}
          >
            Match Logs
          </button>
          <button
            onClick={() => onNavigateTab('settings')}
            className={`transition-colors whitespace-nowrap py-1 ${
              currentTab === 'settings'
                ? 'text-[#103F32] border-b-2 border-[#103F32] font-bold'
                : 'hover:text-[#172033]'
            }`}
          >
            Rotation Rules
          </button>
        </nav>

        {/* Primary Action Zone */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenKiosk && (
            <button
              type="button"
              onClick={onOpenKiosk}
              className="touch-target px-2.5 py-1.5 rounded-xl bg-[#103F32] hover:bg-[#155443] text-[#35D879] transition flex items-center gap-1.5 font-bold text-xs shadow-2xs cursor-pointer"
              title="Launch Clubhouse TV Spectator Kiosk"
              aria-label="Clubhouse TV Spectator Kiosk"
            >
              <Tv className="w-3.5 h-3.5 text-[#35D879]" />
              <span className="hidden sm:inline">TV Kiosk</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('settings')}
            className={`touch-target p-2 rounded-xl transition ${
              currentTab === 'settings'
                ? 'bg-emerald-50 text-[#0F382C]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Rules & Preferences"
            aria-label="Rules & Preferences"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onNewSession}
            className="cssbuttons-io-button btn-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.2] text-[#35D879]" />
            <span className="hidden xs:inline">New Session</span>
            <span className="xs:hidden">New</span>
          </button>

          <button
            onClick={onResetDemo}
            className="touch-target p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Reset to clean Demo roster"
            aria-label="Reset to clean Demo roster"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
