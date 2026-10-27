import React, { useState, useEffect } from 'react';
import { Match, MatchCandidate, Player, SKILL_LEVEL_LABELS } from '../types';
import {
  Play,
  RotateCw,
  Clock,
  Sparkles,
  Edit3,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { PickleballBounceLoader } from './PickleballBounceLoader';

interface CourtCardProps {
  courtNumber: number;
  courtName: string;
  activeMatch: Match | null;
  recommendedMatch: MatchCandidate | null;
  playersById: Record<string, Player>;
  onStartRecommended: (courtNumber: number, candidate: MatchCandidate) => void;
  onEnterScore: (match: Match) => void;
  onManualCustomMatch: (courtNumber: number) => void;
  onRegenerateRecommendation: (courtNumber: number) => void;
}

export const CourtCard: React.FC<CourtCardProps> = ({
  courtNumber,
  courtName,
  activeMatch,
  recommendedMatch,
  playersById,
  onStartRecommended,
  onEnterScore,
  onManualCustomMatch,
  onRegenerateRecommendation,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  const handleRegenerate = () => {
    setIsRotating(true);
    onRegenerateRecommendation(courtNumber);
    setTimeout(() => setIsRotating(false), 450);
  };

  const handleStart = (candidate: MatchCandidate) => {
    setIsRotating(true);
    setTimeout(() => {
      onStartRecommended(courtNumber, candidate);
      setIsRotating(false);
    }, 350);
  };

  useEffect(() => {
    if (!activeMatch || activeMatch.status !== 'in_progress') {
      setElapsedSeconds(0);
      return;
    }
    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeMatch.startTime) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeMatch]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const getPlayer = (id: string): Player => {
    return (
      playersById[id] || {
        id,
        name: 'Player',
        skillRating: 3,
        totalGamesPlayed: 0,
        wins: 0,
        losses: 0,
        streak: 0,
        status: 'available',
        sessionGamesPlayed: 0,
        sessionWins: 0,
        sessionLosses: 0,
        consecutiveGames: 0,
        lastMatchTime: null,
        waitingSince: null,
        totalWaitingTimeMs: 0,
        teammateHistory: {},
        opponentHistory: {},
      }
    );
  };

  return (
    <div className="pm-card pm-card-hover overflow-hidden flex flex-col justify-between">
      {/* Court Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E0E7E4] bg-[#F6F8F7]">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[#172033] text-sm tracking-tight font-display">{courtName}</h3>
        </div>

        {activeMatch ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#103F32] bg-[#E5F8EC] border border-[#C4EED3] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#35D879] animate-ping" />
              Live #{activeMatch.matchNumber}
            </span>
            <span className={`font-mono tabular-nums px-2 py-0.5 rounded-md flex items-center gap-1 border ${
              elapsedSeconds >= 900
                ? 'bg-amber-50 border-amber-200 text-amber-800 font-semibold'
                : 'text-[#64748B] bg-white border-[#E0E7E4]'
            }`}>
              <Clock className={`w-3 h-3 ${elapsedSeconds >= 900 ? 'text-amber-500' : 'text-[#64748B]'}`} />
              {formatTimer(elapsedSeconds)}
            </span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-[#64748B] bg-[#E0E7E4]/50 border border-[#E0E7E4] px-2.5 py-0.5 rounded-full font-sans">
            Ready for Play
          </span>
        )}
      </div>

      {/* Main Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        {activeMatch ? (
          /* ACTIVE MATCH ON COURT */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 relative">
              {/* VS Divider */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#103F32] text-[#35D879] border-2 border-white flex items-center justify-center text-[10px] font-black shadow-sm">
                VS
              </div>

              {/* Team A */}
              <div className="rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#103F32]">
                  <span>TEAM 1</span>
                  <span className="text-[#64748B] font-mono tabular-nums text-[10px]">
                    Rating {getPlayer(activeMatch.teamA[0]).skillRating + getPlayer(activeMatch.teamA[1]).skillRating}
                  </span>
                </div>
                {activeMatch.teamA.map((id) => {
                  const p = getPlayer(id);
                  return (
                    <div key={id} className="flex items-center justify-between gap-2 text-xs min-w-0">
                      <span className="font-semibold text-[#172033] truncate" title={p.name}>{p.name}</span>
                      <span className="text-[10px] text-[#64748B] font-mono tabular-nums shrink-0">
                        L{p.skillRating}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Team B */}
              <div className="rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#172033]">
                  <span>TEAM 2</span>
                  <span className="text-[#64748B] font-mono tabular-nums text-[10px]">
                    Rating {getPlayer(activeMatch.teamB[0]).skillRating + getPlayer(activeMatch.teamB[1]).skillRating}
                  </span>
                </div>
                {activeMatch.teamB.map((id) => {
                  const p = getPlayer(id);
                  return (
                    <div key={id} className="flex items-center justify-between gap-2 text-xs min-w-0">
                      <span className="font-semibold text-[#172033] truncate" title={p.name}>{p.name}</span>
                      <span className="text-[10px] text-[#64748B] font-mono tabular-nums shrink-0">
                        L{p.skillRating}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Finish & Record Score button */}
            <button
              onClick={() => onEnterScore(activeMatch)}
              className="cssbuttons-io-button w-full justify-center"
            >
              <Trophy className="w-4 h-4 text-[#0A2B22]" />
              <span>Record Score & Next Match</span>
            </button>
          </div>
        ) : (
          /* IDLE COURT: SHOW RECOMMENDED NEXT MATCH */
          <div className="space-y-3">
            {isRotating ? (
              <div className="py-8 px-4 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] flex flex-col items-center justify-center animate-in fade-in duration-150">
                <PickleballBounceLoader
                  size="sm"
                  theme="light"
                  message="Updating Court Lineup..."
                  submessage="Calculating fair pairs and DUPR balance"
                />
              </div>
            ) : recommendedMatch ? (
              <div className="rounded-xl bg-[#E5F8EC]/40 border border-[#C4EED3] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#103F32]">
                    <Sparkles className="w-3.5 h-3.5 text-[#103F32]" />
                    <span>Next Recommended Match</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-[#E0E7E4] text-[#64748B] font-mono tabular-nums">
                      Diff: {recommendedMatch.ratingDiff}
                    </span>
                    <button
                      onClick={handleRegenerate}
                      className="p-1 rounded text-[#64748B] hover:text-[#172033] transition"
                      title="Regenerate alternative matchup"
                      aria-label="Regenerate alternative matchup"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Matchup preview */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-[#E0E7E4]">
                    <div className="text-[10px] font-bold text-[#103F32] mb-1 flex justify-between">
                      <span>TEAM 1</span>
                      <span className="font-mono tabular-nums text-[#64748B]">Tot: {recommendedMatch.teamARating}</span>
                    </div>
                    <div className="space-y-1">
                      {recommendedMatch.teamA.map((id) => (
                        <div key={id} className="text-[#172033] text-[11px] font-medium flex justify-between items-center gap-1 min-w-0">
                          <span className="truncate" title={getPlayer(id).name}>{getPlayer(id).name}</span>
                          <span className="text-[#64748B] font-mono tabular-nums text-[10px] shrink-0">L{getPlayer(id).skillRating}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-[#E0E7E4]">
                    <div className="text-[10px] font-bold text-[#172033] mb-1 flex justify-between">
                      <span>TEAM 2</span>
                      <span className="font-mono tabular-nums text-[#64748B]">Tot: {recommendedMatch.teamBRating}</span>
                    </div>
                    <div className="space-y-1">
                      {recommendedMatch.teamB.map((id) => (
                        <div key={id} className="text-[#172033] text-[11px] font-medium flex justify-between items-center gap-1 min-w-0">
                          <span className="truncate" title={getPlayer(id).name}>{getPlayer(id).name}</span>
                          <span className="text-[#64748B] font-mono tabular-nums text-[10px] shrink-0">L{getPlayer(id).skillRating}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Plain-English Explanation */}
                <div className="text-[11px] text-[#172033] bg-white p-2.5 rounded-lg border border-[#C4EED3] leading-relaxed flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#103F32] shrink-0 mt-0.5" />
                  <span>{recommendedMatch.explanation}</span>
                </div>

                {/* Primary & Secondary Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleStart(recommendedMatch)}
                    className="cssbuttons-io-button flex-1 justify-center"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Match</span>
                  </button>
                  <button
                    onClick={() => onManualCustomMatch(courtNumber)}
                    className="touch-target px-3.5 py-2.5 rounded-xl border border-[#E0E7E4] bg-white text-[#172033] hover:bg-[#F6F8F7] text-xs font-semibold transition active:scale-[0.98] flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Teams</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-4 rounded-xl bg-[#F6F8F7] border border-dashed border-[#E0E7E4]">
                <p className="text-xs font-semibold text-[#172033]">Need 4 Available Players</p>
                <p className="text-[11px] text-[#64748B] mt-0.5 max-w-xs mx-auto">
                  At least 4 available players are required to schedule doubles on this court.
                </p>
                <button
                  onClick={() => onManualCustomMatch(courtNumber)}
                  className="mt-3 px-3.5 py-1.5 rounded-lg border border-[#E0E7E4] bg-white text-xs font-semibold text-[#172033] hover:bg-[#F6F8F7] transition"
                >
                  Manual Selection
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
