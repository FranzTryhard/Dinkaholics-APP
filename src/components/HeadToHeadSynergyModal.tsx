import React, { useState, useMemo } from 'react';
import { Player, Match, SkillLevel, SKILL_LEVEL_LABELS, SKILL_LEVEL_COLORS } from '../types';
import {
  calculateHeadToHead,
  getPlayerChemistryInsights,
  calculateAllPairsSynergy,
  HeadToHeadStats,
  PairSynergy,
} from '../engine/synergyEngine';
import { PlayerAvatar } from './PlayerAvatar';
import {
  X,
  Swords,
  Users,
  Grid,
  Trophy,
  Flame,
  ArrowRightLeft,
  Search,
  Sparkles,
  Printer,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  HeartHandshake,
  Award,
} from 'lucide-react';
import { courtAudio } from '../utils/audio';

interface HeadToHeadSynergyModalProps {
  players: Player[];
  matches: Match[];
  initialPlayerAId?: string;
  initialPlayerBId?: string;
  onClose: () => void;
  onSelectPlayerDetail?: (player: Player) => void;
}

export const HeadToHeadSynergyModal: React.FC<HeadToHeadSynergyModalProps> = ({
  players,
  matches,
  initialPlayerAId,
  initialPlayerBId,
  onClose,
  onSelectPlayerDetail,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'h2h' | 'chemistry' | 'matrix'>('h2h');

  // Sorted players for dropdowns
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name)),
    [players]
  );

  const playersById = useMemo(() => {
    return players.reduce<Record<string, Player>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [players]);

  // Selected player IDs for 1v1 comparison
  const [playerAId, setPlayerAId] = useState<string>(() => {
    if (initialPlayerAId && playersById[initialPlayerAId]) return initialPlayerAId;
    return sortedPlayers[0]?.id || '';
  });

  const [playerBId, setPlayerBId] = useState<string>(() => {
    if (initialPlayerBId && playersById[initialPlayerBId] && initialPlayerBId !== initialPlayerAId) {
      return initialPlayerBId;
    }
    const second = sortedPlayers.find((p) => p.id !== playerAId);
    return second?.id || sortedPlayers[1]?.id || '';
  });

  // Search filter for matrix
  const [matrixFilter, setMatrixFilter] = useState('');
  const [matrixMode, setMatrixMode] = useState<'partners' | 'opponents'>('partners');

  const playerA = playersById[playerAId] || sortedPlayers[0];
  const playerB = playersById[playerBId] || sortedPlayers[1] || sortedPlayers[0];

  // Head to Head stats calculation
  const h2hStats: HeadToHeadStats | null = useMemo(() => {
    if (!playerA || !playerB || playerA.id === playerB.id) return null;
    return calculateHeadToHead(playerA, playerB, matches);
  }, [playerA, playerB, matches]);

  // Chemistry insights for both players
  const insightsA = useMemo(() => {
    if (!playerA) return null;
    return getPlayerChemistryInsights(playerA, players, matches);
  }, [playerA, players, matches]);

  const insightsB = useMemo(() => {
    if (!playerB) return null;
    return getPlayerChemistryInsights(playerB, players, matches);
  }, [playerB, players, matches]);

  // All duo pairings for the matrix
  const allPairSynergies = useMemo(() => {
    return calculateAllPairsSynergy(players, matches);
  }, [players, matches]);

  const swapPlayers = () => {
    const temp = playerAId;
    setPlayerAId(playerBId);
    setPlayerBId(temp);
    courtAudio.playCourtClick();
  };

  const handlePrint = () => {
    window.print();
  };

  // Top duos in the club
  const topPartnerDuos = useMemo(() => {
    return [...allPairSynergies]
      .filter((p) => p.partnerMatches >= 1)
      .sort((a, b) => {
        if (b.partnerWins !== a.partnerWins) return b.partnerWins - a.partnerWins;
        return b.partnerWinPct - a.partnerWinPct;
      });
  }, [allPairSynergies]);

  // Top rivalries in the club
  const topRivalries = useMemo(() => {
    return [...allPairSynergies]
      .filter((p) => p.opponentMatches >= 1)
      .sort((a, b) => b.opponentMatches - a.opponentMatches);
  }, [allPairSynergies]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-[#103F32] to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 border border-[#84CC16]/40 flex items-center justify-center text-[#84CC16] shadow-sm">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2 font-display">
                <span>Player Head-to-Head & Synergy Matrix</span>
              </h2>
              <p className="text-xs text-white/70">
                Direct player rivalries, partnership chemistry & duo statistics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print comparison card"
              className="touch-target p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 text-xs font-bold"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="touch-target p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="px-5 py-2.5 bg-[#F6F8F7] border-b border-[#E0E7E4] flex items-center justify-between gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E0E7E4] text-xs font-bold shadow-2xs">
            <button
              onClick={() => setActiveSubTab('h2h')}
              className={`touch-target px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeSubTab === 'h2h'
                  ? 'bg-[#103F32] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Head-to-Head Rivalry</span>
            </button>
            <button
              onClick={() => setActiveSubTab('chemistry')}
              className={`touch-target px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeSubTab === 'chemistry'
                  ? 'bg-[#103F32] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Partnership Chemistry</span>
            </button>
            <button
              onClick={() => setActiveSubTab('matrix')}
              className={`touch-target px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeSubTab === 'matrix'
                  ? 'bg-[#103F32] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Club Synergy Grid</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: HEAD-TO-HEAD RIVALRY INSPECTOR */}
          {activeSubTab === 'h2h' && (
            <div className="space-y-6">
              {/* Player Selectors & Matchup Header */}
              <div className="bg-gradient-to-b from-[#F6F8F7] to-white p-4 sm:p-5 rounded-2xl border border-[#E0E7E4] shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
                  {/* Player A Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                      <span>Player A</span>
                    </label>
                    <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-[#E0E7E4] shadow-2xs">
                      {playerA && (
                        <PlayerAvatar
                          avatar={playerA.avatar}
                          name={playerA.name}
                          className="w-10 h-10 rounded-full border border-slate-200 shrink-0"
                        />
                      )}
                      <select
                        value={playerAId}
                        onChange={(e) => setPlayerAId(e.target.value)}
                        className="w-full bg-transparent font-bold text-sm text-[#172033] focus:outline-hidden cursor-pointer"
                      >
                        {sortedPlayers.map((p) => (
                          <option key={`a_${p.id}`} value={p.id} disabled={p.id === playerBId}>
                            {p.name} (Lvl {p.skillRating})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center sm:pt-6">
                    <button
                      onClick={swapPlayers}
                      title="Swap players"
                      className="touch-target p-2.5 rounded-full bg-white border border-[#E0E7E4] hover:bg-[#F6F8F7] text-[#103F32] shadow-xs hover:rotate-180 transition-all duration-300"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Player B Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                      <span>Player B</span>
                    </label>
                    <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-[#E0E7E4] shadow-2xs">
                      {playerB && (
                        <PlayerAvatar
                          avatar={playerB.avatar}
                          name={playerB.name}
                          className="w-10 h-10 rounded-full border border-slate-200 shrink-0"
                        />
                      )}
                      <select
                        value={playerBId}
                        onChange={(e) => setPlayerBId(e.target.value)}
                        className="w-full bg-transparent font-bold text-sm text-[#172033] focus:outline-hidden cursor-pointer"
                      >
                        {sortedPlayers.map((p) => (
                          <option key={`b_${p.id}`} value={p.id} disabled={p.id === playerAId}>
                            {p.name} (Lvl {p.skillRating})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hero Rivalry Banner */}
                {h2hStats && (
                  <div className="mt-6 pt-5 border-t border-[#E0E7E4]">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#103F32] text-white p-4 sm:p-5 rounded-2xl shadow-sm">
                      {/* Player A Score */}
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          avatar={playerA.avatar}
                          name={playerA.name}
                          className="w-12 h-12 rounded-full border-2 border-white/20 shadow-xs"
                        />
                        <div>
                          <div className="text-sm font-black text-white">{playerA.name}</div>
                          <div className="text-2xl font-black font-display text-[#84CC16]">
                            {h2hStats.playerAWins} Wins
                          </div>
                          <div className="text-[11px] text-white/70">
                            Avg {h2hStats.avgPointsA} pts/game
                          </div>
                        </div>
                      </div>

                      {/* Center Versus Badge */}
                      <div className="text-center px-4 py-1.5 bg-white/10 rounded-xl border border-white/15">
                        <div className="text-xs font-black uppercase tracking-widest text-[#84CC16]">
                          {h2hStats.totalOpponentMatches > 0
                            ? `${h2hStats.totalOpponentMatches} Matches Played`
                            : 'No Opponent Matches Yet'}
                        </div>
                        <div className="text-lg font-black tracking-tight text-white mt-0.5">
                          {h2hStats.playerAWins} - {h2hStats.playerBWins}
                        </div>
                        <div className="text-[10px] text-white/80 mt-0.5">
                          {h2hStats.pointDiff > 0
                            ? `${playerA.name} +${h2hStats.pointDiff} pts`
                            : h2hStats.pointDiff < 0
                            ? `${playerB.name} +${Math.abs(h2hStats.pointDiff)} pts`
                            : 'Tied point differential'}
                        </div>
                      </div>

                      {/* Player B Score */}
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="text-sm font-black text-white">{playerB.name}</div>
                          <div className="text-2xl font-black font-display text-white">
                            {h2hStats.playerBWins} Wins
                          </div>
                          <div className="text-[11px] text-white/70">
                            Avg {h2hStats.avgPointsB} pts/game
                          </div>
                        </div>
                        <PlayerAvatar
                          avatar={playerB.avatar}
                          name={playerB.name}
                          className="w-12 h-12 rounded-full border-2 border-white/20 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Breakdown Cards */}
              {h2hStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#F6F8F7] p-3.5 rounded-xl border border-[#E0E7E4]">
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      Point Differential
                    </div>
                    <div className="text-lg font-black text-[#172033] mt-0.5">
                      {h2hStats.pointDiff > 0 ? `+${h2hStats.pointDiff}` : h2hStats.pointDiff}
                    </div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">
                      {h2hStats.playerAPoints} vs {h2hStats.playerBPoints} total
                    </div>
                  </div>

                  <div className="bg-[#F6F8F7] p-3.5 rounded-xl border border-[#E0E7E4]">
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      Current Rivalry Streak
                    </div>
                    <div className="text-lg font-black text-[#172033] mt-0.5 flex items-center gap-1.5">
                      {h2hStats.currentStreakCount > 0 ? (
                        <>
                          <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>
                            {h2hStats.currentStreakHolder === 'playerA'
                              ? playerA.name
                              : playerB.name}{' '}
                            W{h2hStats.currentStreakCount}
                          </span>
                        </>
                      ) : (
                        <span>None</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">Consecutive wins</div>
                  </div>

                  <div className="bg-[#F6F8F7] p-3.5 rounded-xl border border-[#E0E7E4]">
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      Clutch Matches
                    </div>
                    <div className="text-lg font-black text-[#172033] mt-0.5">
                      {h2hStats.clutchGamesCount}
                    </div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">Decided by ≤ 2 points</div>
                  </div>

                  <div className="bg-[#F6F8F7] p-3.5 rounded-xl border border-[#E0E7E4]">
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      As Partners
                    </div>
                    <div className="text-lg font-black text-[#103F32] mt-0.5">
                      {h2hStats.partnerWins}-{h2hStats.partnerLosses} ({h2hStats.partnerWinPct}%)
                    </div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">
                      {h2hStats.matchesAsPartners.length} games together
                    </div>
                  </div>
                </div>
              )}

              {/* Teaming Up Together Section */}
              {h2hStats && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E0E7E4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#172033] flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-[#103F32]" />
                      <span>Chemistry When Teaming Up Together</span>
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        h2hStats.partnerWinPct >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : h2hStats.partnerWinPct >= 50
                          ? 'bg-blue-100 text-blue-800'
                          : h2hStats.matchesAsPartners.length > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {h2hStats.matchesAsPartners.length === 0
                        ? 'Untested Duo'
                        : h2hStats.partnerWinPct >= 75
                        ? '🔥 Elite Chemistry'
                        : h2hStats.partnerWinPct >= 50
                        ? 'Solid Partnership'
                        : 'Developing Chemistry'}
                    </span>
                  </div>

                  {h2hStats.matchesAsPartners.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-[#64748B]">
                        {playerA.name} and {playerB.name} have played{' '}
                        <strong className="text-[#172033]">{h2hStats.matchesAsPartners.length}</strong>{' '}
                        match{h2hStats.matchesAsPartners.length > 1 ? 'es' : ''} on the same team,
                        winning <strong className="text-[#103F32]">{h2hStats.partnerWins}</strong> (
                        {h2hStats.partnerWinPct}% win rate) with a combined point differential of{' '}
                        <strong className="text-[#172033]">
                          {h2hStats.partnerPointDiff > 0
                            ? `+${h2hStats.partnerPointDiff}`
                            : h2hStats.partnerPointDiff}
                        </strong>
                        .
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748B] italic">
                      These two players have not been paired on the same team in completed matches
                      yet. Use the Matchmaker or Manual Match to schedule them together!
                    </p>
                  )}
                </div>
              )}

              {/* Direct Matches Timeline */}
              {h2hStats && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-[#172033] flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Swords className="w-4 h-4 text-[#103F32]" />
                      <span>Head-to-Head Clash Log ({h2hStats.matchesAsOpponents.length})</span>
                    </span>
                  </h3>

                  {h2hStats.matchesAsOpponents.length === 0 ? (
                    <div className="text-center py-8 bg-[#F6F8F7] rounded-2xl border border-dashed border-[#E0E7E4]">
                      <p className="text-xs font-bold text-[#64748B]">
                        No direct head-to-head matches recorded between these two players yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {h2hStats.matchesAsOpponents.map((m, idx) => {
                        const aInA = m.teamA.includes(playerA.id);
                        const aScore = aInA ? m.scoreA : m.scoreB;
                        const bScore = aInA ? m.scoreB : m.scoreA;
                        const aWon = (aScore ?? 0) > (bScore ?? 0);

                        const aPartnerId = (aInA ? m.teamA : m.teamB).find((id) => id !== playerA.id);
                        const bPartnerId = (aInA ? m.teamB : m.teamA).find((id) => id !== playerB.id);

                        const aPartner = aPartnerId ? playersById[aPartnerId] : null;
                        const bPartner = bPartnerId ? playersById[bPartnerId] : null;

                        return (
                          <div
                            key={m.id || idx}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition ${
                              aWon
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#64748B] shrink-0">
                                Court {m.courtNumber}
                              </span>
                              <span className="text-[#64748B]">•</span>
                              <div className="font-bold text-[#172033]">
                                <span>{playerA.name}</span>
                                {aPartner && (
                                  <span className="text-[#64748B] font-normal">
                                    {' '}
                                    & {aPartner.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="font-black text-sm px-2.5 py-1 rounded-lg bg-white border border-[#E0E7E4] shadow-2xs font-display">
                                <span className={aWon ? 'text-[#103F32]' : 'text-[#64748B]'}>
                                  {aScore}
                                </span>{' '}
                                -{' '}
                                <span className={!aWon ? 'text-[#103F32]' : 'text-[#64748B]'}>
                                  {bScore}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  aWon
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-800'
                                }`}
                              >
                                {aWon ? `${playerA.name} Won` : `${playerB.name} Won`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-right">
                              <div className="font-bold text-[#172033]">
                                <span>{playerB.name}</span>
                                {bPartner && (
                                  <span className="text-[#64748B] font-normal">
                                    {' '}
                                    & {bPartner.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PARTNERSHIP CHEMISTRY & INSIGHTS */}
          {activeSubTab === 'chemistry' && (
            <div className="space-y-6">
              <div className="bg-[#103F32] text-white p-5 rounded-2xl shadow-sm">
                <h3 className="text-base font-black font-display flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#84CC16]" />
                  <span>Club Dynamic Duos & Chemistry Leaderboard</span>
                </h3>
                <p className="text-xs text-white/70 mt-1">
                  Ranked by highest win rate and games played as doubles partners
                </p>
              </div>

              {/* Top Duos Grid */}
              <div className="space-y-3">
                {topPartnerDuos.length === 0 ? (
                  <div className="text-center py-12 bg-[#F6F8F7] rounded-2xl border border-dashed border-[#E0E7E4]">
                    <HeartHandshake className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-[#64748B]">
                      No doubles partnership matches completed yet in this session.
                    </p>
                  </div>
                ) : (
                  topPartnerDuos.map((duo, idx) => {
                    const p1 = playersById[duo.player1Id];
                    const p2 = playersById[duo.player2Id];
                    if (!p1 || !p2) return null;

                    return (
                      <div
                        key={`${duo.player1Id}_${duo.player2Id}`}
                        onClick={() => {
                          setPlayerAId(duo.player1Id);
                          setPlayerBId(duo.player2Id);
                          setActiveSubTab('h2h');
                        }}
                        className={`p-4 rounded-2xl border bg-white shadow-xs hover:border-[#103F32] hover:shadow-sm cursor-pointer transition flex items-center justify-between gap-4 ${
                          idx === 0 ? 'border-amber-300 bg-amber-50/20' : 'border-[#E0E7E4]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex -space-x-2 shrink-0">
                            <PlayerAvatar
                              avatar={p1.avatar}
                              name={p1.name}
                              className="w-10 h-10 rounded-full border-2 border-white shadow-2xs"
                            />
                            <PlayerAvatar
                              avatar={p2.avatar}
                              name={p2.name}
                              className="w-10 h-10 rounded-full border-2 border-white shadow-2xs"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-[#172033] truncate">
                                {p1.name} & {p2.name}
                              </span>
                              {idx === 0 && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 shadow-2xs">
                                  👑 #1 Golden Duo
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#64748B] mt-0.5">
                              {duo.partnerMatches} match{duo.partnerMatches > 1 ? 'es' : ''} played
                              together
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-base font-black text-[#103F32] font-display">
                              {duo.partnerWins}W - {duo.partnerLosses}L
                            </div>
                            <div className="text-xs font-bold text-[#64748B]">
                              {duo.partnerWinPct}% Win Rate
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#64748B]" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CLUB SYNERGY MATRIX */}
          {activeSubTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-[#172033] flex items-center gap-2 font-display">
                    <Grid className="w-5 h-5 text-[#103F32]" />
                    <span>Cross-Player Pairing Matrix</span>
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Click any cell to inspect direct head-to-head match logs
                  </p>
                </div>

                <div className="inline-flex items-center gap-1 bg-[#F6F8F7] p-1 rounded-xl text-xs font-bold border border-[#E0E7E4]">
                  <button
                    onClick={() => setMatrixMode('partners')}
                    className={`touch-target px-3 py-1.5 rounded-lg transition ${
                      matrixMode === 'partners'
                        ? 'bg-[#103F32] text-white shadow-2xs'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    As Partners (Duo Win %)
                  </button>
                  <button
                    onClick={() => setMatrixMode('opponents')}
                    className={`touch-target px-3 py-1.5 rounded-lg transition ${
                      matrixMode === 'opponents'
                        ? 'bg-[#103F32] text-white shadow-2xs'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    As Opponents (Rivalry W-L)
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#E0E7E4] bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F6F8F7] border-b border-[#E0E7E4]">
                      <th className="p-3 font-bold text-[#64748B] sticky left-0 bg-[#F6F8F7] z-10 min-w-[120px]">
                        Player
                      </th>
                      {sortedPlayers.map((colPlayer) => (
                        <th
                          key={`col_${colPlayer.id}`}
                          className="p-3 font-bold text-[#172033] text-center min-w-[80px]"
                          title={colPlayer.name}
                        >
                          <div className="truncate max-w-[70px] mx-auto">{colPlayer.name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map((rowPlayer) => (
                      <tr
                        key={`row_${rowPlayer.id}`}
                        className="border-b border-[#E0E7E4] hover:bg-slate-50/50"
                      >
                        <td className="p-3 font-bold text-[#172033] sticky left-0 bg-white z-10 border-r border-[#E0E7E4] flex items-center gap-2">
                          <PlayerAvatar
                            avatar={rowPlayer.avatar}
                            name={rowPlayer.name}
                            className="w-6 h-6 rounded-full shrink-0"
                          />
                          <span className="truncate max-w-[90px]">{rowPlayer.name}</span>
                        </td>

                        {sortedPlayers.map((colPlayer) => {
                          if (rowPlayer.id === colPlayer.id) {
                            return (
                              <td
                                key={`cell_${rowPlayer.id}_${colPlayer.id}`}
                                className="p-3 text-center bg-slate-100/50 text-slate-400 font-bold"
                              >
                                —
                              </td>
                            );
                          }

                          const h2h = calculateHeadToHead(rowPlayer, colPlayer, matches);

                          if (matrixMode === 'partners') {
                            const count = h2h.matchesAsPartners.length;
                            const winPct = h2h.partnerWinPct;

                            return (
                              <td
                                key={`cell_${rowPlayer.id}_${colPlayer.id}`}
                                onClick={() => {
                                  setPlayerAId(rowPlayer.id);
                                  setPlayerBId(colPlayer.id);
                                  setActiveSubTab('h2h');
                                }}
                                className={`p-2.5 text-center font-bold cursor-pointer transition hover:scale-105 ${
                                  count === 0
                                    ? 'text-slate-300'
                                    : winPct >= 75
                                    ? 'bg-emerald-100 text-emerald-900 font-black'
                                    : winPct >= 50
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-amber-50 text-amber-800'
                                }`}
                                title={`${rowPlayer.name} & ${colPlayer.name}: ${h2h.partnerWins}W - ${h2h.partnerLosses}L (${winPct}%)`}
                              >
                                {count > 0 ? (
                                  <div>
                                    <div>{winPct}%</div>
                                    <div className="text-[9px] opacity-75">{count}g</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 font-normal">0g</span>
                                )}
                              </td>
                            );
                          } else {
                            // Opponents
                            const count = h2h.totalOpponentMatches;
                            const wins = h2h.playerAWins;
                            const losses = h2h.playerBWins;

                            return (
                              <td
                                key={`cell_${rowPlayer.id}_${colPlayer.id}`}
                                onClick={() => {
                                  setPlayerAId(rowPlayer.id);
                                  setPlayerBId(colPlayer.id);
                                  setActiveSubTab('h2h');
                                }}
                                className={`p-2.5 text-center font-bold cursor-pointer transition hover:scale-105 ${
                                  count === 0
                                    ? 'text-slate-300'
                                    : wins > losses
                                    ? 'bg-emerald-100 text-emerald-900 font-black'
                                    : wins < losses
                                    ? 'bg-rose-100 text-rose-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                                title={`${rowPlayer.name} vs ${colPlayer.name}: ${wins} - ${losses}`}
                              >
                                {count > 0 ? (
                                  <div>
                                    <div>
                                      {wins}-{losses}
                                    </div>
                                    <div className="text-[9px] opacity-75">{count}g</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 font-normal">0g</span>
                                )}
                              </td>
                            );
                          }
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
