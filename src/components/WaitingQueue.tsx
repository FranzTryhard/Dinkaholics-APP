import React from 'react';
import { Player, SKILL_LEVEL_COLORS, PlayerStatus } from '../types';
import { getEffectiveWaitMs } from '../engine/matchmaker';
import { Users, Coffee, Check, Flame, ChevronRight, UserPlus } from 'lucide-react';

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
  const waitingPlayers = players
    .filter((p) => p.status === 'available')
    .sort((a, b) => getEffectiveWaitMs(b) - getEffectiveWaitMs(a));

  const restingPlayers = players.filter((p) => p.status === 'resting');

  return (
    <div className={`rounded-2xl bg-white border border-[#E0E7E4] shadow-xs overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-[#F6F8F7] border-b border-[#E0E7E4] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#103F32]" />
          <h3 className="font-bold text-[#172033] text-sm">
            Waiting Queue ({waitingPlayers.length})
          </h3>
        </div>
        {onNavigateToPlayers ? (
          <button
            onClick={onNavigateToPlayers}
            className="text-xs font-semibold text-[#103F32] hover:text-[#0A2B22] hover:underline flex items-center gap-0.5"
          >
            <span>All players</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-[11px] text-[#64748B]">Next in rotation</span>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-[#E0E7E4] max-h-80 overflow-y-auto">
        {waitingPlayers.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#64748B]">
            {players.length === 0 ? (
              <div className="space-y-2 py-1">
                <p className="text-[#64748B] font-medium">No players in roster yet.</p>
                {onNavigateToPlayers && (
                  <button
                    type="button"
                    onClick={onNavigateToPlayers}
                    className="cssbuttons-io-button btn-sm mt-1"
                  >
                    <svg
                      height="16"
                      width="16"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" fill="currentColor"></path>
                    </svg>
                    <span>Add Players</span>
                  </button>
                )}
              </div>
            ) : (
              'No players currently waiting. All active players are on court or resting.'
            )}
          </div>
        ) : (
          waitingPlayers.map((p, idx) => {
            const colors = SKILL_LEVEL_COLORS[p.skillRating];

            return (
              <div
                key={p.id}
                className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-[#F6F8F7] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-[#64748B] w-4 text-center tabular-nums">
                    {idx + 1}
                  </span>

                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#E0E7E4]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#E5F8EC] text-[#103F32] text-xs flex items-center justify-center font-bold shrink-0">
                      {p.name.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#172033] truncate max-w-[140px]" title={p.name}>
                        {p.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${colors.bg} ${colors.text} shrink-0`}>
                        L{p.skillRating}
                      </span>
                      {p.streak >= 2 && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold shrink-0 whitespace-nowrap">
                          <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          <span>{p.streak}W</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5 flex-wrap font-mono tabular-nums">
                      <span className="whitespace-nowrap">{p.sessionGamesPlayed} games</span>
                      <span className="text-[#64748B]/60">·</span>
                      <span className="text-[#103F32] font-semibold whitespace-nowrap">{p.sessionWins}W-{p.sessionLosses}L</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onToggleStatus(p.id, 'resting')}
                    className="touch-target p-2 rounded-xl border border-[#E0E7E4] bg-white text-[#64748B] hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50/50 transition active:scale-95"
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
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[11px] font-medium text-[#172033] hover:border-[#103F32] hover:text-[#103F32] transition active:scale-95 shadow-2xs"
                title="Tap to return to available queue"
              >
                <span>{p.name}</span>
                <Check className="w-3 h-3 text-[#103F32]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
