import React from 'react';
import { Session, Match, MatchCandidate, Player } from '../types';
import { CourtCard } from '../components/CourtCard';
import { Layers, Play, UserPlus, Users } from 'lucide-react';

interface CourtsViewProps {
  session?: Session | null;
  players: Player[];
  matches: Match[];
  recommendationsByCourt: Record<number, MatchCandidate | null>;
  onStartRecommended: (courtNumber: number, candidate: MatchCandidate) => void;
  onEnterScore: (match: Match) => void;
  onManualCustomMatch: (courtNumber: number) => void;
  onRegenerateRecommendation: (courtNumber: number) => void;
  onOpenSetupSession?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const CourtsView: React.FC<CourtsViewProps> = ({
  session = null,
  players,
  matches,
  recommendationsByCourt,
  onStartRecommended,
  onEnterScore,
  onManualCustomMatch,
  onRegenerateRecommendation,
  onOpenSetupSession,
  onNavigateTab,
}) => {
  const playersById = React.useMemo(() => {
    return players.reduce<Record<string, Player>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [players]);

  const courts = session ? Array.from({ length: session.courtCount }, (_, i) => i + 1) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight flex items-center gap-2 font-display">
            <Layers className="w-6 h-6 text-[#103F32]" />
            <span>Courts & Assignments</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Monitor live games, record scores, or start recommended doubles matchups.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">

          {session && (
            <span className="px-3 py-1.5 rounded-xl bg-[#E5F8EC] text-[#103F32] border border-[#C4EED3] text-xs font-bold font-mono tabular-nums">
              {session.courtCount} Active {session.courtCount === 1 ? 'Court' : 'Courts'}
            </span>
          )}
        </div>
      </div>

      {/* Courts List or Empty Session State */}
      {!session ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E0E7E4] shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E5F8EC] text-[#103F32] flex items-center justify-center mx-auto border border-[#C4EED3]">
            <Layers className="w-7 h-7 stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-[#172033] font-display">
              No Active Court Session Running
            </h2>
            <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
              {players.length < 4
                ? 'Doubles play requires at least 4 registered players in your roster. Add your club members first to open courts and begin automated rotations.'
                : `Your roster has ${players.length} players ready. Launch an open play session to assign courts and begin match rotations.`}
            </p>
          </div>

          <div className="pt-2">
            {players.length < 4 ? (
              onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('players')}
                  className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#103F32] hover:bg-[#165644] text-white font-bold text-xs shadow-xs transition active:scale-95 border border-[#103F32]/10 mx-auto"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.2] text-[#35D879]" />
                  <span>Go to Players Roster ({players.length} / 4 needed)</span>
                </button>
              )
            ) : (
              onOpenSetupSession && (
                <button
                  type="button"
                  onClick={onOpenSetupSession}
                  className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#103F32] hover:bg-[#165644] text-white font-bold text-xs shadow-xs transition active:scale-95 border border-[#103F32]/10 mx-auto"
                >
                  <Play className="w-4 h-4 stroke-[2.2] fill-[#35D879] text-[#35D879]" />
                  <span>Start New Session</span>
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courts.map((courtNum) => {
            const activeMatchId = session.activeCourtMatches[courtNum];
            const activeMatch = matches.find((m) => m.id === activeMatchId) || null;
            const recommendation = recommendationsByCourt[courtNum] || null;
            const courtName = session.courtNames?.[courtNum] || `Court ${courtNum}`;

            return (
              <CourtCard
                key={courtNum}
                courtNumber={courtNum}
                courtName={courtName}
                activeMatch={activeMatch}
                recommendedMatch={recommendation}
                playersById={playersById}
                onStartRecommended={onStartRecommended}
                onEnterScore={onEnterScore}
                onManualCustomMatch={onManualCustomMatch}
                onRegenerateRecommendation={onRegenerateRecommendation}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
