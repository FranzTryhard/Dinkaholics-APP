import React, { useState } from 'react';
import { Match, Player } from '../types';
import { Trophy, X, Plus, Minus, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScoreEntryModalProps {
  match: Match;
  playersById: Record<string, Player>;
  onClose: () => void;
  onConfirmScore: (matchId: string, scoreA: number, scoreB: number, winnerTeam: 'teamA' | 'teamB') => void;
}

export const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({
  match,
  playersById,
  onClose,
  onConfirmScore,
}) => {
  const [scoreA, setScoreA] = useState<number>(11);
  const [scoreB, setScoreB] = useState<number>(8);
  const [manualWinner, setManualWinner] = useState<'teamA' | 'teamB' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-derived winner unless manually toggled
  const calculatedWinner: 'teamA' | 'teamB' = manualWinner || (scoreA >= scoreB ? 'teamA' : 'teamB');

  const getNames = (ids: [string, string]) => {
    return ids.map((id) => playersById[id]?.name || 'Player').join(' & ');
  };

  const handleQuickPreset = (a: number, b: number) => {
    setScoreA(a);
    setScoreB(b);
    setManualWinner(null);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (scoreA === scoreB) {
      setErrorMessage('A pickleball match cannot end in a tie. Please adjust scores or choose a winner.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.55 },
        colors: ['#0F382C', '#84CC16', '#10B981'],
      });
    } catch (e) {}

    onConfirmScore(match.id, scoreA, scoreB, calculatedWinner);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Record Final Score</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {match.courtName || `Court ${match.courtNumber}`} · Match #{match.matchNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="touch-target p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Score Presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Common Final Scores
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[
                [11, 9],
                [11, 7],
                [11, 5],
                [11, 3],
                [12, 10],
                [15, 13],
                [9, 11],
                [7, 11],
              ].map(([a, b]) => (
                <button
                  type="button"
                  key={`${a}-${b}`}
                  onClick={() => handleQuickPreset(a, b)}
                  className={`py-2 text-xs font-mono font-semibold rounded-lg border transition ${
                    scoreA === a && scoreB === b
                      ? 'border-[#0F382C] bg-emerald-50 text-[#0F382C]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {a} - {b}
                </button>
              ))}
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="grid grid-cols-2 gap-3">
            {/* Team A Score */}
            <div
              className={`p-4 rounded-xl border transition ${
                calculatedWinner === 'teamA'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="text-xs font-bold text-slate-900 truncate mb-0.5">
                {getNames(match.teamA)}
              </div>
              <div className="text-[11px] text-slate-500 mb-3 font-medium">Team 1</div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                  className="touch-target w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-3xl font-black font-mono text-slate-900">{scoreA}</span>
                <button
                  type="button"
                  onClick={() => setScoreA(scoreA + 1)}
                  className="touch-target w-10 h-10 rounded-xl bg-[#0F382C] hover:bg-[#165342] text-white font-bold flex items-center justify-center transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setManualWinner('teamA')}
                className={`mt-3 w-full py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                  calculatedWinner === 'teamA'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {calculatedWinner === 'teamA' && <CheckCircle className="w-3.5 h-3.5" />}
                <span>{calculatedWinner === 'teamA' ? 'Winner' : 'Set as Winner'}</span>
              </button>
            </div>

            {/* Team B Score */}
            <div
              className={`p-4 rounded-xl border transition ${
                calculatedWinner === 'teamB'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="text-xs font-bold text-slate-900 truncate mb-0.5">
                {getNames(match.teamB)}
              </div>
              <div className="text-[11px] text-slate-500 mb-3 font-medium">Team 2</div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                  className="touch-target w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-3xl font-black font-mono text-slate-900">{scoreB}</span>
                <button
                  type="button"
                  onClick={() => setScoreB(scoreB + 1)}
                  className="touch-target w-10 h-10 rounded-xl bg-[#0F382C] hover:bg-[#165342] text-white font-bold flex items-center justify-center transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setManualWinner('teamB')}
                className={`mt-3 w-full py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                  calculatedWinner === 'teamB'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {calculatedWinner === 'teamB' && <CheckCircle className="w-3.5 h-3.5" />}
                <span>{calculatedWinner === 'teamB' ? 'Winner' : 'Set as Winner'}</span>
              </button>
            </div>
          </div>

          {scoreA === scoreB && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Pickleball requires a winning team. Adjust score to finalize.</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="touch-target flex-1 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || scoreA === scoreB}
              className="touch-target flex-1 py-3 rounded-xl bg-[#0F382C] text-white font-bold text-xs hover:bg-[#165342] transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Finalize & Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
