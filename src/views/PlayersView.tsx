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
  Swords,
  ArrowUpDown,
} from 'lucide-react';
import { PlayerDetailModal } from '../components/PlayerDetailModal';

export type PlayerSortBy = 'name' | 'skill';
export type PlayerSortDirection = 'asc' | 'desc';

interface PlayersViewProps {
  players: Player[];
  matches?: Match[];
  session?: Session | null;
  isSessionActive: boolean;
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
  onBatchAddPlayers?: (players: Array<Omit<Player, 'id'>>) => void;
  onLoadSamplePlayers?: () => void;
  onUpdatePlayerRating: (playerId: string, newRating: SkillLevel) => void;
  onUpdatePlayerStatus: (playerId: string, newStatus: PlayerStatus) => void;
  onDeletePlayer: (playerId: string) => void;
  onUpdatePlayerDetails: (player: Player) => void;
  onOpenHeadToHead?: (playerAId?: string) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  players,
  matches = [],
  session = null,
  isSessionActive,
  onAddPlayer,
  onBatchAddPlayers,
  onLoadSamplePlayers,
  onUpdatePlayerRating,
  onUpdatePlayerStatus,
  onDeletePlayer,
  onUpdatePlayerDetails,
  onOpenHeadToHead,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'batch'>('single');
  const [ratingConfirm, setRatingConfirm] = useState<{ player: Player; newRating: SkillLevel } | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Sorting state: order by alphabetical name or skill level rating
  const [sortBy, setSortBy] = useState<PlayerSortBy>(() => {
    try {
      const saved = localStorage.getItem('picklematch_player_sort_by');
      if (saved === 'skill' || saved === 'name') return saved;
    } catch {}
    return 'name';
  });

  const [sortDirection, setSortDirection] = useState<PlayerSortDirection>(() => {
    try {
      const saved = localStorage.getItem('picklematch_player_sort_direction');
      if (saved === 'asc' || saved === 'desc') return saved;
    } catch {}
    return 'asc';
  });

