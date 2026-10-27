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
      className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.99] bg-gradient-to-br from-[#103F32] via-[#0E382C] to-[#0A2B22] text-white shadow-md border border-[#165644]"
    >
      {/* Subtle geometric Pickleball ring accent in background */}
      <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-gradient-to-br from-[#35D879]/15 to-transparent p-2 pointer-events-none flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border border-[#35D879]/20 relative">
          <div className="absolute top-2 left-5 w-3.5 h-3.5 rounded-full bg-[#35D879]/20" />
          <div className="absolute top-8 left-2 w-3.5 h-3.5 rounded-full bg-[#35D879]/20" />
          <div className="absolute bottom-2 left-6 w-3.5 h-3.5 rounded-full bg-[#35D879]/20" />
          <div className="absolute top-5 right-3 w-4 h-4 rounded-full bg-[#35D879]/20" />
        </div>
      </div>

      <div className="p-5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#35D879]" />
            <span className="text-xs font-semibold text-[#E5F8EC] tracking-wide uppercase">
              Session Performance
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#E5F8EC] bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10">
            {modeLabels[rotationMode]}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="text-4xl sm:text-5xl font-black text-[#35D879] tracking-tight font-display">
            {sessionPoints}
          </span>
          <span className="text-sm font-semibold text-[#E5F8EC]/90">Group Points</span>
        </div>
      </div>

      {/* Metadata bottom bar */}
      <div className="px-5 py-2.5 sm:py-3 bg-[#0A2B22]/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#E5F8EC]/90">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="whitespace-nowrap">
            <strong className="text-white font-mono tabular-nums text-sm">{totalMatches}</strong> matches
          </span>
          <span className="text-[#35D879]/40">·</span>
          <span className="whitespace-nowrap">
            <strong className="text-[#35D879] font-mono tabular-nums text-sm">{totalWins}</strong> wins
          </span>
          <span className="text-[#35D879]/40">·</span>
          <span className="whitespace-nowrap">
            <strong className="text-[#E5F8EC] font-mono tabular-nums text-sm">{totalLosses}</strong> losses
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[#E5F8EC]/80 hover:text-white transition-colors whitespace-nowrap ml-auto sm:ml-0">
          <span>Leaderboard</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        </div>
      </div>
    </div>
  );
};
