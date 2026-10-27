import React, { useState } from 'react';
import { Player, SkillLevel, SKILL_LEVEL_COLORS, SKILL_LEVEL_LABELS, PlayerStatus } from '../types';
import { Edit2, Trash2, Trophy, Flame, AlertCircle, Coffee, Play, Check } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerCardProps {
  player: Player;
  isSessionActive: boolean;
  onUpdateRating: (playerId: string, newRating: SkillLevel) => void;
  onUpdateStatus: (playerId: string, newStatus: PlayerStatus) => void;
  onDelete: (playerId: string) => void;
  onEditDetails: (player: Player) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSessionActive,
  onUpdateRating,
  onUpdateStatus,
  onDelete,
  onEditDetails,
}) => {
  const [showRatingConfirm, setShowRatingConfirm] = useState<SkillLevel | null>(null);

  const colors = SKILL_LEVEL_COLORS[player.skillRating];
  const winRate =
    player.totalGamesPlayed > 0
      ? Math.round((player.wins / player.totalGamesPlayed) * 100)
      : 0;

  const handleRatingSelect = (newRating: SkillLevel) => {
    if (newRating === player.skillRating) return;

    if (isSessionActive) {
      setShowRatingConfirm(newRating);
    } else {
      onUpdateRating(player.id, newRating);
    }
  };

  const confirmRatingChange = () => {
    if (showRatingConfirm !== null) {
      onUpdateRating(player.id, showRatingConfirm);
      setShowRatingConfirm(null);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E0E7E4] p-4 shadow-xs hover:border-[#103F32]/40 transition flex flex-col justify-between gap-3 relative">
      {/* Top row: Avatar & Identity */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <PlayerAvatar
            avatar={player.avatar}
            name={player.name}
            className="w-11 h-11 rounded-full border border-[#E0E7E4]"
          />

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-[#172033] text-sm tracking-tight">{player.name}</h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                Level {player.skillRating} • {SKILL_LEVEL_LABELS[player.skillRating]}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#64748B] mt-1 font-mono tabular-nums">
              <span>{player.totalGamesPlayed} matches</span>
              <span>•</span>
              <span className="font-medium text-[#103F32]">
                {player.wins}W - {player.losses}L ({winRate}%)
              </span>
              {player.streak !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-bold ${
                    player.streak > 0 ? 'text-amber-700' : 'text-[#64748B]'
                  }`}
                >
                  <Flame className="w-3 h-3 fill-current text-amber-500" />
                  {player.streak > 0 ? `${player.streak}W streak` : `${Math.abs(player.streak)}L`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditDetails(player)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#103F32] hover:bg-[#F6F8F7] transition"
            title="Edit player"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(player.id)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition"
            title="Delete player"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Rating selector buttons */}
      <div>
        <div className="text-[11px] font-medium text-[#64748B] mb-1.5">Skill Rating (1–5):</div>
        <div className="grid grid-cols-5 gap-1">
          {([1, 2, 3, 4, 5] as SkillLevel[]).map((level) => {
            const isCurrent = player.skillRating === level;
            return (
              <button
                key={level}
                onClick={() => handleRatingSelect(level)}
                className={`py-1 rounded-lg text-xs font-bold transition flex flex-col items-center ${
                  isCurrent
                    ? 'bg-[#103F32] text-white shadow-xs'
                    : 'bg-[#F6F8F7] text-[#64748B] border border-[#E0E7E4] hover:bg-[#E0E7E4]/50'
                }`}
                title={`Level ${level}: ${SKILL_LEVEL_LABELS[level]}`}
              >
                <span>{level}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Session status badge and quick toggle */}
      <div className="flex items-center justify-between pt-1 border-t border-[#E0E7E4] text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              player.status === 'playing'
                ? 'bg-[#103F32] animate-ping'
                : player.status === 'resting'
                ? 'bg-amber-500'
                : player.status === 'available'
                ? 'bg-[#35D879]'
                : 'bg-slate-400'
            }`}
          />
          <span className="capitalize text-[#172033] font-medium">{player.status}</span>
        </div>

        <div className="flex items-center gap-1">
          {player.status === 'available' ? (
            <button
              onClick={() => onUpdateStatus(player.id, 'resting')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition flex items-center gap-1 border border-amber-200"
            >
              <Coffee className="w-3 h-3" />
              <span>Rest</span>
            </button>
          ) : player.status === 'resting' ? (
            <button
              onClick={() => onUpdateStatus(player.id, 'available')}
              className="px-2.5 py-1 rounded-lg bg-[#E5F8EC] hover:bg-[#C4EED3] text-[#103F32] text-[11px] font-bold transition flex items-center gap-1 border border-[#C4EED3]"
            >
              <Play className="w-3 h-3" />
              <span>Ready</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Confirmation modal for rating change during active session */}
      {showRatingConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-[#E0E7E4] p-5 shadow-2xl text-[#172033]">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-200">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-[#172033] text-base font-display">Confirm Rating Adjustment</h4>
            <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
              Changing {player.name}'s rating from <strong>Level {player.skillRating}</strong> to{' '}
              <strong>Level {showRatingConfirm}</strong> will immediately affect active matchmaking
              recommendations on all courts.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => setShowRatingConfirm(null)}
                className="flex-1 py-2 rounded-xl border border-[#E0E7E4] text-[#64748B] text-xs font-semibold hover:bg-[#F6F8F7]"
              >
                Cancel
              </button>
              <button
                onClick={confirmRatingChange}
                className="flex-1 py-2 rounded-xl bg-[#103F32] text-white font-bold text-xs hover:bg-[#0A2B22]"
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
