import React, { useState, useMemo } from 'react';
import { Player, SkillLevel, SKILL_LEVEL_LABELS, PlayerStatus, Match, Session } from '../types';
import {
  Users,
  UserPlus,
  Search,
  X,
  Coffee,
  Play,
  Flame,
  AlertCircle,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { PlayerDetailModal } from '../components/PlayerDetailModal';

interface PlayersViewProps {
  players: Player[];
  matches?: Match[];
  session?: Session | null;
  isSessionActive: boolean;
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
  onUpdatePlayerRating: (playerId: string, newRating: SkillLevel) => void;
  onUpdatePlayerStatus: (playerId: string, newStatus: PlayerStatus) => void;
  onDeletePlayer: (playerId: string) => void;
  onUpdatePlayerDetails: (player: Player) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  players,
  matches = [],
  session = null,
  isSessionActive,
  onAddPlayer,
  onUpdatePlayerRating,
  onUpdatePlayerStatus,
  onDeletePlayer,
  onUpdatePlayerDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ratingConfirm, setRatingConfirm] = useState<{ player: Player; newRating: SkillLevel } | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const playersById = useMemo(() => {
    return players.reduce<Record<string, Player>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [players]);

  // New player form state
  const [newName, setNewName] = useState('');
  const [newRating, setNewRating] = useState<SkillLevel>(3);
  const [newAvatar, setNewAvatar] = useState('');

  const filteredPlayers = players.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === 'all' || p.skillRating === ratingFilter;
    return matchesSearch && matchesRating;
  });

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddPlayer({
      name: newName.trim(),
      avatar: newAvatar.trim() || undefined,
      skillRating: newRating,
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
      waitingSince: Date.now(),
      totalWaitingTimeMs: 0,
      teammateHistory: {},
      opponentHistory: {},
    });

    setNewName('');
    setNewAvatar('');
    setNewRating(3);
    setIsAddModalOpen(false);
  };

  const handleRatingChangeRequest = (player: Player, targetRating: SkillLevel) => {
    if (player.skillRating === targetRating) return;
    if (isSessionActive) {
      setRatingConfirm({ player, newRating: targetRating });
    } else {
      onUpdatePlayerRating(player.id, targetRating);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight flex items-center gap-2 font-display">
            <Users className="w-6 h-6 text-[#103F32]" />
            <span>Players Roster ({players.length})</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Organize player ratings (1–5), track record, and toggle court availability
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="cssbuttons-io-button"
        >
          <svg
            height="22"
            width="22"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 0h24v24H0z" fill="none"></path>
            <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" fill="currentColor"></path>
          </svg>
          <span>Add New Player</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E0E7E4] shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:bg-white focus:border-[#103F32] focus:ring-1 focus:ring-[#103F32] transition"
          />
        </div>

        {/* Rating filter segmented tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-xs font-semibold text-[#64748B] mr-1 shrink-0">Filter Level:</span>
          <button
            onClick={() => setRatingFilter('all')}
            className={`touch-target px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
              ratingFilter === 'all'
                ? 'bg-[#103F32] text-white shadow-xs'
                : 'bg-[#F6F8F7] text-[#64748B] border border-[#E0E7E4] hover:bg-[#E0E7E4]/50'
            }`}
          >
            All ({players.length})
          </button>
          {([1, 2, 3, 4, 5] as SkillLevel[]).map((lvl) => {
            const count = players.filter((p) => p.skillRating === lvl).length;
            return (
              <button
                key={lvl}
                onClick={() => setRatingFilter(lvl)}
                className={`touch-target px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  ratingFilter === lvl
                    ? 'bg-[#103F32] text-white shadow-xs'
                    : 'bg-[#F6F8F7] text-[#64748B] border border-[#E0E7E4] hover:bg-[#E0E7E4]/50'
                }`}
              >
                L{lvl} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Players List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPlayers.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white border border-[#E0E7E4] space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#E5F8EC] text-[#103F32] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-[#172033]">
              {players.length === 0 ? 'No players in your roster' : 'No players match your search'}
            </div>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto">
              {players.length === 0
                ? 'Add your club members with skill levels (1–5) to begin organizing fair doubles matches.'
                : 'Try adjusting your search query or skill level filter.'}
            </p>
            {players.length === 0 && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="cssbuttons-io-button mx-auto"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                <span>Add First Player</span>
              </button>
            )}
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const isPlaying = player.status === 'playing';
            const isResting = player.status === 'resting';

            return (
              <div
                key={player.id}
                className="p-4 rounded-2xl bg-white border border-[#E0E7E4] shadow-xs hover:border-[#103F32]/40 transition space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => setSelectedPlayer(player)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer group"
                    title="View player detail & performance trends"
                  >
                    {player.avatar ? (
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#E0E7E4] shrink-0 group-hover:ring-2 group-hover:ring-[#103F32]/30 transition"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#E5F8EC] text-[#103F32] font-bold text-sm flex items-center justify-center shrink-0 border border-[#C4EED3] group-hover:border-[#103F32] transition">
                        {player.name.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-[#172033] truncate max-w-[130px] sm:max-w-none group-hover:text-[#103F32] transition" title={player.name}>
                          {player.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E5F8EC] text-[#103F32] border border-[#C4EED3] shrink-0">
                          L{player.skillRating}
                        </span>
                        {player.streak >= 2 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0 whitespace-nowrap shadow-2xs font-mono tabular-nums">
                            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{player.streak}W</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1.5 flex-wrap font-mono tabular-nums">
                        <span className="whitespace-nowrap">{player.totalGamesPlayed} {player.totalGamesPlayed === 1 ? 'match' : 'matches'}</span>
                        <span className="text-[#64748B]/60">·</span>
                        <span className="text-[#103F32] font-semibold whitespace-nowrap">
                          {player.wins}W - {player.losses}L
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Availability Status Button */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isPlaying ? (
                      <span className="text-[11px] font-bold text-[#103F32] bg-[#E5F8EC] border border-[#C4EED3] px-2.5 py-1 rounded-lg">
                        Playing
                      </span>
                    ) : isResting ? (
                      <button
                        onClick={() => onUpdatePlayerStatus(player.id, 'available')}
                        className="touch-target px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 font-bold text-xs hover:bg-amber-100 transition active:scale-95 flex items-center gap-1.5 shadow-2xs"
                        title="Resting (tap to set Ready for play)"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-amber-600" />
                        <span>Resting</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdatePlayerStatus(player.id, 'resting')}
                        className="touch-target px-3 py-1.5 rounded-xl border border-[#C4EED3] bg-[#E5F8EC] text-[#103F32] font-bold text-xs hover:bg-[#C4EED3]/50 transition active:scale-95 flex items-center gap-1.5 shadow-2xs"
                        title="Ready for play (tap to rest)"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#35D879] animate-pulse" />
                        <span>Ready</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDeletePlayer(player.id)}
                      className="touch-target p-2 rounded-lg text-[#64748B]/60 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove Player"
                      aria-label={`Remove ${player.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rating Level Selector and Stats & Trends Trigger */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between pt-2.5 border-t border-[#E0E7E4] text-xs gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlayer(player)}
                    className="touch-target inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E5F8EC] hover:bg-[#C4EED3]/60 text-[#103F32] font-bold text-[11px] transition border border-[#C4EED3] shrink-0"
                    title="View performance trends & match stats"
                  >
                    <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Stats & Trends</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
                    <span className="text-[10px] text-[#64748B] font-medium mr-0.5 hidden xs:inline">
                      Level:
                    </span>
                    {([1, 2, 3, 4, 5] as SkillLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => handleRatingChangeRequest(player, level)}
                        className={`touch-target w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center shrink-0 ${
                          player.skillRating === level
                            ? 'bg-[#103F32] text-white shadow-2xs'
                            : 'bg-[#F6F8F7] text-[#64748B] border border-[#E0E7E4] hover:bg-[#E0E7E4]/60'
                        }`}
                        aria-label={`Set rating to ${level}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Player Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 border border-[#E0E7E4]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0E7E4]">
              <h3 className="font-bold text-[#172033] text-base font-display">Add New Player</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="touch-target p-1.5 rounded-lg text-[#64748B] hover:text-[#172033]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlayer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">Player Name *</label>
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8F7] text-sm text-[#172033] focus:outline-none focus:bg-white focus:border-[#103F32] border border-[#E0E7E4] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">Skill Level (1–5)</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {([1, 2, 3, 4, 5] as SkillLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewRating(lvl)}
                      className={`touch-target py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                        newRating === lvl
                          ? 'bg-[#103F32] text-white shadow-xs ring-1 ring-[#103F32]'
                          : 'bg-[#F6F8F7] text-[#64748B] border border-[#E0E7E4] hover:bg-[#E0E7E4]/50'
                      }`}
                    >
                      <span>L{lvl}</span>
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-[#64748B] mt-2 p-2.5 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] leading-snug">
                  Level {newRating}: <strong className="text-[#172033]">{SKILL_LEVEL_LABELS[newRating]}</strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#172033] block mb-1">Avatar URL (Optional)</label>
                <input
                  type="url"
                  value={newAvatar}
                  onChange={(e) => setNewAvatar(e.target.value)}
                  placeholder="https://... (or leave empty for initials)"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F6F8F7] text-xs text-[#172033] focus:outline-none focus:bg-white focus:border-[#103F32] border border-[#E0E7E4] transition"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="touch-target flex-1 py-2.5 rounded-xl border border-[#E0E7E4] text-[#64748B] font-bold text-xs hover:bg-[#F6F8F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cssbuttons-io-button flex-1 justify-center"
                >
                  <svg
                    height="18"
                    width="18"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" fill="currentColor"></path>
                  </svg>
                  <span>Create Player</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Player Detail View Modal with Recharts Performance Trends */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={players.find((p) => p.id === selectedPlayer.id) || selectedPlayer}
          matches={matches}
          playersById={playersById}
          session={session}
          onClose={() => setSelectedPlayer(null)}
          onUpdatePlayerRating={onUpdatePlayerRating}
          onUpdatePlayerStatus={onUpdatePlayerStatus}
        />
      )}

      {/* Confirmation Modal for Rating Change */}
      {ratingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-3 border border-[#E0E7E4]">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>Update Player Skill Rating?</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Changing <strong>{ratingConfirm.player.name}</strong> to{' '}
              <strong>Level {ratingConfirm.newRating}</strong> will recalculate upcoming matchmaking pairings for fairness.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRatingConfirm(null)}
                className="touch-target flex-1 py-2.5 rounded-xl border border-[#E0E7E4] text-[#64748B] font-bold text-xs hover:bg-[#F6F8F7]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdatePlayerRating(ratingConfirm.player.id, ratingConfirm.newRating);
                  setRatingConfirm(null);
                }}
                className="touch-target flex-1 py-2.5 rounded-xl bg-[#103F32] text-white font-bold text-xs hover:bg-[#0A2B22] shadow-xs"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
