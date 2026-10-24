import React from 'react';
import { ChevronRight, Award } from 'lucide-react';
import { RotationMode } from '../types';

interface HeroScoreCardProps {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  rotationMode: RotationMode;
  onCardClick?: () => void;
}

export const HeroScoreCard: React.FC<HeroScoreCardProps> = ({
  totalMatches,
  totalWins,
  totalLosses,
  rotationMode,
  onCardClick,
}) => {
  const sessionPoints = totalWins * 25 + totalMatches * 10 + 100;
  const modeLabels: Record<RotationMode, string> = {
    balanced: 'Balanced Play',
    winner_stays: 'Winner-Stays',
    king_of_court: 'King of Court',
    social: 'Social Mix',
  };

  return (
    <div
      onClick={onCardClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.99] bg-gradient-to-br from-[#0F382C] via-[#144637] to-[#0A271E] text-white shadow-md border border-[#1b5c49]/40"
    >
      {/* Subtle geometric Pickleball ring accent in background */}
      <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-gradient-to-br from-[#84CC16]/20 to-transparent p-2 pointer-events-none flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border border-lime-400/20 relative">
          <div className="absolute top-2 left-5 w-3.5 h-3.5 rounded-full bg-lime-400/20" />
          <div className="absolute top-8 left-2 w-3.5 h-3.5 rounded-full bg-lime-400/20" />
          <div className="absolute bottom-2 left-6 w-3.5 h-3.5 rounded-full bg-lime-400/20" />
          <div className="absolute top-5 right-3 w-4 h-4 rounded-full bg-lime-400/20" />
        </div>
      </div>

      <div className="p-5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#84CC16]" />
            <span className="text-xs font-semibold text-emerald-200 tracking-wide uppercase">
              Session Performance
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-100/90 bg-white/10 px-2 py-0.5 rounded-md">
            {modeLabels[rotationMode]}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="text-4xl sm:text-5xl font-black text-[#D4E938] tracking-tight font-display">
            {sessionPoints}
          </span>
          <span className="text-sm font-semibold text-emerald-200/80">Group Points</span>
        </div>
      </div>

      {/* Unboxed inline metadata bottom bar */}
      <div className="px-5 py-3 bg-[#081F19]/80 border-t border-white/10 flex items-center justify-between text-xs font-medium text-emerald-200">
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-white font-mono tabular-nums text-sm">{totalMatches}</strong> matches played
          </span>
          <span className="text-emerald-500/40">·</span>
          <span>
            <strong className="text-lime-300 font-mono tabular-nums text-sm">{totalWins}</strong> wins
          </span>
          <span className="text-emerald-500/40">·</span>
          <span>
            <strong className="text-emerald-300 font-mono tabular-nums text-sm">{totalLosses}</strong> losses
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-emerald-300/80 hover:text-white">
          <span>View leaderboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
