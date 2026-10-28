import React from 'react';
import { Session, Match, MatchCandidate, Player } from '../types';
import { CourtCard } from '../components/CourtCard';
import { Layers, Tv } from 'lucide-react';

interface CourtsViewProps {
  session: Session;
  players: Player[];
  matches: Match[];
  recommendationsByCourt: Record<number, MatchCandidate | null>;
  onStartRecommended: (courtNumber: number, candidate: MatchCandidate) => void;
  onEnterScore: (match: Match) => void;
  onManualCustomMatch: (courtNumber: number) => void;
  onRegenerateRecommendation: (courtNumber: number) => void;
  onOpenKiosk?: () => void;
}

export const CourtsView: React.FC<CourtsViewProps> = ({
  session,
  players,
  matches,
  recommendationsByCourt,
  onStartRecommended,
  onEnterScore,
  onManualCustomMatch,
  onRegenerateRecommendation,
  onOpenKiosk,
}) => {
  const playersById = React.useMemo(() => {
    return players.reduce<Record<string, Player>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [players]);

  const courts = Array.from({ length: session.courtCount }, (_, i) => i + 1);

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
          {onOpenKiosk && (
            <button
              type="button"
              onClick={onOpenKiosk}
              className="touch-target px-3 py-1.5 rounded-xl bg-[#103F32] hover:bg-[#155443] text-[#35D879] transition flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer"
              title="Launch Clubhouse TV Spectator Kiosk"
            >
              <Tv className="w-4 h-4 text-[#35D879]" />
              <span>Clubhouse TV</span>
            </button>
          )}
          <span className="px-3 py-1.5 rounded-xl bg-[#E5F8EC] text-[#103F32] border border-[#C4EED3] text-xs font-bold font-mono tabular-nums">
            {session.courtCount} Active {session.courtCount === 1 ? 'Court' : 'Courts'}
          </span>
        </div>
      </div>

      {/* Courts List */}
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
    </div>
  );
};
