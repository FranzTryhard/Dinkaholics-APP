import React, { useState } from 'react';
import {
  Session,
  Match,
  MatchCandidate,
  Player,
  RotationMode,
  SKILL_LEVEL_COLORS,
} from '../types';
import { HeroScoreCard } from '../components/HeroScoreCard';
import { WaitingQueue } from '../components/WaitingQueue';
import { SessionInsights } from '../components/SessionInsights';
import { PlayerAvatar } from '../components/PlayerAvatar';
import {
  Search,
  MapPin,
  Trophy,
  Scale,
  HeartHandshake,
  Play,
  RotateCw,
  Users,
  ChevronRight,
  Sparkles,
  Crown,
} from 'lucide-react';
import { PickleballIcon } from '../components/PickleballIcon';

interface DashboardViewProps {
  session: Session;
  players: Player[];
  matches: Match[];
  recommendationsByCourt: Record<number, MatchCandidate | null>;
  onStartRecommended: (courtNumber: number, candidate: MatchCandidate) => void;
  onEnterScore: (match: Match) => void;
  onManualCustomMatch: (courtNumber: number) => void;
  onRegenerateRecommendation: (courtNumber: number) => void;
  onSwitchMode: (mode: RotationMode) => void;
  onTogglePlayerStatus: (playerId: string, status: any) => void;
  onEndSessionClick: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  session,
  players,
  matches,
  recommendationsByCourt,
  onStartRecommended,
  onEnterScore,
  onManualCustomMatch,
  onRegenerateRecommendation,
  onSwitchMode,
  onTogglePlayerStatus,
  onEndSessionClick,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const fallbackPreviewPlayers = React.useMemo<Player[]>(
    () => [
      {
        id: 'p_aa',
        name: 'aa',
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
        waitingSince: Date.now() - 30000,
        totalWaitingTimeMs: 30000,
        teammateHistory: {},
        opponentHistory: {},
      },
      {
        id: 'p_bb',
        name: 'bb',
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
        waitingSince: Date.now() - 25000,
        totalWaitingTimeMs: 25000,
        teammateHistory: {},
        opponentHistory: {},
      },
      {
        id: 'p_cc',
        name: 'cc',
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
        waitingSince: Date.now() - 20000,
        totalWaitingTimeMs: 20000,
        teammateHistory: {},
        opponentHistory: {},
      },
      {
        id: 'p_dd',
        name: 'dd',
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
        waitingSince: Date.now() - 15000,
        totalWaitingTimeMs: 15000,
        teammateHistory: {},
        opponentHistory: {},
      },
    ],
    []
  );

  const displayPlayers = players && players.length > 0 ? players : fallbackPreviewPlayers;

