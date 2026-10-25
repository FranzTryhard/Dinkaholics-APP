import React, { useState } from 'react';
import { Session, RotationConfig, RotationMode } from '../types';
import { DEFAULT_ROTATION_CONFIG } from '../engine/config';
import {
  Settings,
  Smartphone,
  Sliders,
  RotateCcw,
  Trash2,
  Figma,
  ShieldCheck,
  Check,
  Crown,
  Scale,
  Trophy,
  HeartHandshake,
} from 'lucide-react';

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
            <label className="font-semibold text-slate-700 block">
              Winner-Stays Partner Rule
            </label>
            <select
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
            <label className="font-semibold text-slate-700 block">
              Max Consecutive Games on Court
            </label>
            <select
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
            <p className="text-[11px] text-slate-400">How PickleMatch manages player flow and court assignments</p>
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

      {/* Figma Mockup Export Guide */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Figma className="w-5 h-5 text-purple-600" />
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Figma Mockup Integration Guide</h2>
            <p className="text-[11px] text-slate-400">How to export your Figma designs for AI Studio</p>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            Automated development environments cannot directly open authenticated private Figma web canvas links.
            To export mockups from your Figma file:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
            <li>
              <strong>Export Frames as PNG/SVG:</strong> Select the frames in Figma, go to the right sidebar under the <em>Export</em> section, choose <strong>PNG</strong> or <strong>SVG</strong> (at 2x), and download.
            </li>
            <li>
              <strong>Copy as SVG:</strong> Right-click any component/frame in Figma &gt; <em>Copy/Paste as</em> &gt; <em>Copy as SVG</em>.
            </li>
            <li>
              <strong>Copy CSS/Properties:</strong> In Figma Dev Mode, inspect styles (colors, border-radii, layout spacing) and paste them here.
            </li>
          </ul>
        </div>
      </div>

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
