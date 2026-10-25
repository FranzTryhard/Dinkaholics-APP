import React, { useState, useEffect } from 'react';
import { Player, SKILL_LEVEL_COLORS, PlayerStatus } from '../types';
import { formatWaitTime, getEffectiveWaitMs } from '../engine/matchmaker';
import { Clock, Coffee, Check, Flame, ChevronRight, UserPlus } from 'lucide-react';

interface WaitingQueueProps {
  players: Player[];
  onToggleStatus: (playerId: string, nextStatus: PlayerStatus) => void;
  className?: string;
  onNavigateToPlayers?: () => void;
}

export const WaitingQueue: React.FC<WaitingQueueProps> = ({
  players,
  onToggleStatus,
  className = '',
  onNavigateToPlayers,
}) => {
  const [now, setNow] = useState(Date.now());

  // Tick timer every 10 seconds for wait times
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const waitingPlayers = players
    .filter((p) => p.status === 'available')
    .sort((a, b) => getEffectiveWaitMs(b, now) - getEffectiveWaitMs(a, now));

  const restingPlayers = players.filter((p) => p.status === 'resting');

  return (
    <div className={`rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#0F382C]" />
          <h3 className="font-bold text-slate-900 text-sm">
            Waiting Queue ({waitingPlayers.length})
          </h3>
        </div>
        {onNavigateToPlayers ? (
          <button
            onClick={onNavigateToPlayers}
            className="text-xs font-semibold text-[#0F382C] hover:underline flex items-center gap-0.5"
          >
            <span>All players</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-[11px] text-slate-400">Fairness-prioritized</span>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {waitingPlayers.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            {players.length === 0 ? (
              <div className="space-y-2 py-1">
                <p className="text-slate-500 font-medium">No players in roster yet.</p>
                {onNavigateToPlayers && (
                  <button
                    type="button"
                    onClick={onNavigateToPlayers}
                    className="touch-target px-3 py-1.5 rounded-lg bg-[#0F382C] text-white text-xs font-bold hover:bg-[#144637] transition inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add Players</span>
                  </button>
                )}
              </div>
            ) : (
              'No players currently waiting. All active players are on court or resting.'
            )}
          </div>
        ) : (
          waitingPlayers.map((p, idx) => {
            const waitMs = getEffectiveWaitMs(p, now);
            const waitStr = formatWaitTime(waitMs);
            const colors = SKILL_LEVEL_COLORS[p.skillRating];

            return (
              <div
                key={p.id}
                className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-400 w-4 text-center">
                    {idx + 1}
                  </span>

                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-bold shrink-0">
                      {p.name.charAt(0)}
                    </div>
                  )}

                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {p.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${colors.bg} ${colors.text}`}>
                        L{p.skillRating}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{p.sessionGamesPlayed} games</span>
                      <span>·</span>
                      <span>{p.sessionWins}W-{p.sessionLosses}L</span>
                      {p.streak >= 2 && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold text-[10px]">
                            <Flame className="w-3 h-3 fill-current" />
                            {p.streak}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#0F382C] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                      {waitStr}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">wait time</div>
                  </div>

                  <button
                    onClick={() => onToggleStatus(p.id, 'resting')}
                    className="touch-target p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/50 transition active:scale-95"
                    title="Take a break (Rest)"
                    aria-label={`Rest ${p.name}`}
                  >
                    <Coffee className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resting Players Drawer */}
      {restingPlayers.length > 0 && (
        <div className="px-4 py-2.5 bg-amber-50/50 border-t border-amber-100/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold shrink-0">
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span>Resting ({restingPlayers.length})</span>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-end">
            {restingPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => onToggleStatus(p.id, 'available')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[11px] font-medium text-slate-700 hover:border-[#0F382C] hover:text-[#0F382C] transition active:scale-95 shadow-2xs"
                title="Tap to return to available queue"
              >
                <span>{p.name}</span>
                <Check className="w-3 h-3 text-[#0F382C]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
