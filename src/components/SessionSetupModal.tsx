import React, { useState, useMemo } from 'react';
import { Player, RotationMode, RotationConfig, Session } from '../types';
import { DEFAULT_ROTATION_CONFIG } from '../engine/config';
import { DinkaholicsLogo } from './DinkaholicsLogo';
import { PickleballIcon } from './PickleballIcon';
import { PickleballBounceLoader } from './PickleballBounceLoader';
import {
  X,
  Play,
  Sliders,
  Users,
  Layers,
  Trophy,
  HeartHandshake,
  Scale,
  Crown,
  Search,
  Check,
  AlertCircle,
  Sparkles,
  UserPlus,
} from 'lucide-react';

interface SessionSetupModalProps {
  players: Player[];
  onClose: () => void;
  onStartSession: (session: Session) => void;
  onNavigateToPlayers?: () => void;
}

export const SessionSetupModal: React.FC<SessionSetupModalProps> = ({
  players,
  onClose,
  onStartSession,
  onNavigateToPlayers,
}) => {
  const [name, setName] = useState<string>('Dinkaholics Club Open Play');
  const [courtCount, setCourtCount] = useState<number>(2);
  const [rotationMode, setRotationMode] = useState<RotationMode>('balanced');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
    players.map((p) => p.id)
  );
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [winnerStaysRule, setWinnerStaysRule] = useState<'stay_together' | 'split_partners'>('stay_together');
  const [maxConsecutiveGames, setMaxConsecutiveGames] = useState<number>(2);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const togglePlayer = (id: string) => {
    setErrorMessage(null);
    if (selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((pId) => pId !== id));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const handleSelectAll = () => {
    setErrorMessage(null);
    setSelectedPlayerIds(players.map((p) => p.id));
  };

  const handleClearAll = () => {
    setErrorMessage(null);
    setSelectedPlayerIds([]);
  };

  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) return players;
    return players.filter((p) =>
      p.name.toLowerCase().includes(playerSearch.toLowerCase())
    );
  }, [players, playerSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStarting) return;
    if (selectedPlayerIds.length < 4) {
      setErrorMessage('You must select at least 4 participating players to start doubles play.');
      return;
    }
    setErrorMessage(null);
    setIsStarting(true);

    const courtNames: Record<number, string> = {};
    for (let i = 1; i <= courtCount; i++) {
      courtNames[i] = i === 1 ? 'Championship Court' : i === 2 ? 'West Garden Court' : `Court ${i}`;
    }

    const rotationConfig: RotationConfig = {
      ...DEFAULT_ROTATION_CONFIG,
      winnerStaysRule,
      maxConsecutiveGames,
    };

    const activeCourtMatches: Record<number, string | null> = {};
    for (let i = 1; i <= courtCount; i++) {
      activeCourtMatches[i] = null;
    }

    const newSession: Session = {
      id: `session_${Date.now()}`,
      name: name.trim() || 'Dinkaholics Session',
      courtCount,
      courtNames,
      rotationMode,
      rotationConfig,
      status: 'active',
      startTime: Date.now(),
      endTime: null,
      participantIds: selectedPlayerIds,
      activeCourtMatches,
    };

    setTimeout(() => {
      onStartSession(newSession);
    }, 450);
  };

  const maxSimultaneousCourts = Math.floor(selectedPlayerIds.length / 4);
  const isPlayerCountValid = selectedPlayerIds.length >= 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col">
        {/* Header - Signature Dinkaholics Emerald Gradient */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#0F382C] to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <DinkaholicsLogo size="md" />
            <div>
              <h2 className="text-lg font-black text-white tracking-tight font-display flex items-center gap-2">
                <span>Configure New Session</span>
              </h2>
              <p className="text-xs text-white/70 mt-0.5">
                Set up court count, matchmaking algorithm, and player roster
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="touch-target p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Session Name */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
              Session Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Thursday Club Open Play"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0F382C] focus:ring-1 focus:ring-[#0F382C] transition"
              required
            />
          </div>

          {/* Section 2: Court Count Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Available Courts
              </label>
              <span className="text-xs font-bold font-mono text-[#0F382C] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {courtCount} {courtCount === 1 ? 'Court' : 'Courts'} ({courtCount * 4} players live)
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((count) => {
                const isSelected = courtCount === count;
                return (
                  <button
                    type="button"
                    key={count}
                    onClick={() => setCourtCount(count)}
                    className={`touch-target py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border ${
                      isSelected
                        ? 'border-[#0F382C] bg-emerald-50 text-[#0F382C] shadow-2xs ring-1 ring-[#0F382C]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <Layers className={`w-4 h-4 ${isSelected ? 'text-[#0F382C]' : 'text-slate-400'}`} />
                    <span>{count} {count === 1 ? 'Court' : 'Courts'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Rotation Mode Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Matchmaking & Rotation Algorithm
              </label>
              <span className="text-[11px] text-slate-400">Can be switched live anytime</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Balanced Mode */}
              <button
                type="button"
                onClick={() => setRotationMode('balanced')}
                className={`touch-target p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  rotationMode === 'balanced'
                    ? 'border-[#0F382C] bg-emerald-50/70 text-[#0F382C] shadow-2xs ring-1.5 ring-[#0F382C]'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    rotationMode === 'balanced'
                      ? 'bg-[#0F382C] text-white border-[#0F382C]'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <Scale className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Balanced Parity</span>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-[#0F382C]">
                      Default
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Minimizes skill rating gap and guarantees fair rest queue priority
                  </div>
                </div>
              </button>

              {/* King of the Court / Ladder Mode */}
              <button
                type="button"
                onClick={() => setRotationMode('king_of_court')}
                className={`touch-target p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  rotationMode === 'king_of_court'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-900 shadow-2xs ring-1.5 ring-amber-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    rotationMode === 'king_of_court'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <Crown className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">King of Court / Ladder</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Winners climb up toward Court 1; losers bump down to defend
                  </div>
                </div>
              </button>

              {/* Winner-Stays Mode */}
              <button
                type="button"
                onClick={() => setRotationMode('winner_stays')}
                className={`touch-target p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  rotationMode === 'winner_stays'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-2xs ring-1.5 ring-emerald-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    rotationMode === 'winner_stays'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">Winner-Stays</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Winning pairs hold the court against next waiting challengers
                  </div>
                </div>
              </button>

              {/* Social Mode */}
              <button
                type="button"
                onClick={() => setRotationMode('social')}
                className={`touch-target p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  rotationMode === 'social'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 shadow-2xs ring-1.5 ring-blue-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    rotationMode === 'social'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">Social Mixer</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Maximizes partner variety, welcoming novel matchups every round
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Mode Sub-Settings (e.g. Winner-Stays rules) */}
          {rotationMode === 'winner_stays' && (
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
              <div className="text-xs font-bold text-[#0F382C] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#0F382C]" />
                <span>Winner-Stays Rotation Rules</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Partnership Behavior
                  </label>
                  <select
                    value={winnerStaysRule}
                    onChange={(e) => setWinnerStaysRule(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0F382C]"
                  >
                    <option value="stay_together">Keep Partners Together</option>
                    <option value="split_partners">Split & Pair with Challengers</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Max Consecutive Games
                  </label>
                  <select
                    value={maxConsecutiveGames}
                    onChange={(e) => setMaxConsecutiveGames(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0F382C]"
                  >
                    <option value={2}>2 Games Max (Enforce Fair Rest)</option>
                    <option value={3}>3 Games Max</option>
                    <option value={4}>4 Games Max</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Participating Players Selection */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Select Participating Players
                </label>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {selectedPlayerIds.length} of {players.length} players participating
                  {isPlayerCountValid ? (
                    <span className="text-emerald-700 font-semibold ml-1.5">
                      · Can fill {Math.min(courtCount, maxSimultaneousCourts)} courts ({selectedPlayerIds.length - Math.min(courtCount, maxSimultaneousCourts) * 4} resting)
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold ml-1.5">
                      · Need at least 4 players
                    </span>
                  )}
                </div>
              </div>

              {/* Action Pills */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="touch-target px-2.5 py-1 rounded-lg text-xs font-bold text-[#0F382C] bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="touch-target px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Quick Filter Search Box */}
            <div className="relative mb-2.5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Filter player list..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0F382C] transition"
              />
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1 rounded-2xl border border-slate-100 bg-slate-50/50">
              {filteredPlayers.length === 0 ? (
                <div className="col-span-full p-5 text-center text-xs text-slate-500 space-y-2">
                  {players.length === 0 ? (
                    <>
                      <p className="font-bold text-slate-700">No players in roster yet</p>
                      <p className="text-slate-400 max-w-xs mx-auto">
                        Add at least 4 club players with skill levels (1–5) to start automated fair matchmaking.
                      </p>
                      {onNavigateToPlayers && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToPlayers();
                          }}
                          className="touch-target inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F382C] text-white text-xs font-bold hover:bg-[#144637] transition shadow-xs mt-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Go to Players Screen & Add Players</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <span>No players match your search filter.</span>
                  )}
                </div>
              ) : (
                filteredPlayers.map((p) => {
                  const isSelected = selectedPlayerIds.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => togglePlayer(p.id)}
                      className={`touch-target p-2 rounded-xl border text-left transition flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? 'border-[#0F382C] bg-emerald-50/70 text-slate-900 shadow-2xs ring-1 ring-[#0F382C]/50'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-[#0F382C] font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                            {p.name.charAt(0)}
                          </div>
                        )}

                        <div className="truncate">
                          <div className="text-xs font-bold truncate text-slate-900 leading-tight">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight">
                            L{p.skillRating}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-[#0F382C] border-[#0F382C] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Validation Alert if < 4 players */}
          {!isPlayerCountValid && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate sm:whitespace-normal">
                  {players.length < 4
                    ? `Roster has ${players.length} player${players.length === 1 ? '' : 's'}. You need at least 4 players for doubles.`
                    : 'Please select at least 4 players to enable automated doubles matchmaking.'}
                </span>
              </div>
              {onNavigateToPlayers && players.length < 4 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToPlayers();
                  }}
                  className="touch-target shrink-0 px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-[11px] hover:bg-amber-300 transition"
                >
                  Add Players
                </button>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          {isStarting ? (
            <div className="w-full flex items-center justify-center py-1">
              <PickleballBounceLoader
                size="sm"
                theme="light"
                message="Launching Dinkaholics Session..."
                submessage="Configuring active courts and waiting queue"
              />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="touch-target px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isPlayerCountValid}
                className="touch-target px-6 py-2.5 rounded-xl bg-[#0F382C] text-white font-bold text-xs hover:bg-[#144637] transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-md font-display"
              >
                <Play className="w-4 h-4 fill-current text-[#84CC16]" />
                <span>Launch Session ({selectedPlayerIds.length} Players)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
