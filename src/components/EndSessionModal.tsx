import React, { useState } from 'react';
import { Session, Match, Player } from '../types';
import { Trophy, Clock, Users, Flame, Award, CheckCircle2, X } from 'lucide-react';
import { PickleballIcon } from './PickleballIcon';
import { PickleballBounceLoader } from './PickleballBounceLoader';

interface EndSessionModalProps {
  session: Session;
  matches: Match[];
  players: Player[];
  onClose: () => void;
  onConfirmEnd: () => void;
}

export const EndSessionModal: React.FC<EndSessionModalProps> = ({
  session,
  matches,
  players,
  onClose,
  onConfirmEnd,
}) => {
  const sessionMatches = matches.filter((m) => m.sessionId === session.id && m.status === 'completed');
  const durationMinutes = session.startTime
    ? Math.max(1, Math.round((Date.now() - session.startTime) / 60000))
    : 0;

  // Player with most wins in session
  const topWinPlayer = [...players].sort((a, b) => b.sessionWins - a.sessionWins)[0];
  // Player with longest streak
  const topStreakPlayer = [...players].sort((a, b) => b.streak - a.streak)[0];
  // Player with most games played
  const mostActivePlayer = [...players].sort((a, b) => b.sessionGamesPlayed - a.sessionGamesPlayed)[0];

  const [isEnding, setIsEnding] = useState(false);

  const handleConclude = () => {
    if (isEnding) return;
    setIsEnding(true);
    setTimeout(() => {
      onConfirmEnd();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#E0E7E4] shadow-2xl overflow-hidden flex flex-col">
        {/* Header Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0A2B22] via-[#103F32] to-[#0A2B22] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Trophy className="w-5 h-5 text-[#35D879]" />
            </div>
            <div>
              <h3 className="font-black text-white text-base font-display">Conclude Session</h3>
              <p className="text-[11px] text-white/75">Finalize stats and review highlights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="touch-target p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="text-center py-1">
            <h4 className="text-lg font-black text-[#172033] font-display">{session.name}</h4>
            <p className="text-xs text-[#64748B] mt-1 flex items-center justify-center gap-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                <span className="font-mono tabular-nums">{durationMinutes} mins</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-[#172033] font-mono tabular-nums">
                {sessionMatches.length} completed matches
              </span>
            </p>
          </div>

          {/* Highlights grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-[#E5F8EC] border border-[#C4EED3] text-center">
              <Award className="w-4 h-4 text-[#103F32] mx-auto mb-1" />
              <div className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Top Wins</div>
              <div className="text-xs font-black text-[#172033] mt-0.5 truncate">
                {topWinPlayer ? topWinPlayer.name : '—'}
              </div>
              <div className="text-[11px] text-[#103F32] font-mono font-bold mt-0.5 tabular-nums">
                {topWinPlayer ? `${topWinPlayer.sessionWins} wins` : ''}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 mx-auto mb-1" />
              <div className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Hot Streak</div>
              <div className="text-xs font-black text-[#172033] mt-0.5 truncate">
                {topStreakPlayer && topStreakPlayer.streak > 0 ? topStreakPlayer.name : '—'}
              </div>
              <div className="text-[11px] text-amber-800 font-mono font-bold mt-0.5 tabular-nums">
                {topStreakPlayer && topStreakPlayer.streak > 0 ? `${topStreakPlayer.streak}W streak` : 'None'}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F6F8F7] border border-[#E0E7E4] text-center">
              <Users className="w-4 h-4 text-[#103F32] mx-auto mb-1" />
              <div className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Most Active</div>
              <div className="text-xs font-black text-[#172033] mt-0.5 truncate">
                {mostActivePlayer ? mostActivePlayer.name : '—'}
              </div>
              <div className="text-[11px] text-[#172033] font-mono font-bold mt-0.5 tabular-nums">
                {mostActivePlayer ? `${mostActivePlayer.sessionGamesPlayed} games` : ''}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F6F8F7] border border-[#E0E7E4] text-xs text-[#64748B] leading-relaxed">
            Ending this session will finalize all ratings, archive active court games, and store the full match history. You can start another session anytime.
          </div>

          <div className="pt-2">
            {isEnding ? (
              <div className="py-2 px-4 rounded-xl bg-[#F6F8F7] border border-[#E0E7E4] flex flex-col items-center justify-center">
                <PickleballBounceLoader
                  size="sm"
                  theme="light"
                  message="Concluding Session & Archiving Stats..."
                  submessage="Calculating final leaderboard standings"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="touch-target flex-1 py-2.5 rounded-xl border border-[#E0E7E4] bg-white text-[#64748B] hover:bg-[#F6F8F7] hover:text-[#172033] text-xs font-bold transition"
                >
                  Resume Play
                </button>
                <button
                  onClick={handleConclude}
                  className="touch-target flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition active:scale-95 shadow-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Conclude Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
