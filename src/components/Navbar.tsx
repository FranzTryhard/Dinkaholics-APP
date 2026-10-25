import React from 'react';
import { Session, RotationMode } from '../types';
import { Plus, RotateCcw, Trophy } from 'lucide-react';
import { PickleballIcon } from './PickleballIcon';
import { DinkaholicsLogo } from './DinkaholicsLogo';

interface NavbarProps {
  session: Session | null;
  activeMatchesCount: number;
  currentTab: string;
  onNewSession: () => void;
  onResetDemo: () => void;
  onNavigateTab: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  activeMatchesCount,
  currentTab,
  onNewSession,
  onResetDemo,
  onNavigateTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => onNavigateTab('dashboard')}>
          <DinkaholicsLogo size="md" />

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 text-lg tracking-tight leading-none font-display">
                Dinkaholics
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#0F382C] text-lime-400">
                DH
              </span>
            </div>
            {session ? (
              <div className="text-[11px] text-slate-500 font-medium truncate max-w-[140px] sm:max-w-xs mt-0.5">
                {session.name}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                Matchmaking & Courts
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <button
            onClick={() => onNavigateTab('dashboard')}
            className={`transition-colors whitespace-nowrap py-1 ${
              currentTab === 'dashboard'
                ? 'text-[#0F382C] border-b-2 border-[#0F382C]'
                : 'hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigateTab('courts')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
              currentTab === 'courts'
                ? 'text-[#0F382C] border-b-2 border-[#0F382C]'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Courts</span>
            {activeMatchesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {activeMatchesCount} live
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigateTab('tournament')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
              currentTab === 'tournament'
                ? 'text-[#0F382C] border-b-2 border-[#0F382C]'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Round Robin</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Bracket
            </span>
          </button>
          <button
            onClick={() => onNavigateTab('players')}
            className={`transition-colors whitespace-nowrap py-1 ${
              currentTab === 'players'
                ? 'text-[#0F382C] border-b-2 border-[#0F382C]'
                : 'hover:text-slate-900'
            }`}
          >
            Players & Waiting
          </button>
          <button
            onClick={() => onNavigateTab('history')}
            className={`transition-colors whitespace-nowrap py-1 ${
              currentTab === 'history'
                ? 'text-[#0F382C] border-b-2 border-[#0F382C]'
                : 'hover:text-slate-900'
            }`}
          >
            Match Logs
          </button>
          <button
            onClick={() => onNavigateTab('settings')}
            className={`transition-colors whitespace-nowrap py-1 ${
              currentTab === 'settings'
                ? 'text-[#0F382C] border-b-2 border-[#0F382C]'
                : 'hover:text-slate-900'
            }`}
          >
            Rotation Rules
          </button>
        </nav>

        {/* Primary Action Zone */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNewSession}
            className="touch-target px-3.5 py-2 rounded-xl bg-[#0F382C] text-white font-semibold text-xs hover:bg-[#165342] transition active:scale-95 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            <span>New Session</span>
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
