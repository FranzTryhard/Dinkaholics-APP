import React, { useState, useEffect } from 'react';
import { Player, Match, Session } from '../types';
import { getEffectiveWaitMs, formatWaitTime } from '../engine/matchmaker';
import { DEFAULT_PLAYER_AVATAR } from '../engine/config';
import {
  Clock,
  Flame,
  Activity,
  Users,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SessionInsightsProps {
  players: Player[];
  matches: Match[];
  session: Session;
  onNavigateToPlayers?: () => void;
}

export const SessionInsights: React.FC<SessionInsightsProps> = ({
  players,
  matches,
  session,
  onNavigateToPlayers,
}) => {
  const [now, setNow] = useState(Date.now());

  // Periodically refresh relative wait times every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Calculate wait times
  const activeQueue = players.filter((p) => p.status === 'available');
  
  // Total wait time experienced by all players currently in the session
  const waitTimesMs = players.map((p) => {
    const currentWait = p.status === 'available' && p.waitingSince ? Math.max(0, now - p.waitingSince) : 0;
    return (p.totalWaitingTimeMs || 0) + currentWait;
  });

  const totalWaitMs = waitTimesMs.reduce((sum, w) => sum + w, 0);
  const avgWaitMs = players.length > 0 ? totalWaitMs / players.length : 0;
  
  // Longest current wait in active queue
  const currentQueueWaits = activeQueue.map((p) => getEffectiveWaitMs(p, now));
  const maxCurrentWaitMs = currentQueueWaits.length > 0 ? Math.max(...currentQueueWaits) : 0;

  // Active players sorted by games played in this session
  const sortedByActivity = [...players].sort((a, b) => {
    if (b.sessionGamesPlayed !== a.sessionGamesPlayed) {
      return b.sessionGamesPlayed - a.sessionGamesPlayed;
    }
    if (b.sessionWins !== a.sessionWins) {
      return b.sessionWins - a.sessionWins;
    }
    return b.totalGamesPlayed - a.totalGamesPlayed;
  });

  const topActivePlayers = sortedByActivity.slice(0, 3);
  const maxGamesPlayed = sortedByActivity[0]?.sessionGamesPlayed || 0;
  const minGamesPlayed = sortedByActivity[sortedByActivity.length - 1]?.sessionGamesPlayed || 0;
  const gameSpread = maxGamesPlayed - minGamesPlayed;

  // Completed matches
  const completedCount = matches.filter((m) => m.status === 'completed').length;
  const activeCourtsCount = Object.values(session.activeCourtMatches).filter(Boolean).length;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0F382C]">
            <Activity className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2 font-display">
              <span>Session Insights</span>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-sans">
                Live Analysis
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Fairness tracking, wait metrics & court workload
            </p>
          </div>
        </div>

        {onNavigateToPlayers && (
          <button
            onClick={onNavigateToPlayers}
            className="text-xs font-semibold text-[#0F382C] hover:underline flex items-center gap-0.5 font-sans"
          >
            <span>All stats</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2-Column Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left Column: Average Wait Time & Queue Pacing */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0F382C]" />
                Average Wait Time
              </span>
              <span className="text-[10px] font-mono tabular-nums text-slate-400">Session Avg</span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-[#0F382C] tracking-tight">
                {formatWaitTime(avgWaitMs)}
              </span>
              <span className="text-xs font-medium text-slate-500">per player</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Max in queue now:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatWaitTime(maxCurrentWaitMs)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Waiting queue count:</span>
              <span className="font-mono font-bold text-[#0F382C]">
                {activeQueue.length} {activeQueue.length === 1 ? 'player' : 'players'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Queue pacing:</span>
              <span className="font-semibold text-emerald-700">
                {avgWaitMs < 600000 ? 'Optimal Rotation' : 'Busy Session'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Court Utilization & Rotation Balance */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#0F382C]" />
                Court & Rotation Fairness
              </span>
              <span className="text-[10px] font-mono text-slate-400">Pacing</span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-[#0F382C] tracking-tight">
                {activeCourtsCount}/{session.courtCount}
              </span>
              <span className="text-xs font-medium text-slate-500">Courts in Action</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Completed doubles:</span>
              <span className="font-mono font-bold text-slate-800">
                {completedCount} {completedCount === 1 ? 'match' : 'matches'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Game distribution gap:</span>
              <span className="font-mono font-bold text-slate-800">
                ±{gameSpread} {gameSpread === 1 ? 'game' : 'games'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Fairness status:</span>
              <span className={`font-semibold ${gameSpread <= 1 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {gameSpread <= 1 ? 'Even Play Time' : 'Rebalancing Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Most Active Players Spotlight */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Most Active Players This Session</span>
          </div>
          <span className="text-[11px] text-slate-400">By games played</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {topActivePlayers.map((player, idx) => {
            const winRate =
              player.sessionGamesPlayed > 0
                ? Math.round((player.sessionWins / player.sessionGamesPlayed) * 100)
                : 0;

            return (
              <div
                key={player.id}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={player.avatar || DEFAULT_PLAYER_AVATAR}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
                      }}
                      alt={player.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {player.name}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-[#0F382C] bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                    L{player.skillRating}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">
                    <strong className="font-mono text-[#0F382C]">{player.sessionGamesPlayed}</strong> games
                  </span>
                  <span className="text-slate-400">
                    {player.sessionWins}W - {player.sessionLosses}L ({winRate}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
