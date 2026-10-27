import React, { useState } from 'react';
import { Player, MatchCandidate } from '../types';
import { calculateBalanceScore } from '../engine/matchmaker';
import {
  ArrowLeft,
  X,
  UserPlus,
  Menu,
  Sparkles,
} from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

interface ManualMatchModalProps {
  courtNumber: number;
  courtName: string;
  availablePlayers: Player[];
  onClose: () => void;
  onStartCustomMatch: (courtNumber: number, candidate: MatchCandidate) => void;
}

export const ManualMatchModal: React.FC<ManualMatchModalProps> = ({
  courtNumber,
  courtName,
  availablePlayers,
  onClose,
  onStartCustomMatch,
}) => {
  const [teamAIds, setTeamAIds] = useState<string[]>([]);
  const [teamBIds, setTeamBIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const getPlayer = (id: string) => availablePlayers.find((p) => p.id === id);

  const teamAPlayers = teamAIds.map(getPlayer).filter((p): p is Player => p !== undefined);
  const teamBPlayers = teamBIds.map(getPlayer).filter((p): p is Player => p !== undefined);

  const ratingA = teamAPlayers.reduce((sum, p) => sum + p.skillRating, 0);
  const ratingB = teamBPlayers.reduce((sum, p) => sum + p.skillRating, 0);
  const diff = Math.abs(ratingA - ratingB);

  const isReady = teamAPlayers.length === 2 && teamBPlayers.length === 2;

  const handleTogglePlayer = (player: Player) => {
    if (teamAIds.includes(player.id)) {
      setTeamAIds(teamAIds.filter((id) => id !== player.id));
    } else if (teamBIds.includes(player.id)) {
      setTeamBIds(teamBIds.filter((id) => id !== player.id));
    } else {
      if (teamAIds.length < 2) {
        setTeamAIds([...teamAIds, player.id]);
      } else if (teamBIds.length < 2) {
        setTeamBIds([...teamBIds, player.id]);
      }
    }
  };

  // Auto balance the 4 selected players
  const handleAutoBalanceSelected = () => {
    const all = [...teamAPlayers, ...teamBPlayers];
    if (all.length !== 4) return;
    const [p1, p2, p3, p4] = all;
    const pairs: Array<[[Player, Player], [Player, Player]]> = [
      [[p1, p2], [p3, p4]],
      [[p1, p3], [p2, p4]],
      [[p1, p4], [p2, p3]],
    ];
    let best = pairs[0];
    let bestScore = -1;
    for (const [tA, tB] of pairs) {
      const balance = calculateBalanceScore(tA, tB);
      if (balance.score > bestScore) {
        bestScore = balance.score;
        best = [tA, tB];
      }
    }
    setTeamAIds([best[0][0].id, best[0][1].id]);
    setTeamBIds([best[1][0].id, best[1][1].id]);
  };

  const handleCreate = () => {
    if (!isReady) return;
    const balance = calculateBalanceScore(
      [teamAPlayers[0], teamAPlayers[1]],
      [teamBPlayers[0], teamBPlayers[1]]
    );
    const candidate: MatchCandidate = {
      courtNumber,
      teamA: [teamAPlayers[0].id, teamAPlayers[1].id],
      teamB: [teamBPlayers[0].id, teamBPlayers[1].id],
      teamARating: ratingA,
      teamBRating: ratingB,
      ratingDiff: diff,
      balanceScore: Number(balance.score.toFixed(1)),
      fairnessScore: 8.5,
      varietyScore: 8.5,
      overallScore: Number(balance.score.toFixed(1)),
      explanation: `Manual organizer arrangement on ${courtName} (Rating: ${ratingA} vs ${ratingB}).`,
      ruleTags: ['manual_custom_assignment'],
    };
    onStartCustomMatch(courtNumber, candidate);
  };

  const filteredPool = availablePlayers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-[#E0E7E4] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 pb-2 border-b border-[#E0E7E4] bg-[#F6F8F7]">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onClose}
              className="touch-target p-1 rounded-lg text-[#172033] hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-[#172033] text-sm font-display">{courtName} · Create Match</h3>
            <button
              onClick={onClose}
              className="touch-target p-1 rounded-lg text-[#64748B] hover:text-[#172033] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-1.5 h-1">
            <div className={`flex-1 rounded-full ${teamAPlayers.length > 0 ? 'bg-[#103F32]' : 'bg-[#E0E7E4]'}`} />
            <div className={`flex-1 rounded-full ${teamBPlayers.length > 0 ? 'bg-[#103F32]' : 'bg-[#E0E7E4]'}`} />
            <div className={`flex-1 rounded-full ${isReady ? 'bg-[#35D879]' : 'bg-[#E0E7E4]'}`} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Player Search Input */}
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search available players..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:bg-white focus:border-[#103F32] transition"
            />
            <UserPlus className="w-4 h-4 text-[#64748B] absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* TEAM 1 Bucket */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#E5F8EC] border border-[#C4EED3] text-xs font-bold text-[#103F32]">
              <span className="uppercase tracking-wider">TEAM 1</span>
              <span className="text-[11px] text-[#103F32] font-mono tabular-nums">
                {teamAPlayers.length}/2 players · Rating: {ratingA}
              </span>
            </div>

            <div className="space-y-1.5">
              {teamAPlayers.length === 0 ? (
                <div className="text-xs text-[#64748B] italic p-3 text-center border-2 border-dashed border-[#E0E7E4] rounded-xl bg-[#F6F8F7]">
                  Tap 2 players below for Team 1
                </div>
              ) : (
                teamAPlayers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleTogglePlayer(p)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E0E7E4] shadow-2xs cursor-pointer hover:border-rose-400 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Menu className="w-4 h-4 text-[#64748B]" />
                      <PlayerAvatar avatar={p.avatar} name={p.name} className="w-7 h-7 rounded-full border border-[#E0E7E4]" />
                      <div>
                        <div className="text-xs font-bold text-[#172033]">{p.name}</div>
                        <div className="text-[10px] text-[#64748B] font-mono tabular-nums">Level {p.skillRating}</div>
                      </div>
                    </div>
                    <span className="text-xs text-rose-500 font-bold pr-1">✕</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TEAM 2 Bucket */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] text-xs font-bold text-[#172033]">
              <span className="uppercase tracking-wider">TEAM 2</span>
              <span className="text-[11px] text-[#64748B] font-mono tabular-nums">
                {teamBPlayers.length}/2 players · Rating: {ratingB}
              </span>
            </div>

            <div className="space-y-1.5">
              {teamBPlayers.length === 0 ? (
                <div className="text-xs text-[#64748B] italic p-3 text-center border-2 border-dashed border-[#E0E7E4] rounded-xl bg-[#F6F8F7]">
                  Tap 2 players below for Team 2
                </div>
              ) : (
                teamBPlayers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleTogglePlayer(p)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E0E7E4] shadow-2xs cursor-pointer hover:border-rose-400 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Menu className="w-4 h-4 text-[#64748B]" />
                      <PlayerAvatar avatar={p.avatar} name={p.name} className="w-7 h-7 rounded-full border border-[#E0E7E4]" />
                      <div>
                        <div className="text-xs font-bold text-[#172033]">{p.name}</div>
                        <div className="text-[10px] text-[#64748B] font-mono tabular-nums">Level {p.skillRating}</div>
                      </div>
                    </div>
                    <span className="text-xs text-rose-500 font-bold pr-1">✕</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Auto Rebalance Split for chosen 4 */}
          {isReady && (
            <button
              onClick={handleAutoBalanceSelected}
              className="touch-target w-full py-2.5 px-3 rounded-xl bg-[#E5F8EC] text-[#103F32] border border-[#C4EED3] font-bold text-xs hover:bg-[#C4EED3]/60 transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#103F32] shrink-0" />
              <span className="whitespace-nowrap">Auto-Balance Teams (Diff: {diff})</span>
            </button>
          )}

          {/* Available Roster */}
          <div className="pt-2">
            <div className="text-xs font-bold text-[#172033] mb-2">
              Available Players ({filteredPool.length})
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {filteredPool.map((p) => {
                const isA = teamAIds.includes(p.id);
                const isB = teamBIds.includes(p.id);

                return (
                  <button
                    key={p.id}
                    onClick={() => handleTogglePlayer(p)}
                    className={`touch-target p-2 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                      isA
                        ? 'bg-[#E5F8EC] border-[#103F32] text-[#103F32] font-bold'
                        : isB
                        ? 'bg-[#F6F8F7] border-[#103F32] text-[#172033] font-bold'
                        : 'bg-white border-[#E0E7E4] text-[#172033] hover:bg-[#F6F8F7]'
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate">{p.name}</div>
                      <div className="text-[10px] text-[#64748B] font-normal font-mono tabular-nums">Level {p.skillRating}</div>
                    </div>
                    {isA && <span className="text-[9px] bg-[#103F32] text-white px-1.5 py-0.5 rounded font-mono">T1</span>}
                    {isB && <span className="text-[9px] bg-[#103F32] text-white px-1.5 py-0.5 rounded font-mono">T2</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#E0E7E4] flex items-center gap-3 bg-white">
          <button
            onClick={onClose}
            className="touch-target flex-1 py-2.5 rounded-xl border border-[#E0E7E4] text-[#64748B] font-bold text-xs hover:bg-[#F6F8F7] hover:text-[#172033] transition active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!isReady}
            className="cssbuttons-io-button flex-1 justify-center disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>Start Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};
