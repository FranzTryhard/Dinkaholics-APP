import React, { useState } from 'react';
import { Player, SkillLevel, SKILL_LEVEL_COLORS, SKILL_LEVEL_LABELS, PlayerStatus } from '../types';
import { DEFAULT_PLAYER_AVATAR } from '../engine/config';
import { Edit2, Trash2, Trophy, Flame, AlertCircle, Coffee, Play, Check } from 'lucide-react';

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
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg hover:border-slate-700 transition flex flex-col justify-between gap-3 relative">
      {/* Top row: Avatar & Identity */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={player.avatar || DEFAULT_PLAYER_AVATAR}
            onError={(e) => {
              e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
            }}
            alt={player.name}
            className="w-11 h-11 rounded-full object-cover border border-slate-700"
          />

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-sm tracking-tight">{player.name}</h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                Level {player.skillRating} • {SKILL_LEVEL_LABELS[player.skillRating]}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>{player.totalGamesPlayed} matches</span>
              <span>•</span>
              <span className="font-medium text-slate-300">
                {player.wins}W - {player.losses}L ({winRate}%)
              </span>
              {player.streak !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-bold ${
                    player.streak > 0 ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  <Flame className="w-3 h-3 fill-current" />
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Edit player"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(player.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="Delete player"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Rating selector buttons */}
      <div>
        <div className="text-[11px] font-medium text-slate-400 mb-1.5">Skill Rating (1–5):</div>
        <div className="grid grid-cols-5 gap-1">
          {([1, 2, 3, 4, 5] as SkillLevel[]).map((level) => {
            const isCurrent = player.skillRating === level;
            return (
              <button
                key={level}
                onClick={() => handleRatingSelect(level)}
                className={`py-1 rounded-lg text-xs font-bold transition flex flex-col items-center ${
                  isCurrent
                    ? 'bg-lime-400 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              player.status === 'playing'
                ? 'bg-emerald-400 animate-ping'
                : player.status === 'resting'
                ? 'bg-amber-400'
                : player.status === 'available'
                ? 'bg-lime-400'
                : 'bg-slate-500'
            }`}
          />
          <span className="capitalize text-slate-300 font-medium">{player.status}</span>
        </div>

        <div className="flex items-center gap-1">
          {player.status === 'available' ? (
            <button
              onClick={() => onUpdateStatus(player.id, 'resting')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-[11px] font-medium transition flex items-center gap-1"
            >
              <Coffee className="w-3 h-3" />
              <span>Rest</span>
            </button>
          ) : player.status === 'resting' ? (
            <button
              onClick={() => onUpdateStatus(player.id, 'available')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-lime-500/20 text-slate-300 hover:text-lime-300 text-[11px] font-medium transition flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              <span>Ready</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Confirmation modal for rating change during active session */}
      {showRatingConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-amber-500/40 p-5 shadow-2xl text-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base">Confirm Rating Adjustment</h4>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Changing {player.name}'s rating from <strong>Level {player.skillRating}</strong> to{' '}
              <strong>Level {showRatingConfirm}</strong> will immediately affect active matchmaking
              recommendations on all courts.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => setShowRatingConfirm(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmRatingChange}
                className="flex-1 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300"
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
