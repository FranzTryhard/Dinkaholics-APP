import React, { useState } from 'react';
import { Session, RotationConfig, RotationMode } from '../types';
import { DEFAULT_ROTATION_CONFIG } from '../engine/config';
import {
  Settings,
  Smartphone,
  Sliders,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Check,
  Crown,
  Scale,
  Trophy,
  HeartHandshake,
  Sparkles,
  Play,
  Clock,
} from 'lucide-react';
import { StorageService } from '../engine/storage';
import { PickleballBounceLoader } from '../components/PickleballBounceLoader';


interface SettingsViewProps {
  session: Session | null;
  onUpdateSessionConfig: (newConfig: RotationConfig) => void;
  onResetDemo: () => void;
  onClearAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  session,
  onUpdateSessionConfig,
  onResetDemo,
  onClearAll,
}) => {
  const [config, setConfig] = useState<RotationConfig>(
    session?.rotationConfig || DEFAULT_ROTATION_CONFIG
  );
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [animDuration, setAnimDuration] = useState<number>(() => StorageService.getAnimationDuration());
  const [previewAnim, setPreviewAnim] = useState<{ open: boolean; duration: number } | null>(null);

  const handleDurationChange = (durationMs: number) => {
    setAnimDuration(durationMs);
    StorageService.setAnimationDuration(durationMs);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveConfig = (partial: Partial<RotationConfig>) => {
    const updated = { ...config, ...partial };
    setConfig(updated);
    onUpdateSessionConfig(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#0F382C]" />
          <span>Rules & Preferences</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Matchmaking algorithm parameters, court rotation modes, and local storage controls.
        </p>
      </div>

      {/* Rotation Rules & Fairness Configuration */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#0F382C]" />
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Matchmaking Engine Rules</h2>
              <p className="text-[11px] text-slate-400">Settings applied during candidate pairing and court rotations</p>
            </div>
          </div>
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Winner Stays Rule */}
          <div className="space-y-1.5">
            <label htmlFor="winner-stays-rule" className="font-semibold text-slate-700 block">
              Winner-Stays Partner Rule
            </label>
            <select
              id="winner-stays-rule"
              aria-label="Winner-Stays Partner Rule"
              value={config.winnerStaysRule}
              onChange={(e) => handleSaveConfig({ winnerStaysRule: e.target.value as any })}
              className="touch-target w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#0F382C] focus:ring-1 focus:ring-[#0F382C]"
            >
              <option value="stay_together">Stay Together (Defending Pair)</option>
              <option value="split_partners">Split Partners (Play with Challengers)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              When enabled in Winner-Stays mode, determines whether the winning pair remains together or splits.
            </p>
          </div>

          {/* Max Consecutive Games */}
          <div className="space-y-1.5">
            <label htmlFor="max-consecutive-games" className="font-semibold text-slate-700 block">
              Max Consecutive Games on Court
            </label>
            <select
              id="max-consecutive-games"
              aria-label="Max Consecutive Games on Court"
              value={config.maxConsecutiveGames}
              onChange={(e) => handleSaveConfig({ maxConsecutiveGames: Number(e.target.value) })}
              className="touch-target w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#0F382C] focus:ring-1 focus:ring-[#0F382C]"
            >
              <option value={2}>2 Games (Strict rotation for fair rest)</option>
              <option value={3}>3 Games (King of the Court style)</option>
              <option value={4}>4 Games Max</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Prevents dominant pairs from monopolizing courts; guarantees rest and court time fairness.
            </p>
          </div>
        </div>
      </div>

      {/* Rotation Modes & Rules Breakdown */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Crown className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Supported Rotation Formats</h2>
            <p className="text-[11px] text-slate-400">How Dinkaholics manages player flow and court assignments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#0F382C]" />
              <span>Balanced Play</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Prioritizes rating parity and equal waiting time. Teams are calibrated so both sides have closely matched combined skill ratings.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>King of the Court (Ladder)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Court 1 is the Throne. Winners advance up toward Court 1; runners-up drop down a court. Waiting queue challengers rotate in at the base court.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span>Winner-Stays</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Winning pair stays on court to defend against top challengers from the waiting queue, respecting maximum consecutive game limits.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-blue-600" />
              <span>Social Mix</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Maximizes variety by heavily prioritizing pairing players who have not partnered or played against each other in the current session.
            </p>
          </div>
        </div>
      </div>

      {/* Match Animation & Celebration Experience */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0F382C]" />
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Full-Screen Celebration & Rotation Animation</h2>
              <p className="text-[11px] text-slate-400">
                Pickleball paddle bounce animation shown when matches finalize and courts rotate
              </p>
            </div>
          </div>
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-bold text-slate-800 text-xs block mb-1.5">
              Animation Duration Selection: 2 Seconds vs 3 Seconds
            </label>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              <strong>Recommendation: 2 Seconds</strong> is the ideal sweet spot. The paddle bounce cycle takes ~1.0s, so 2 seconds delivers exactly 2 clean, high-impact bounce rhythms before smoothly transitioning to the next court assignments without keeping active players waiting. 3 seconds is available if you prefer a longer celebratory spotlight.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: 2 Seconds (Recommended) */}
              <div
                onClick={() => handleDurationChange(2000)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition relative flex flex-col justify-between ${
                  animDuration === 2000
                    ? 'border-[#0F382C] bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      2.0 Seconds (Recommended)
                    </span>
                    {animDuration === 2000 && (
                      <span className="text-[10px] uppercase font-bold bg-[#0F382C] text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    2 complete bounce cycles. Snappy, athletic, and prevents delays during fast open-play rotations.
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewAnim({ open: true, duration: 2000 });
                    }}
                    className="touch-target px-3 py-1.5 rounded-lg bg-emerald-950 text-white hover:bg-emerald-900 text-[11px] font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test 2s Full-Screen</span>
                  </button>
                </div>
              </div>

              {/* Option 2: 3 Seconds */}
              <div
                onClick={() => handleDurationChange(3000)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition relative flex flex-col justify-between ${
                  animDuration === 3000
                    ? 'border-[#0F382C] bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      3.0 Seconds (Extended)
                    </span>
                    {animDuration === 3000 && (
                      <span className="text-[10px] uppercase font-bold bg-[#0F382C] text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    3 bounce cycles. Extended dramatic celebration, ideal for high-stakes tournament finals.
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewAnim({ open: true, duration: 3000 });
                    }}
                    className="touch-target px-3 py-1.5 rounded-lg bg-emerald-950 text-white hover:bg-emerald-900 text-[11px] font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test 3s Full-Screen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Live Preview Overlay */}
      {previewAnim && (
        <PickleballBounceLoader
          fullScreen={true}
          duration={previewAnim.duration}
          winnerPlayers={[
            { name: 'Alex Rivera' },
            { name: 'Jordan Lee' },
          ]}
          submessage="Final Score 11 - 9"
          onComplete={() => setPreviewAnim(null)}
        />
      )}



      {/* Data Management & Demo Reset */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-[#0F382C]" />
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Local Persistence & Data Management</h2>
            <p className="text-[11px] text-slate-400">All session stats, matches, and players are saved automatically</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onResetDemo}
            className="touch-target w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-[#0F382C]" />
            <span>Reset to Clean Demo Data</span>
          </button>

          <button
            onClick={() => setShowConfirmClear(true)}
            className="touch-target w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Wipe All Data (Start Empty)</span>
          </button>
        </div>

        {showConfirmClear && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
            <p className="text-rose-800">
              Are you sure you want to erase all players, match history, and session data?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="touch-target px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setShowConfirmClear(false);
                }}
                className="touch-target px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