  const playersById = React.useMemo(() => {
    return displayPlayers.reduce<Record<string, Player>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [displayPlayers]);

  const activeMatches = matches.filter(
    (m) => m.sessionId === session.id && m.status === 'in_progress'
  );
  const completedMatches = matches.filter(
    (m) => m.sessionId === session.id && m.status === 'completed'
  );

  const totalWins = completedMatches.filter((m) => m.winnerTeam !== null).length;
  const totalLosses = Math.max(0, completedMatches.length - totalWins);

  const courts = Array.from({ length: session.courtCount }, (_, i) => i + 1);

  // Top 3 ranked players for leaderboard (guarantee at least 3 display rows)
  const sortedPlayers = [...displayPlayers].sort(
    (a, b) =>
      b.sessionWins * 25 + b.sessionGamesPlayed * 10 -
      (a.sessionWins * 25 + a.sessionGamesPlayed * 10)
  );
  const topPlayers = [
    ...sortedPlayers,
    ...fallbackPreviewPlayers.filter(
      (fb) => !sortedPlayers.some((p) => p.name.toLowerCase() === fb.name.toLowerCase())
    ),
  ].slice(0, 3);

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

  const waitingCount = displayPlayers.filter((p) => p.status === 'available').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 space-y-6">
      {/* Top Header / Quick Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <span>Session Center</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            {session.courtCount} {session.courtCount === 1 ? 'Court' : 'Courts'} · {displayPlayers.length} Total Players · {waitingCount} in Queue
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players or courts..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200/90 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0F382C] focus:ring-1 focus:ring-[#0F382C] transition shadow-2xs"
          />
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Club Banner, Hero Score Card, Rotation Mode, Live Matches & Recommendations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Club Photo Banner - Placed cleanly above Session Performance Card without overlap */}
          <div className="rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-xs relative group">
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-72 overflow-hidden bg-[#0F382C]">
              <img
                src="/assets/aistudio/image_8772cc28.jpg"
                onError={(e) => {
                  e.currentTarget.src = '/assets/aistudio/image_8772cc28.png';
                }}
                alt="Dinkaholics Club Community Group Photo"
                referrerPolicy="no-referrer"
                loading="eager"
                className="w-full h-full object-cover object-[center_35%] transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 right-3 sm:right-4 flex items-end justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#84CC16] text-[#0A271E] text-[10px] font-black uppercase tracking-wider mb-1 shadow-sm">
                    <span>Dinkaholics Crew</span>
                  </div>
                  <h3 className="text-white font-black text-sm sm:text-base tracking-tight drop-shadow font-display">
                    {session.name || 'Dinkaholics Club Session'}
                  </h3>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 text-white/90 text-[11px] font-semibold">
                  <Users className="w-3.5 h-3.5 text-[#84CC16]" />
                  <span>{displayPlayers.length} Players</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Score Card (Session Performance) */}
          <HeroScoreCard
            totalMatches={completedMatches.length}
            totalWins={totalWins}
            totalLosses={totalLosses}
            rotationMode={session.rotationMode}
            onCardClick={() => onNavigateTab('leaderboard')}
          />

          {/* Rotation Mode Selector */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-3 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Rotation Mode</span>
              <span className="text-[11px] text-slate-400">Controls match balancing rules</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100/90 rounded-xl">
              <button
                type="button"
                onClick={() => onSwitchMode('balanced')}
                aria-label="Set rotation mode to Balanced"
                className={`min-h-[40px] py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  session.rotationMode === 'balanced'
                    ? 'bg-[#0F382C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Balanced</span>
              </button>
              <button
                type="button"
                onClick={() => onSwitchMode('king_of_court')}
                aria-label="Set rotation mode to King of Court ladder"
                className={`min-h-[40px] py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  session.rotationMode === 'king_of_court'
                    ? 'bg-[#0F382C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Winners move up toward Court 1; runners-up move down"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">King/Ladder</span>
              </button>
              <button
                type="button"
                onClick={() => onSwitchMode('winner_stays')}
                aria-label="Set rotation mode to Winner-Stays"
                className={`min-h-[40px] py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  session.rotationMode === 'winner_stays'
                    ? 'bg-[#0F382C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Winner-Stays</span>
              </button>
              <button
                type="button"
                onClick={() => onSwitchMode('social')}
                aria-label="Set rotation mode to Social Mix"
                className={`min-h-[40px] py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  session.rotationMode === 'social'
                    ? 'bg-[#0F382C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Social</span>
              </button>
            </div>
          </div>

          {/* Section: Session Insights */}
          <SessionInsights
            players={players}
            matches={matches}
            session={session}
            onNavigateToPlayers={() => onNavigateTab('players')}
          />

          {/* Section: Live Matches in Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base font-display">Active Matches</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-sans">
                  {activeMatches.length} Live
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('courts')}
                className="text-xs font-bold text-[#0F382C] hover:underline flex items-center gap-0.5"
              >
                <span>All Courts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeMatches.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 text-center shadow-xs">
                <PickleballIcon className="w-8 h-8 mx-auto mb-2 opacity-60 text-[#0F382C]" />
                <h3 className="text-xs font-bold text-slate-800">No matches currently in progress</h3>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Pick a court recommendation below to launch the next doubles match.
                </p>
              </div>
            ) : (
              activeMatches.map((match) => {
                const team1 = match.teamA.map(getPlayer);
                const team2 = match.teamB.map(getPlayer);

                return (
                  <div
                    key={match.id}
                    className="rounded-2xl bg-white border border-[#E0E7E4] p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-[#64748B] pb-2 border-b border-[#E0E7E4]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="font-bold text-[#172033]">
                          {match.courtName || `Court ${match.courtNumber}`}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[#64748B] text-[11px]">
                          <MapPin className="w-3 h-3 text-[#103F32]" />
                          <span>Outdoor Doubles</span>
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[#103F32] bg-[#E5F8EC] border border-[#C4EED3] px-2 py-0.5 rounded-full font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-[#35D879] animate-ping" />
                        Live Match
                      </span>
                    </div>

                    {/* Team Rows */}
                    <div className="space-y-2">
                      {/* Team 1 */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-center text-[10px] font-black font-mono text-[#64748B]">
                            T1
                          </span>
                          <div className="flex -space-x-1.5">
                            {team1.map((p) => (
                              <PlayerAvatar
                                key={p.id}
                                avatar={p.avatar}
                                name={p.name}
                                className="w-7 h-7 rounded-full border-2 border-white"
                              />
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-[#172033]">
                            {team1.map((p) => p.name).join(' & ')}
                          </span>
                        </div>

                        <span className="w-8 h-8 rounded-lg bg-white border border-[#E0E7E4] font-mono font-bold text-xs text-[#172033] flex items-center justify-center">
                          {match.scoreA !== null ? match.scoreA : 0}
                        </span>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-center text-[10px] font-black font-mono text-[#64748B]">
                            T2
                          </span>
                          <div className="flex -space-x-1.5">
                            {team2.map((p) => (
                              <PlayerAvatar
                                key={p.id}
                                avatar={p.avatar}
                                name={p.name}
                                className="w-7 h-7 rounded-full border-2 border-white"
                              />
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-[#172033]">
                            {team2.map((p) => p.name).join(' & ')}
                          </span>
                        </div>

                        <span className="w-8 h-8 rounded-lg bg-white border border-[#E0E7E4] font-mono font-bold text-xs text-[#172033] flex items-center justify-center">
                          {match.scoreB !== null ? match.scoreB : 0}
                        </span>
                      </div>
                    </div>

                    {/* Scorekeeper Button */}
                    <button
                      onClick={() => onEnterScore(match)}
                      className="cssbuttons-io-button-forest w-full justify-center"
                    >
                      <PickleballIcon className="w-4 h-4 text-[#35D879]" />
                      <span>Open Visual Court Scorekeeper</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Section: Court Recommendations / Idle Courts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#103F32]" />
                <h2 className="font-bold text-[#172033] text-base font-display">Next Recommended Matches</h2>
              </div>
              <button
                onClick={() => onNavigateTab('courts')}
                className="text-xs font-bold text-[#103F32] hover:text-[#0A2B22] hover:underline"
              >
                View all
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {courts.map((courtNum) => {
                const activeMatchId = session.activeCourtMatches[courtNum];
                const activeMatch = matches.find((m) => m.id === activeMatchId);
                const recommendation = recommendationsByCourt[courtNum];
                const courtName = session.courtNames?.[courtNum] || `Court ${courtNum}`;

                return (
                  <div
                    key={courtNum}
                    className="rounded-2xl bg-white border border-[#E0E7E4] p-4 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#172033]">{courtName}</span>
                        {activeMatch ? (
                          <span className="text-[10px] font-bold text-[#103F32] bg-[#E5F8EC] px-2 py-0.5 rounded-md border border-[#C4EED3]">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#64748B] bg-[#F6F8F7] px-2 py-0.5 rounded-md border border-[#E0E7E4]">
                            Open
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[#64748B] text-[11px] mt-1">
                        <MapPin className="w-3 h-3 text-[#103F32]" />
                        <span>Court #{courtNum} · Doubles</span>
                      </div>
                    </div>

                    {recommendation && !activeMatch ? (
                      <div className="p-3 rounded-xl bg-[#E5F8EC]/60 border border-[#C4EED3] text-xs space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-[#103F32]">
                          <span>Suggested Match</span>
                          <span className="font-mono tabular-nums">Diff: {recommendation.ratingDiff.toFixed(1)}</span>
                        </div>

                        <div className="text-[11px] text-[#172033] space-y-1">
                          <div className="truncate font-medium">
                            <span className="text-[#64748B] mr-1">T1:</span>
                            {recommendation.teamA.map((id) => getPlayer(id).name).join(' & ')}
                          </div>
                          <div className="truncate font-medium">
                            <span className="text-[#64748B] mr-1">T2:</span>
                            {recommendation.teamB.map((id) => getPlayer(id).name).join(' & ')}
                          </div>
                        </div>

                        <button
                          onClick={() => onStartRecommended(courtNum, recommendation)}
                          className="cssbuttons-io-button w-full justify-center"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Match</span>
                        </button>
                      </div>
                    ) : activeMatch ? (
                      <div className="py-2.5 text-center text-xs font-semibold text-[#103F32] bg-[#E5F8EC] border border-[#C4EED3] rounded-xl">
                        Match Currently Live
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] text-center space-y-2">
                        <div className="text-[11px] font-semibold text-[#64748B]">
                          {waitingCount === 0
                            ? 'All available players are currently playing'
                            : `Need 4 players · ${waitingCount} available in queue`}
                        </div>
                        <button
                          onClick={() => onManualCustomMatch(courtNum)}
                          className="touch-target w-full py-2 px-3 rounded-xl border border-[#E0E7E4] bg-white text-[#172033] text-xs font-bold hover:bg-[#F6F8F7] transition active:scale-95 shadow-2xs"
                        >
                          Select Players Manually
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Waiting Queue, Leaderboard & Recent Matches */}
        <div className="lg:col-span-5 space-y-6">
          {/* Waiting Queue Component */}
          <WaitingQueue
            players={displayPlayers}
            onToggleStatus={onTogglePlayerStatus}
            onNavigateToPlayers={() => onNavigateTab('players')}
          />

          {/* Group Leaderboard Card */}
          <div className="rounded-2xl bg-white border border-[#E0E7E4] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="font-bold text-[#172033] text-sm font-display">Top Performers</h2>
              </div>
              <button
                onClick={() => onNavigateTab('leaderboard')}
                className="text-xs font-semibold text-[#103F32] hover:text-[#0A2B22] hover:underline flex items-center gap-0.5"
              >
                <span>Full rankings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {topPlayers.map((player, idx) => {
                const pts = player.sessionWins * 25 + player.sessionGamesPlayed * 10 + 100;

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] hover:bg-[#E5F8EC]/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center font-black text-xs text-[#64748B] font-mono tabular-nums">
                        #{idx + 1}
                      </span>

                      <PlayerAvatar
                        avatar={player.avatar}
                        name={player.name}
                        className="w-8 h-8 rounded-full border border-[#E0E7E4]"
                      />

                      <div>
                        <div className="text-xs font-bold text-[#172033]">{player.name}</div>
                        <div className="text-[11px] text-[#64748B]">
                          {player.sessionGamesPlayed} matches · Level {player.skillRating}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-bold font-mono tabular-nums text-[#103F32]">
                      {pts} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Completed Matches */}
          <div className="rounded-2xl bg-white border border-[#E0E7E4] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#172033] text-sm">Recent Match Logs</h2>
              <button
                onClick={() => onNavigateTab('history')}
                className="text-xs font-semibold text-[#103F32] hover:text-[#0A2B22] hover:underline flex items-center gap-0.5"
              >
                <span>Full log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {completedMatches.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#64748B]">
                No completed matches yet.
              </div>
            ) : (
              <div className="space-y-2">
                {completedMatches.slice(-3).map((match) => {
                  const isWinnerA = match.winnerTeam === 'teamA';
                  return (
                    <div
                      key={match.id}
                      className="p-3 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                        <span>{match.courtName || `Court ${match.courtNumber}`}</span>
                        <span>Doubles Final</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={`truncate ${isWinnerA ? 'font-bold text-[#172033]' : 'text-[#64748B]'}`}>
                          {match.teamA.map((id) => getPlayer(id).name).join(' & ')}
                        </span>
                        <span className="w-6 h-6 rounded bg-[#103F32] text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 ml-2 shadow-xs">
                          {match.scoreA}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={`truncate ${!isWinnerA ? 'font-bold text-[#172033]' : 'text-[#64748B]'}`}>
                          {match.teamB.map((id) => getPlayer(id).name).join(' & ')}
                        </span>
                        <span className="w-6 h-6 rounded bg-slate-200 text-[#172033] font-mono font-bold text-[11px] flex items-center justify-center shrink-0 ml-2">
                          {match.scoreB}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
