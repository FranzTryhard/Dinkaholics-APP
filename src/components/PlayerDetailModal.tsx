import React from 'react';
import { Player, Match, Session, SkillLevel, SKILL_LEVEL_LABELS, PlayerStatus } from '../types';
import { PlayerPerformanceTrendsChart } from './PlayerPerformanceTrendsChart';
import { PlayerAvatar } from './PlayerAvatar';
import {
  X,
  Trophy,
  Flame,
  Coffee,
  Play,
  Calendar,
  ShieldCheck,
  UserCheck,
  Swords,
  Clock,
  Sparkles,
} from 'lucide-react';

interface PlayerDetailModalProps {
  player: Player;
  matches: Match[];
  playersById: Record<string, Player>;
  session: Session | null;
  onClose: () => void;
  onUpdatePlayerRating?: (playerId: string, newRating: SkillLevel) => void;
  onUpdatePlayerStatus?: (playerId: string, newStatus: PlayerStatus) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  matches,
  playersById,
  session,
  onClose,
  onUpdatePlayerRating,
  onUpdatePlayerStatus,
}) => {
  // Chronological list of completed matches for this player in session
  const playerSessionMatches = matches
    .filter((m) => {
      const matchesSession = session ? m.sessionId === session.id : true;
      const involvesPlayer = m.teamA?.includes(player.id) || m.teamB?.includes(player.id);
      return matchesSession && involvesPlayer && m.status === 'completed';
    })
    .sort((a, b) => (b.confirmedAt || b.startTime) - (a.confirmedAt || a.startTime));

  const winRate =
    player.totalGamesPlayed > 0
      ? Math.round((player.wins / player.totalGamesPlayed) * 100)
      : 0;

  const sessionWinRate =
    player.sessionGamesPlayed > 0
      ? Math.round((player.sessionWins / player.sessionGamesPlayed) * 100)
      : 0;

  const isPlaying = player.status === 'playing';
  const isResting = player.status === 'resting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-[#0F382C] to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <PlayerAvatar
              avatar={player.avatar}
              name={player.name}
              className="w-12 h-12 rounded-2xl border-2 border-white/20 shadow-md shrink-0"
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white truncate font-display">
                  {player.name}
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#84CC16] text-slate-950 shadow-2xs">
                  Level {player.skillRating}
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5 flex items-center gap-2">
                <span>{SKILL_LEVEL_LABELS[player.skillRating]}</span>
                <span>•</span>
                <span>{player.status.toUpperCase()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Status Toggle */}
            {onUpdatePlayerStatus && !isPlaying && (
              <button
                type="button"
                onClick={() =>
                  onUpdatePlayerStatus(player.id, isResting ? 'available' : 'resting')
                }
                className={`touch-target px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isResting
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-amber-400/30'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
              >
                {isResting ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Set Ready</span>
                  </>
                ) : (
                  <>
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Resting</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="touch-target p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Top Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Session Record
              </span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                {player.sessionWins}W - {player.sessionLosses}L
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">
                {sessionWinRate}% win rate
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                All-Time Matches
              </span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                {player.wins}W - {player.losses}L
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {player.totalGamesPlayed} total ({winRate}%)
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Current Streak
              </span>
              <div className="text-base font-black font-mono mt-0.5 flex items-center gap-1.5">
                <span
                  className={
                    player.streak > 0
                      ? 'text-amber-600'
                      : player.streak < 0
                      ? 'text-slate-500'
                      : 'text-slate-700'
                  }
                >
                  {player.streak > 0
                    ? `${player.streak}W Streak`
                    : player.streak < 0
                    ? `${Math.abs(player.streak)}L Streak`
                    : 'Even'}
                </span>
                {player.streak >= 2 && <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {player.streak > 0 ? 'Active momentum' : 'Ready to rebound'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Skill Level
              </span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                Level {player.skillRating}
              </div>
              <span className="text-[11px] text-slate-500 font-medium truncate block">
                {SKILL_LEVEL_LABELS[player.skillRating]}
              </span>
            </div>
          </div>

          {/* Performance Trends Chart with Recharts */}
          <PlayerPerformanceTrendsChart
            player={player}
            matches={matches}
            playersById={playersById}
            currentSessionId={session?.id}
          />

          {/* Session Match-by-Match History List */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0F382C]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">
                  Session Match History ({playerSessionMatches.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Chronological</span>
            </div>

            {playerSessionMatches.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-50 text-slate-400 text-xs">
                No completed matches for this player in the current session.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {playerSessionMatches.map((m, idx) => {
                  const isTeamA = m.teamA.includes(player.id);
                  const teamScore = isTeamA ? (m.scoreA ?? 0) : (m.scoreB ?? 0);
                  const oppScore = isTeamA ? (m.scoreB ?? 0) : (m.scoreA ?? 0);
                  const isWin =
                    (isTeamA && m.winnerTeam === 'teamA') ||
                    (!isTeamA && m.winnerTeam === 'teamB');

                  const partnerId = isTeamA
                    ? m.teamA.find((id) => id !== player.id)
                    : m.teamB.find((id) => id !== player.id);
                  const oppIds = isTeamA ? m.teamB : m.teamA;

                  const partner = partnerId ? playersById[partnerId] : null;

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center font-mono shrink-0 ${
                            isWin
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isWin ? 'W' : 'L'}
                        </span>

                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">
                            w/ {partner ? partner.name : 'Solo'} vs{' '}
                            {oppIds.map((id) => playersById[id]?.name || 'Player').join(' & ')}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {m.courtName || `Court ${m.courtNumber}`}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-black text-slate-900 text-sm">
                          {teamScore} - {oppScore}
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            teamScore > oppScore ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {teamScore > oppScore
                            ? `+${teamScore - oppScore}`
                            : `${teamScore - oppScore}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Level Rating Adjustment Section */}
          {onUpdatePlayerRating && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Adjust Skill Rating
                </span>
                <span className="text-[11px] text-slate-500">
                  Update rating level (1–5) for balanced matchmaking
                </span>
              </div>

              <div className="flex gap-1.5 self-start sm:self-auto">
                {([1, 2, 3, 4, 5] as SkillLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onUpdatePlayerRating(player.id, level)}
                    className={`touch-target w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      player.skillRating === level
                        ? 'bg-[#0F382C] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="touch-target px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
