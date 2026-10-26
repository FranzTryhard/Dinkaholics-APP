import React, { useState, useMemo } from 'react';
import { Player, Session } from '../types';
import {
  RoundRobinRound,
  RoundRobinMatch,
  generateRoundRobinSchedule,
  calculateStandings,
  PlayerStanding,
} from '../engine/roundRobin';
import { courtAudio } from '../utils/audio';
import confetti from 'canvas-confetti';
import { PlayerAvatar } from '../components/PlayerAvatar';
import {
  Trophy,
  Users,
  Layers,
  CheckCircle2,
  Medal,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Grid,
  FileText,
  Plus,
  Minus,
  Edit3,
  X,
} from 'lucide-react';
import { PickleballIcon } from '../components/PickleballIcon';
import { PickleballBounceLoader } from '../components/PickleballBounceLoader';

interface RoundRobinViewProps {
  players: Player[];
  session: Session | null;
  playersById: Record<string, Player>;
  onNavigateToCourts?: () => void;
}

export const RoundRobinView: React.FC<RoundRobinViewProps> = ({
  players,
  session,
  playersById,
  onNavigateToCourts,
}) => {
  const availablePlayers = useMemo(
    () => players.filter((p) => p.status !== 'finished'),
    [players]
  );

  const [activeTab, setActiveTab] = useState<'bracket' | 'standings' | 'matrix'>('bracket');
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [roundsCount, setRoundsCount] = useState<number>(5);
  const [targetScore, setTargetScore] = useState<number>(11);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customScoreMatch, setCustomScoreMatch] = useState<{
    roundNumber: number;
    matchId: string;
    teamAName: string;
    teamBName: string;
    scoreA: number;
    scoreB: number;
  } | null>(null);

  // Stored rounds state
  const [rounds, setRounds] = useState<RoundRobinRound[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('picklematch_roundrobin_rounds');
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (e) {}
    return generateRoundRobinSchedule(
      availablePlayers,
      session?.courtCount || 2,
      5
    );
  });

  // Save rounds to localStorage
  const saveRounds = (newRounds: RoundRobinRound[]) => {
    setRounds(newRounds);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('picklematch_roundrobin_rounds', JSON.stringify(newRounds));
      }
    } catch (e) {}
  };

  const handleGenerateSchedule = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newSchedule = generateRoundRobinSchedule(
        availablePlayers,
        session?.courtCount || 2,
        roundsCount
      );
      saveRounds(newSchedule);
      setSelectedRoundIndex(0);
      setIsGenerating(false);
    }, 500);
  };

  const handleScoreMatch = (
    roundNumber: number,
    matchId: string,
    scoreA: number,
    scoreB: number
  ) => {
    const winnerTeam: 'teamA' | 'teamB' = scoreA >= scoreB ? 'teamA' : 'teamB';
    const updatedRounds = rounds.map((r) => {
      if (r.roundNumber !== roundNumber) return r;
      return {
        ...r,
        matches: r.matches.map((m) => {
          if (m.id !== matchId) return m;
          return {
            ...m,
            scoreA,
            scoreB,
            winnerTeam,
            completed: true,
          };
        }),
      };
    });

    saveRounds(updatedRounds);
    courtAudio.playMatchWin();
    try {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    } catch (e) {}
  };

  const handleResetMatch = (roundNumber: number, matchId: string) => {
    const updatedRounds = rounds.map((r) => {
      if (r.roundNumber !== roundNumber) return r;
      return {
        ...r,
        matches: r.matches.map((m) => {
          if (m.id !== matchId) return m;
          return {
            ...m,
            scoreA: null,
            scoreB: null,
            winnerTeam: null,
            completed: false,
          };
        }),
      };
    });
    saveRounds(updatedRounds);
  };

  const standings: PlayerStanding[] = useMemo(() => {
    return calculateStandings(availablePlayers, rounds);
  }, [availablePlayers, rounds]);

  const currentRound = rounds[selectedRoundIndex] || rounds[0];

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

  const completedMatchesCount = useMemo(() => {
    let count = 0;
    rounds.forEach((r) => {
      r.matches.forEach((m) => {
        if (m.completed) count++;
      });
    });
    return count;
  }, [rounds]);

  const totalMatchesCount = useMemo(() => {
    let count = 0;
    rounds.forEach((r) => {
      count += r.matches.length;
    });
    return count;
  }, [rounds]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
              Round Robin Tournament
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fixed doubles matrix · Every player rotates partners and opponents across all rounds.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('bracket')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'bracket'
                ? 'bg-[#0F382C] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Round Schedule
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              activeTab === 'standings'
                ? 'bg-[#0F382C] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Medal className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Standings</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'matrix'
                ? 'bg-[#0F382C] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Partner Matrix
          </button>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Tournament Progress</div>
          <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
            {completedMatchesCount} / {totalMatchesCount}{' '}
            <span className="text-xs text-slate-400 font-normal">matches</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Rounds</div>
          <div className="text-xl font-black text-[#0F382C] font-mono mt-0.5">
            {rounds.length} <span className="text-xs text-slate-400 font-normal">rounds scheduled</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Roster Size</div>
          <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
            {availablePlayers.length} <span className="text-xs text-slate-400 font-normal">players</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Current Leader</div>
            <div className="text-sm font-bold text-slate-900 truncate max-w-[120px] mt-0.5">
              {standings[0]?.player.name || 'Pending'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
            <Trophy className="w-4 h-4 fill-amber-400 stroke-amber-600" />
          </div>
        </div>
      </div>

      {/* TAB 1: ROUND SCHEDULE */}
      {activeTab === 'bracket' && (
        <div className="space-y-5">
          {/* Round Selector Bar */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {rounds.map((r, idx) => {
                const roundMatchesCompleted = r.matches.every((m) => m.completed);
                const isSelected = selectedRoundIndex === idx;

                return (
                  <button
                    key={r.roundNumber}
                    onClick={() => setSelectedRoundIndex(idx)}
                    disabled={isGenerating}
                    className={`touch-target px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#0F382C] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Round {r.roundNumber}</span>
                    {roundMatchesCompleted && (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-[#84CC16]' : 'text-emerald-600'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pl-4">
              <button
                onClick={handleGenerateSchedule}
                disabled={isGenerating}
                className="touch-target px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60"
                title="Regenerate round schedule"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-[#0F382C] ${isGenerating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            </div>
          </div>

          {/* Current Round Details */}
          {isGenerating ? (
            <div className="py-16 px-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center animate-in fade-in duration-150">
              <PickleballBounceLoader
                size="md"
                theme="light"
                message="Generating Balanced Tournament Schedule..."
                submessage="Distributing player pairings, court rotations, and bye rounds"
              />
            </div>
          ) : currentRound && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    Round {currentRound.roundNumber} Matches
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    ({currentRound.matches.filter((m) => m.completed).length} / {currentRound.matches.length} completed)
                  </span>
                </div>

                {/* Resting / Bye Players callout */}
                {currentRound.byes.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl">
                    <span className="font-bold">Bye / Resting:</span>
                    <span>{currentRound.byes.map((id) => getPlayer(id).name).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Match Cards in Current Round */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRound.matches.map((match) => {
                  const teamA1 = getPlayer(match.teamA[0]);
                  const teamA2 = getPlayer(match.teamA[1]);
                  const teamB1 = getPlayer(match.teamB[0]);
                  const teamB2 = getPlayer(match.teamB[1]);

                  const isWinnerA = match.completed && match.winnerTeam === 'teamA';
                  const isWinnerB = match.completed && match.winnerTeam === 'teamB';

                  return (
                    <div
                      key={match.id}
                      className={`p-4 rounded-2xl bg-white border shadow-xs transition space-y-4 ${
                        match.completed
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-slate-200/90'
                      }`}
                    >
                      {/* Court Title & Status */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#0F382C] text-white flex items-center justify-center text-xs font-mono font-bold">
                            C{match.courtNumber}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            Court {match.courtNumber} Doubles
                          </span>
                        </div>

                        {match.completed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Final
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400">
                            Scheduled
                          </span>
                        )}
                      </div>

                      {/* Competing Teams */}
                      <div className="space-y-2.5">
                        {/* Team A */}
                        <div
                          className={`p-2.5 rounded-xl flex items-center justify-between transition ${
                            isWinnerA
                              ? 'bg-emerald-100/70 border border-emerald-300 font-bold'
                              : 'bg-slate-50 border border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-black text-slate-400 w-5">
                              T1
                            </span>
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-900">
                                {teamA1.name} & {teamA2.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Lvl {teamA1.skillRating} + {teamA2.skillRating}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {match.completed && (
                              <span className="text-base font-black font-mono text-slate-900 px-2">
                                {match.scoreA}
                              </span>
                            )}
                            {isWinnerA && (
                              <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
                            )}
                          </div>
                        </div>

                        {/* Team B */}
                        <div
                          className={`p-2.5 rounded-xl flex items-center justify-between transition ${
                            isWinnerB
                              ? 'bg-emerald-100/70 border border-emerald-300 font-bold'
                              : 'bg-slate-50 border border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-black text-slate-400 w-5">
                              T2
                            </span>
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-900">
                                {teamB1.name} & {teamB2.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Lvl {teamB1.skillRating} + {teamB2.skillRating}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {match.completed && (
                              <span className="text-base font-black font-mono text-slate-900 px-2">
                                {match.scoreB}
                              </span>
                            )}
                            {isWinnerB && (
                              <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick & Custom Scoring Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        {match.completed ? (
                          <button
                            onClick={() => handleResetMatch(currentRound.roundNumber, match.id)}
                            className="touch-target text-xs text-slate-500 hover:text-slate-800 font-medium underline flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Edit / Reset Score</span>
                          </button>
                        ) : (
                          <div className="w-full space-y-2">
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() =>
                                  handleScoreMatch(currentRound.roundNumber, match.id, 11, 7)
                                }
                                className="touch-target py-2 px-2 rounded-xl bg-slate-100 hover:bg-[#0F382C] hover:text-white text-slate-800 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1"
                              >
                                <span>T1 Wins (11-7)</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleScoreMatch(currentRound.roundNumber, match.id, 7, 11)
                                }
                                className="touch-target py-2 px-2 rounded-xl bg-slate-100 hover:bg-[#0F382C] hover:text-white text-slate-800 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1"
                              >
                                <span>T2 Wins (7-11)</span>
                              </button>
                            </div>

                            <button
                              onClick={() =>
                                setCustomScoreMatch({
                                  roundNumber: currentRound.roundNumber,
                                  matchId: match.id,
                                  teamAName: `${teamA1.name} & ${teamA2.name}`,
                                  teamBName: `${teamB1.name} & ${teamB2.name}`,
                                  scoreA: 11,
                                  scoreB: 9,
                                })
                              }
                              className="touch-target w-full py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs transition active:scale-95 text-center flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Custom Score Stepper...</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE STANDINGS */}
      {activeTab === 'standings' && (
        <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Individual Standings Table</h2>
              <p className="text-[11px] text-slate-400">
                Ranked by Wins, then Point Differential (+/-), then Points Scored
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              {completedMatchesCount} Matches Scored
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Player</th>
                  <th className="py-3 px-3 text-center">Played</th>
                  <th className="py-3 px-3 text-center">W - L</th>
                  <th className="py-3 px-3 text-center">Win %</th>
                  <th className="py-3 px-3 text-center">Points For</th>
                  <th className="py-3 px-3 text-center">Points Agst</th>
                  <th className="py-3 px-3 text-right">Diff (+/-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {standings.map((row, index) => {
                  const isTop3 = index < 3;
                  return (
                    <tr
                      key={row.player.id}
                      className={`hover:bg-slate-50/80 transition ${
                        index === 0 ? 'bg-amber-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold">
                        <div className="flex items-center gap-1.5">
                          {index === 0 && (
                            <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[10px]">
                              1
                            </span>
                          )}
                          {index === 1 && (
                            <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center text-[10px]">
                              2
                            </span>
                          )}
                          {index === 2 && (
                            <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-900 flex items-center justify-center text-[10px]">
                              3
                            </span>
                          )}
                          {index > 2 && (
                            <span className="text-slate-400 pl-1.5">#{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <PlayerAvatar
                            avatar={row.player.avatar}
                            name={row.player.name}
                            className="w-7 h-7 rounded-full border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{row.player.name}</div>
                            <div className="text-[10px] text-slate-400">Level {row.player.skillRating}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{row.played}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {row.wins} - {row.losses}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            row.winPct >= 60
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.winPct <= 30
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {row.winPct}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {row.pointsFor}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {row.pointsAgainst}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span
                          className={
                            row.pointDiff > 0
                              ? 'text-emerald-600'
                              : row.pointDiff < 0
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }
                        >
                          {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PARTNER MATRIX */}
      {activeTab === 'matrix' && (
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-4 shadow-xs">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Round Robin Doubles Fairness Matrix</h2>
            <p className="text-[11px] text-slate-400">
              Visualizes how tournament pairings rotate across all {availablePlayers.length} participating players
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <p>
              In this American Doubles Round Robin format, every player is scheduled to partner with new players across the {rounds.length} rounds.
              Points scored in every game contribute directly to your personal ranking on the Live Standings table.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {availablePlayers.map((player) => {
              // Count partners across rounds
              const partnersList: string[] = [];
              rounds.forEach((r) => {
                r.matches.forEach((m) => {
                  if (m.teamA.includes(player.id)) {
                    const partnerId = m.teamA.find((id) => id !== player.id);
                    if (partnerId) partnersList.push(getPlayer(partnerId).name);
                  } else if (m.teamB.includes(player.id)) {
                    const partnerId = m.teamB.find((id) => id !== player.id);
                    if (partnerId) partnersList.push(getPlayer(partnerId).name);
                  }
                });
              });

              return (
                <div
                  key={player.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5"
                >
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>{player.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Lvl {player.skillRating}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Partners: </span>
                    {partnersList.length > 0 ? partnersList.join(', ') : 'Resting'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Custom Score Stepper */}
      {customScoreMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-display">Record Match Score</h3>
                <p className="text-[11px] text-slate-400">Round {customScoreMatch.roundNumber}</p>
              </div>
              <button
                onClick={() => setCustomScoreMatch(null)}
                className="touch-target p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Score Chips */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Standard Presets
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  [11, 9],
                  [11, 7],
                  [11, 5],
                  [11, 3],
                  [9, 11],
                  [7, 11],
                  [5, 11],
                  [3, 11],
                ].map(([a, b]) => (
                  <button
                    key={`${a}-${b}`}
                    type="button"
                    onClick={() =>
                      setCustomScoreMatch((prev) => (prev ? { ...prev, scoreA: a, scoreB: b } : null))
                    }
                    className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition border ${
                      customScoreMatch.scoreA === a && customScoreMatch.scoreB === b
                        ? 'border-[#0F382C] bg-emerald-50 text-[#0F382C]'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {a}-{b}
                  </button>
                ))}
              </div>
            </div>

            {/* Steppers */}
            <div className="space-y-3 pt-1">
              {/* Team 1 Stepper */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Team 1</span>
                  <div className="text-xs font-bold text-slate-900 truncate" title={customScoreMatch.teamAName}>
                    {customScoreMatch.teamAName}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setCustomScoreMatch((prev) =>
                        prev ? { ...prev, scoreA: Math.max(0, prev.scoreA - 1) } : null
                      )
                    }
                    className="touch-target w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-black font-mono text-base text-slate-900">
                    {customScoreMatch.scoreA}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomScoreMatch((prev) => (prev ? { ...prev, scoreA: prev.scoreA + 1 } : null))
                    }
                    className="touch-target w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Team 2 Stepper */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Team 2</span>
                  <div className="text-xs font-bold text-slate-900 truncate" title={customScoreMatch.teamBName}>
                    {customScoreMatch.teamBName}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setCustomScoreMatch((prev) =>
                        prev ? { ...prev, scoreB: Math.max(0, prev.scoreB - 1) } : null
                      )
                    }
                    className="touch-target w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-black font-mono text-base text-slate-900">
                    {customScoreMatch.scoreB}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomScoreMatch((prev) => (prev ? { ...prev, scoreB: prev.scoreB + 1 } : null))
                    }
                    className="touch-target w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomScoreMatch(null)}
                className="touch-target py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleScoreMatch(
                    customScoreMatch.roundNumber,
                    customScoreMatch.matchId,
                    customScoreMatch.scoreA,
                    customScoreMatch.scoreB
                  );
                  setCustomScoreMatch(null);
                }}
                className="touch-target py-2.5 px-3 rounded-xl bg-[#0F382C] text-white font-bold text-xs hover:bg-[#144637] transition active:scale-95 shadow-sm"
              >
                Confirm Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
