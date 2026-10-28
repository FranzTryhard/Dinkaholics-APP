import React, { useState, useMemo } from 'react';
import { Player, Match, Session } from '../types';
import { Trophy, Flame, Award, ChevronRight, TrendingUp, Swords, HeartHandshake } from 'lucide-react';
import { PlayerDetailModal } from '../components/PlayerDetailModal';

interface LeaderboardViewProps {
  players: Player[];
  matches: Match[];
  session?: Session | null;
  onOpenHeadToHead?: (playerAId?: string, playerBId?: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  players,
  matches,
  session = null,
  onOpenHeadToHead,
}) => {
  const [scope, setScope] = useState<'session' | 'lifetime'>('session');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const playersById = useMemo(() => {
    return players.reduce<Record<string, Player>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [players]);

  const rankedPlayers = [...players].sort((a, b) => {
    const gamesA = scope === 'session' ? a.sessionGamesPlayed : a.totalGamesPlayed;
    const winsA = scope === 'session' ? a.sessionWins : a.wins;

    const gamesB = scope === 'session' ? b.sessionGamesPlayed : b.totalGamesPlayed;
    const winsB = scope === 'session' ? b.sessionWins : b.wins;

    if (gamesA === 0 && gamesB === 0) return b.skillRating - a.skillRating;
    if (gamesA === 0) return 1;
    if (gamesB === 0) return -1;

    const scoreA = ((winsA + 1.5) / (gamesA + 3)) * 80 + Math.min(gamesA, 10) * 2;
    const scoreB = ((winsB + 1.5) / (gamesB + 3)) * 80 + Math.min(gamesB, 10) * 2;
    return scoreB - scoreA;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight flex items-center gap-2 font-display">
            <Trophy className="w-6 h-6 text-[#103F32]" />
            <span>Player Standings & Rankings</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Competitive performance points weighted by win rate, level, and games played
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenHeadToHead && (
            <button
              onClick={() => onOpenHeadToHead()}
              className="touch-target px-3.5 py-1.5 rounded-xl bg-[#103F32] hover:bg-[#0c3127] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Swords className="w-3.5 h-3.5 text-[#84CC16]" />
              <span>Head-to-Head & Synergy Matrix</span>
            </button>
          )}

          {/* Scope Toggle */}
          <div className="inline-flex items-center gap-1 bg-[#F6F8F7] p-1 rounded-xl text-xs font-bold border border-[#E0E7E4]">
            <button
              onClick={() => setScope('session')}
              className={`touch-target px-3.5 py-1.5 rounded-lg transition ${
                scope === 'session'
                  ? 'bg-[#103F32] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Session ({rankedPlayers.filter((p) => p.sessionGamesPlayed > 0).length})
            </button>
            <button
              onClick={() => setScope('lifetime')}
              className={`touch-target px-3.5 py-1.5 rounded-lg transition ${
                scope === 'lifetime'
                  ? 'bg-[#103F32] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              All-Time
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="space-y-3">
        {rankedPlayers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#E0E7E4] space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#E5F8EC] text-[#103F32] flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-[#172033]">No players in roster yet</div>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto">
              Add your players manually in the Players tab to track match records, point differential, and leaderboard ranks.
            </p>
          </div>
        ) : (
          rankedPlayers.map((player, index) => {
          const games = scope === 'session' ? player.sessionGamesPlayed : player.totalGamesPlayed;
          const wins = scope === 'session' ? player.sessionWins : player.wins;
          const losses = scope === 'session' ? player.sessionLosses : player.losses;
          const pts = wins * 25 + games * 10 + player.skillRating * 15;

          const rankBadgeColor =
            index === 0
              ? 'bg-amber-100 text-amber-900 border-amber-300 font-black'
              : index === 1
              ? 'bg-slate-200 text-slate-800 border-slate-300 font-black'
              : index === 2
              ? 'bg-amber-50 text-amber-800 border-amber-200 font-black'
              : 'bg-[#F6F8F7] text-[#64748B] border-[#E0E7E4] font-bold';

          return (
            <div
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              className={`flex items-center justify-between p-4 rounded-2xl bg-white border shadow-xs hover:border-[#103F32]/50 hover:shadow-sm cursor-pointer transition ${
                index === 0 ? 'border-amber-300/80 bg-gradient-to-r from-amber-50/30 to-white' : 'border-[#E0E7E4]'
              }`}
              title="Click to view performance trends & player details"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center font-mono tabular-nums shrink-0 ${rankBadgeColor}`}
                >
                  #{index + 1}
                </span>

                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E0E7E4] shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#E5F8EC] text-[#103F32] font-bold text-sm flex items-center justify-center shrink-0 border border-[#C4EED3]">
                    {player.name.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-[#172033] truncate max-w-[130px] sm:max-w-none" title={player.name}>
                      {player.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E5F8EC] text-[#103F32] border border-[#C4EED3] shrink-0">
                      L{player.skillRating}
                    </span>
                    {player.streak >= 2 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0 whitespace-nowrap shadow-2xs font-mono tabular-nums">
                        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{player.streak}W Streak</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1.5 flex-wrap font-mono tabular-nums">
                    <span className="whitespace-nowrap">{games} {games === 1 ? 'match' : 'matches'}</span>
                    <span className="text-[#64748B]/60">·</span>
                    <span className="text-[#103F32] font-semibold whitespace-nowrap">
                      {wins}W - {losses}L
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-3 text-right">
                <div>
                  <div className="text-sm sm:text-base font-black font-mono tabular-nums text-[#103F32] whitespace-nowrap">
                    {pts} pts
                  </div>
                  <div className="text-[11px] text-[#64748B] whitespace-nowrap font-mono tabular-nums">
                    {games > 0 ? `${Math.round((wins / games) * 100)}% win rate` : 'No matches'}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-[#F6F8F7] text-[#64748B] hover:text-[#103F32] transition shrink-0 hidden xs:block border border-[#E0E7E4]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        }))}
      </div>

      {/* Player Detail View Modal with Recharts Performance Trends */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={players.find((p) => p.id === selectedPlayer.id) || selectedPlayer}
          matches={matches}
          playersById={playersById}
          session={session}
          onClose={() => setSelectedPlayer(null)}
          onOpenHeadToHead={(pId) => {
            setSelectedPlayer(null);
            onOpenHeadToHead?.(pId);
          }}
        />
      )}
    </div>
  );
};