  const handleSortChange = (newSortBy: PlayerSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort direction
      const nextDir: PlayerSortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(nextDir);
      try {
        localStorage.setItem('picklematch_player_sort_direction', nextDir);
      } catch {}
    } else {
      setSortBy(newSortBy);
      // Sensible defaults: alphabetical A-Z, skill level 5 to 1 (desc)
      const nextDir: PlayerSortDirection = newSortBy === 'skill' ? 'desc' : 'asc';
      setSortDirection(nextDir);
      try {
        localStorage.setItem('picklematch_player_sort_by', newSortBy);
        localStorage.setItem('picklematch_player_sort_direction', nextDir);
      } catch {}
    }
  };

  const playersById = useMemo(() => {
    return players.reduce<Record<string, Player>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [players]);

  // Single player form state
  const [newName, setNewName] = useState('');
  const [newRating, setNewRating] = useState<SkillLevel>(3);
  const [newAvatar, setNewAvatar] = useState('');

  // Batch add form state
  const [batchText, setBatchText] = useState('');
  const [batchDefaultRating, setBatchDefaultRating] = useState<SkillLevel>(3);

  const filteredPlayers = players.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === 'all' || p.skillRating === ratingFilter;
    return matchesSearch && matchesRating;
  });

  // Apply active sorting ordering (Alphabetical vs Skill Level)
  const displayedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      if (sortBy === 'skill') {
        const ratingDiff =
          sortDirection === 'desc'
            ? b.skillRating - a.skillRating
            : a.skillRating - b.skillRating;
        if (ratingDiff !== 0) return ratingDiff;
        // Secondary sort: Alphabetical by name
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      } else {
        // Alphabetical sort by name
        const nameComp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        if (nameComp !== 0) {
          return sortDirection === 'asc' ? nameComp : -nameComp;
        }
        // Secondary sort: Skill rating high-to-low
        return b.skillRating - a.skillRating;
      }
    });
  }, [filteredPlayers, sortBy, sortDirection]);

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

  const handleCreateBatchPlayers = (e: React.FormEvent) => {
    e.preventDefault();
    const rawNames = batchText
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (rawNames.length === 0) return;

    const newPlayers: Array<Omit<Player, 'id'>> = rawNames.map((name, index) => ({
      name,
      skillRating: batchDefaultRating,
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
      waitingSince: Date.now() - index * 1000,
      totalWaitingTimeMs: 0,
      teammateHistory: {},
      opponentHistory: {},
    }));

    if (onBatchAddPlayers) {
      onBatchAddPlayers(newPlayers);
    } else {
      newPlayers.forEach((p) => onAddPlayer(p));
    }

    setBatchText('');
    setBatchDefaultRating(3);
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

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenHeadToHead && (
            <button
              type="button"
              onClick={() => onOpenHeadToHead()}
              className="touch-target inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F6F8F7] text-[#103F32] font-bold text-xs shadow-2xs transition active:scale-95 border border-[#E0E7E4]"
            >
              <Swords className="w-4 h-4 text-[#103F32]" />
              <span>Head-to-Head</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setAddMode('batch');
              setIsAddModalOpen(true);
            }}
            className="touch-target inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-[#F6F8F7] text-[#103F32] font-bold text-xs shadow-2xs transition active:scale-95 border border-[#E0E7E4]"
          >
            <Users className="w-4 h-4 text-[#103F32]" />
            <span>Batch Add</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAddMode('single');
              setIsAddModalOpen(true);
            }}
            className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#103F32] hover:bg-[#165644] text-white font-bold text-xs shadow-xs transition active:scale-95 border border-[#103F32]/10"
          >
            <UserPlus className="w-4 h-4 stroke-[2.2] text-[#35D879]" />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="p-4 rounded-2xl bg-white border border-[#E0E7E4] shadow-xs space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:bg-white focus:border-[#103F32] focus:ring-1 focus:ring-[#103F32] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="touch-target p-1 absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172033]"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter & Sort Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2.5 border-t border-[#F1F5F3]">
          {/* Rating filter segmented tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-xs font-semibold text-[#64748B] mr-1 shrink-0">Filter:</span>
            <button
              type="button"
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
                  type="button"
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

          {/* Sorting Toggle: Alphabetical vs Skill Level */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <span className="text-xs font-semibold text-[#64748B] shrink-0 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#103F32]" />
              <span>Sort:</span>
            </span>

            <div className="inline-flex items-center p-0.5 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] text-xs font-bold shadow-2xs">
              {/* Alphabetical Sort Button */}
              <button
                type="button"
                onClick={() => handleSortChange('name')}
                className={`touch-target px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 ${
                  sortBy === 'name'
                    ? 'bg-[#103F32] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
                title="Sort roster alphabetically by name (click again to reverse order)"
                aria-pressed={sortBy === 'name'}
              >
                <span>Alphabetical</span>
                <span
                  className={`text-[10px] px-1 py-0.5 rounded font-mono font-bold leading-none ${
                    sortBy === 'name' ? 'bg-white/20 text-white' : 'bg-white border border-[#E0E7E4] text-[#64748B]'
                  }`}
                >
                  {sortBy === 'name' && sortDirection === 'desc' ? 'Z→A' : 'A→Z'}
                </span>
              </button>

              {/* Skill Level Sort Button */}
              <button
                type="button"
                onClick={() => handleSortChange('skill')}
                className={`touch-target px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 ${
                  sortBy === 'skill'
                    ? 'bg-[#103F32] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
                title="Sort roster by skill rating (click again to reverse order)"
                aria-pressed={sortBy === 'skill'}
              >
                <span>Skill Level</span>
                <span
                  className={`text-[10px] px-1 py-0.5 rounded font-mono font-bold leading-none ${
                    sortBy === 'skill' ? 'bg-white/20 text-white' : 'bg-white border border-[#E0E7E4] text-[#64748B]'
                  }`}
                >
                  {sortBy === 'skill' && sortDirection === 'asc' ? '1→5' : '5→1'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Active sort & filter feedback summary */}
        {players.length > 0 && (
          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
            <span>
              Showing <strong className="text-[#172033]">{displayedPlayers.length}</strong> of{' '}
              <strong className="text-[#172033]">{players.length}</strong> players
            </span>
            <span className="font-medium">
              Order: <strong className="text-[#103F32]">
                {sortBy === 'name'
                  ? sortDirection === 'asc'
                    ? 'Name (A to Z)'
                    : 'Name (Z to A)'
                  : sortDirection === 'desc'
                  ? 'Skill Level (High to Low)'
                  : 'Skill Level (Low to High)'}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Players List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayedPlayers.length === 0 ? (
          <div className="col-span-full p-10 sm:p-12 text-center rounded-2xl bg-white border border-[#E0E7E4] space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#E5F8EC] text-[#103F32] flex items-center justify-center mx-auto shadow-2xs">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#172033] font-display">
                {players.length === 0 ? 'Your Roster is Empty' : 'No players match your search or filter'}
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                {players.length === 0
                  ? 'Add your club players manually with their skill levels (1–5) to start scheduling fair, balanced doubles matches.'
                  : 'Try adjusting your search query or skill level filter to see more players.'}
              </p>
            </div>

            {players.length === 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddMode('single');
                    setIsAddModalOpen(true);
                  }}
                  className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#103F32] hover:bg-[#165644] text-white font-bold text-xs shadow-xs transition active:scale-95 border border-[#103F32]/10"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.2] text-[#35D879]" />
                  <span>Add First Player</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddMode('batch');
                    setIsAddModalOpen(true);
                  }}
                  className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F6F8F7] text-[#103F32] font-bold text-xs shadow-xs transition active:scale-95 border border-[#E0E7E4]"
                >
                  <Users className="w-4 h-4 text-[#103F32]" />
                  <span>Batch Add Roster</span>
                </button>
                {onLoadSamplePlayers && (
                  <button
                    type="button"
                    onClick={onLoadSamplePlayers}
                    className="touch-target px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#172033] hover:underline"
                  >
                    Load 8 Sample Players
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRatingFilter('all');
                }}
                className="touch-target px-3.5 py-1.5 rounded-xl bg-[#E5F8EC] text-[#103F32] border border-[#C4EED3] font-bold text-xs hover:bg-[#C4EED3] transition inline-flex items-center gap-1.5 mx-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear search & filter</span>
              </button>
            )}
          </div>
        ) : (
          displayedPlayers.map((player) => {
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
              <div className="flex items-center gap-1.5 p-1 bg-[#F6F8F7] border border-[#E0E7E4] rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAddMode('single')}
                  className={`px-3 py-1 rounded-lg transition ${
                    addMode === 'single'
                      ? 'bg-[#103F32] text-white shadow-2xs'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  Single Player
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('batch')}
                  className={`px-3 py-1 rounded-lg transition ${
                    addMode === 'batch'
                      ? 'bg-[#103F32] text-white shadow-2xs'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  Batch Paste
                </button>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="touch-target p-1.5 rounded-lg text-[#64748B] hover:text-[#172033]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addMode === 'single' ? (
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
                    className="touch-target flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#103F32] hover:bg-[#165644] text-white font-bold text-xs shadow-xs transition active:scale-95 border border-[#103F32]/10"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.2] text-[#35D879]" />
                    <span>Create Player</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateBatchPlayers} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">
                    Player Names (separated by commas or newlines) *
                  </label>
                  <textarea
                    autoFocus
                    rows={4}
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    placeholder="John Doe&#10;Sarah Smith&#10;Alex Wong&#10;Maria Garcia"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8F7] text-xs text-[#172033] focus:outline-none focus:bg-white focus:border-[#103F32] border border-[#E0E7E4] transition leading-relaxed font-sans"
                  />
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Tip: Paste a roster from spreadsheets or group chats.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172033] block mb-1">Default Skill Level</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as SkillLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setBatchDefaultRating(lvl)}
                        className={`touch-target py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                          batchDefaultRating === lvl
                            ? 'bg-[#103F32] text-white shadow-xs ring-1 ring-[#103F32]'
                            : 'bg-[#F6F8F7] text-[#64748B] border border-[#E0E7E4] hover:bg-[#E0E7E4]/50'
                        }`}
                      >
                        <span>L{lvl}</span>
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-2 p-2 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4]">
                    Default: Level {batchDefaultRating} ({SKILL_LEVEL_LABELS[batchDefaultRating]}). Ratings can be fine-tuned anytime.
                  </div>
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
                    className="touch-target flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#103F32] hover:bg-[#165644] text-white font-bold text-xs shadow-xs transition active:scale-95 border border-[#103F32]/10"
                  >
                    <Users className="w-4 h-4 text-[#35D879]" />
                    <span>Add All Players</span>
                  </button>
                </div>
              </form>
            )}
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
          onOpenHeadToHead={(pId) => {
            setSelectedPlayer(null);
            onOpenHeadToHead?.(pId);
          }}
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
