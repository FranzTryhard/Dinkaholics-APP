import React, { useState, useMemo } from 'react';
import { Player, Match } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { TrendingUp, Award, Flame, Scale, Minus } from 'lucide-react';

interface PlayerPerformanceTrendsChartProps {
  player: Player;
  matches: Match[];
  playersById: Record<string, Player>;
  currentSessionId?: string;
}

export type TrendMetricMode = 'winRate' | 'momentum' | 'pointDiff';

interface MatchPointData {
  matchNumber: number;
  matchIndex: number;
  matchLabel: string;
  matchId: string;
  courtName: string;
  result: 'W' | 'L';
  isWin: boolean;
  playerScore: number;
  opponentScore: number;
  scoreDisplay: string;
  pointDiff: number;
  cumulativeWins: number;
  cumulativeLosses: number;
  cumulativeGames: number;
  cumulativeWinRate: number; // 0 to 100
  netWinMargin: number; // wins - losses
  partnerName: string;
  opponentNames: string;
  timestamp: number;
}

export const PlayerPerformanceTrendsChart: React.FC<PlayerPerformanceTrendsChartProps> = ({
  player,
  matches,
  playersById,
  currentSessionId,
}) => {
  const [metricMode, setMetricMode] = useState<TrendMetricMode>('winRate');

  // Filter completed matches involving this player, sorted chronologically
  const playerMatchesData = useMemo(() => {
    const relevantMatches = matches
      .filter((m) => {
        const matchesSession = currentSessionId ? m.sessionId === currentSessionId : true;
        const involvesPlayer =
          m.teamA?.includes(player.id) || m.teamB?.includes(player.id);
        const isCompleted = m.status === 'completed' && m.scoreA !== null && m.scoreB !== null;
        return matchesSession && involvesPlayer && isCompleted;
      })
      .sort((a, b) => (a.confirmedAt || a.startTime) - (b.confirmedAt || b.startTime));

    let runningWins = 0;
    let runningLosses = 0;

    const data: MatchPointData[] = relevantMatches.map((m, idx) => {
      const isTeamA = m.teamA.includes(player.id);
      const teamScore = isTeamA ? (m.scoreA ?? 0) : (m.scoreB ?? 0);
      const oppScore = isTeamA ? (m.scoreB ?? 0) : (m.scoreA ?? 0);
      const isWinner =
        (isTeamA && m.winnerTeam === 'teamA') ||
        (!isTeamA && m.winnerTeam === 'teamB');

      if (isWinner) {
        runningWins++;
      } else {
        runningLosses++;
      }

      const totalSoFar = runningWins + runningLosses;
      const winRate = Math.round((runningWins / totalSoFar) * 100);

      // Identify partner & opponents
      const partnerId = isTeamA
        ? m.teamA.find((id) => id !== player.id)
        : m.teamB.find((id) => id !== player.id);
      const oppIds = isTeamA ? m.teamB : m.teamA;

      const partnerName = partnerId ? playersById[partnerId]?.name || 'Partner' : 'Solo';
      const opponentNames = oppIds
        .map((id) => playersById[id]?.name || 'Opponent')
        .join(' & ');

      return {
        matchNumber: m.matchNumber || idx + 1,
        matchIndex: idx + 1,
        matchLabel: `G${idx + 1}`,
        matchId: m.id,
        courtName: m.courtName || `Court ${m.courtNumber}`,
        result: isWinner ? 'W' : 'L',
        isWin: isWinner,
        playerScore: teamScore,
        opponentScore: oppScore,
        scoreDisplay: `${teamScore} - ${oppScore}`,
        pointDiff: teamScore - oppScore,
        cumulativeWins: runningWins,
        cumulativeLosses: runningLosses,
        cumulativeGames: totalSoFar,
        cumulativeWinRate: winRate,
        netWinMargin: runningWins - runningLosses,
        partnerName,
        opponentNames,
        timestamp: m.confirmedAt || m.startTime,
      };
    });

    return data;
  }, [matches, player.id, currentSessionId, playersById]);

  // Aggregate stats across session matches
  const summaryStats = useMemo(() => {
    if (playerMatchesData.length === 0) {
      return {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPointDiff: 0,
        avgMargin: '0.0',
        bestStreak: 0,
        recentForm: [] as ('W' | 'L')[],
      };
    }

    let wins = 0;
    let losses = 0;
    let pointDiff = 0;
    let maxStreak = 0;
    let curStreak = 0;

    playerMatchesData.forEach((d) => {
      if (d.isWin) {
        wins++;
        curStreak++;
        if (curStreak > maxStreak) maxStreak = curStreak;
      } else {
        losses++;
        curStreak = 0;
      }
      pointDiff += d.pointDiff;
    });

    const total = wins + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const avgMargin = total > 0 ? (pointDiff / total).toFixed(1) : '0.0';
    const recentForm = playerMatchesData.slice(-5).map((d) => d.result);

    return {
      totalMatches: total,
      wins,
      losses,
      winRate,
      totalPointDiff: pointDiff,
      avgMargin: pointDiff > 0 ? `+${avgMargin}` : avgMargin,
      bestStreak: maxStreak,
      recentForm,
    };
  }, [playerMatchesData]);

  // Custom Tooltip component for Recharts
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: MatchPointData = payload[0].payload;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl text-white text-xs max-w-xs space-y-2 z-50 pointer-events-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
          <span className="font-bold text-slate-300">
            Game #{data.matchIndex} • {data.courtName}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
              data.isWin
                ? 'bg-lime-400 text-slate-950 shadow-2xs'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {data.result === 'W' ? 'WIN' : 'LOSS'} ({data.pointDiff > 0 ? `+${data.pointDiff}` : data.pointDiff})
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-300 text-[11px]">
            <span className="text-slate-400">Final Score:</span>
            <span className="font-mono font-bold text-white text-sm">{data.scoreDisplay}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300 text-[11px]">
            <span className="text-slate-400">Partner:</span>
            <span className="font-medium text-slate-200 truncate max-w-[130px]">{data.partnerName}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300 text-[11px]">
            <span className="text-slate-400">Opponents:</span>
            <span className="font-medium text-slate-200 truncate max-w-[130px]">{data.opponentNames}</span>
          </div>
        </div>

        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between font-mono text-[11px]">
          <span className="text-slate-400">Cumulative Record:</span>
          <span className="text-lime-400 font-bold">
            {data.cumulativeWins}W - {data.cumulativeLosses}L ({data.cumulativeWinRate}%)
          </span>
        </div>
      </div>
    );
  };

  // Custom Dot for AreaChart
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const isWin = payload.isWin;

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={5.5}
          fill={isWin ? '#84CC16' : '#F43F5E'}
          stroke="#0F382C"
          strokeWidth={2}
          className="transition-all hover:r-7"
        />
        <circle
          cx={cx}
          cy={cy}
          r={2}
          fill="#FFFFFF"
        />
      </g>
    );
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#0F382C] flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight font-display">
              Performance Trends
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Match-by-match win/loss progression and momentum across the session
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricMode('winRate')}
            className={`touch-target px-2.5 py-1 rounded-lg transition text-[11px] ${
              metricMode === 'winRate'
                ? 'bg-[#0F382C] text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Win Rate %
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('momentum')}
            className={`touch-target px-2.5 py-1 rounded-lg transition text-[11px] ${
              metricMode === 'momentum'
                ? 'bg-[#0F382C] text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Net Wins (W-L)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('pointDiff')}
            className={`touch-target px-2.5 py-1 rounded-lg transition text-[11px] ${
              metricMode === 'pointDiff'
                ? 'bg-[#0F382C] text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Score Margin (±)
          </button>
        </div>
      </div>

      {/* Visual Chart Area */}
      {playerMatchesData.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-50/80 border border-dashed border-slate-200 space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Scale className="w-5 h-5 stroke-[1.5]" />
          </div>
          <p className="text-xs font-bold text-slate-700">No Session Matches Recorded Yet</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            As soon as {player.name} completes matches in this session, their win/loss progression, point margin, and form momentum will be charted here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {metricMode === 'pointDiff' ? (
                <BarChart
                  data={playerMatchesData}
                  margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="matchLabel"
                    tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <ReferenceLine y={0} stroke="#94A3B8" strokeWidth={1.5} />
                  <Bar dataKey="pointDiff" radius={[4, 4, 0, 0]}>
                    {playerMatchesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pointDiff >= 0 ? '#10B981' : '#F43F5E'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart
                  data={playerMatchesData}
                  margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="winTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#84CC16" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0F382C" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="matchLabel"
                    tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={
                      metricMode === 'winRate'
                        ? [0, 100]
                        : ['auto', 'auto']
                    }
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (metricMode === 'winRate' ? `${v}%` : v > 0 ? `+${v}` : `${v}`)}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  {metricMode === 'winRate' ? (
                    <ReferenceLine
                      y={50}
                      stroke="#94A3B8"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{
                        value: '50% Break-Even',
                        position: 'insideBottomRight',
                        fill: '#94A3B8',
                        fontSize: 10,
                      }}
                    />
                  ) : (
                    <ReferenceLine
                      y={0}
                      stroke="#94A3B8"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey={metricMode === 'winRate' ? 'cumulativeWinRate' : 'netWinMargin'}
                    stroke="#0F382C"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#winTrendGradient)"
                    dot={<CustomDot />}
                    activeDot={{ r: 7, stroke: '#0F382C', strokeWidth: 2, fill: '#84CC16' }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Quick Legend & Summary Pill Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Session Win Rate
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-black text-slate-900 font-mono">
                  {summaryStats.winRate}%
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                  {summaryStats.wins}W - {summaryStats.losses}L
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Point Differential
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-base font-black font-mono ${
                    summaryStats.totalPointDiff > 0
                      ? 'text-emerald-700'
                      : summaryStats.totalPointDiff < 0
                      ? 'text-rose-600'
                      : 'text-slate-800'
                  }`}
                >
                  {summaryStats.totalPointDiff > 0
                    ? `+${summaryStats.totalPointDiff}`
                    : summaryStats.totalPointDiff}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  ({summaryStats.avgMargin}/gm)
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Peak Win Streak
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-black text-slate-900 font-mono">
                  {summaryStats.bestStreak}
                </span>
                {summaryStats.bestStreak >= 2 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded">
                    <Flame className="w-3 h-3 fill-current" />
                    Hot
                  </span>
                )}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Recent Form
              </span>
              <div className="flex items-center gap-1 mt-1">
                {summaryStats.recentForm.map((res, i) => (
                  <span
                    key={i}
                    className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center font-mono ${
                      res === 'W'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
