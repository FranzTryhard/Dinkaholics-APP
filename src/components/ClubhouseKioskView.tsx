import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Session,
  Match,
  MatchCandidate,
  Player,
  SKILL_LEVEL_DUPR,
  SKILL_LEVEL_COLORS,
} from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { DinkaholicsLogo } from './DinkaholicsLogo';
import { courtAudio } from '../utils/audio';
import {
  Tv,
  Maximize2,
  Minimize2,
  X,
  Clock,
  Users,
  Trophy,
  Play,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  Flame,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Award,
  Zap,
} from 'lucide-react';

interface ClubhouseKioskViewProps {
  session: Session;
  players: Player[];
  matches: Match[];
  recommendationsByCourt: Record<number, MatchCandidate | null>;
  onClose: () => void;
  onStartRecommended?: (courtNumber: number, candidate: MatchCandidate) => void;
  onEnterScore?: (match: Match) => void;
}

type KioskLayoutMode = 'split' | 'grid' | 'focus';

export const ClubhouseKioskView: React.FC<ClubhouseKioskViewProps> = ({
  session,
  players,
  matches,
  recommendationsByCourt,
  onClose,
  onStartRecommended,
  onEnterScore,
}) => {
  const [layoutMode, setLayoutMode] = useState<KioskLayoutMode>('split');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(courtAudio.getSoundEnabled());
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [focusCourtIndex, setFocusCourtIndex] = useState<number>(0);
  const [autoRotateProgress, setAutoRotateProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [themeMode, setThemeMode] = useState<'forest_dark' | 'forest_light'>('forest_dark');

  // Fast player lookup
  const playersById = useMemo(() => {
    return players.reduce<Record<string, Player>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [players]);

  // Active matches in progress
  const activeCourtNumbers = useMemo(() => {
    return Array.from({ length: session.courtCount }, (_, i) => i + 1);
  }, [session.courtCount]);

  const activeMatchesList = useMemo(() => {
    return matches.filter((m) => m.status === 'in_progress');
  }, [matches]);

  // Waiting queue players sorted by wait time
  const waitingPlayers = useMemo(() => {
    return players
      .filter((p) => p.status === 'available')
      .sort((a, b) => (a.waitingSince || 0) - (b.waitingSince || 0));
  }, [players]);

  const onDeckPlayers = useMemo(() => {
    return waitingPlayers.slice(0, 4);
  }, [waitingPlayers]);

  const laterQueuePlayers = useMemo(() => {
    return waitingPlayers.slice(4);
  }, [waitingPlayers]);

  // Completed matches today
  const completedMatches = useMemo(() => {
    return matches.filter((m) => m.status === 'completed');
  }, [matches]);

  // Leaderboard highlights
  const topStreaks = useMemo(() => {
    return [...players]
      .filter((p) => p.sessionWins > 0)
      .sort((a, b) => b.streak - a.streak || b.sessionWins - a.sessionWins)
      .slice(0, 4);
  }, [players]);

  // Live real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Browser permissions or iframe constraint
    }
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          onClose();
        }
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key === ' ') {
        e.preventDefault();
        setAutoRotate((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        setFocusCourtIndex((prev) => (prev + 1) % session.courtCount);
      } else if (e.key === 'ArrowLeft') {
        setFocusCourtIndex((prev) => (prev - 1 + session.courtCount) % session.courtCount);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, toggleFullscreen, session.courtCount]);

  // Auto-rotate cycle (12 seconds per court in Focus mode or cycling)
  useEffect(() => {
    if (!autoRotate) {
      setAutoRotateProgress(0);
      return;
    }

    const intervalTime = 100; // 100ms ticks
    const totalDuration = 12000; // 12 seconds per step
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += intervalTime;
      setAutoRotateProgress((elapsed / totalDuration) * 100);

      if (elapsed >= totalDuration) {
        elapsed = 0;
        setFocusCourtIndex((prev) => (prev + 1) % session.courtCount);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [autoRotate, session.courtCount]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    courtAudio.setSoundEnabled(next);
    if (next) courtAudio.playPaddleHit();
  };

  // Helper to format match duration
  const getMatchDuration = (startTime: number) => {
    const secs = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const getPlayer = (id: string): Player => {
    return (
      playersById[id] || {
        id,
        name: 'Player',
        skillRating: 3,
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
        waitingSince: null,
        totalWaitingTimeMs: 0,
        teammateHistory: {},
        opponentHistory: {},
      }
    );
  };

  const isDark = themeMode === 'forest_dark';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden select-none font-sans ${
        isDark ? 'bg-[#081813] text-white' : 'bg-[#F2F7F4] text-[#172033]'
      } transition-colors duration-300`}
    >
      {/* Top TV Kiosk Header */}
      <header
        className={`shrink-0 px-4 sm:px-8 py-3.5 border-b flex items-center justify-between gap-4 ${
          isDark ? 'bg-[#0C241C]/95 border-[#174335]' : 'bg-white border-[#D6E4DC]'
        } backdrop-blur-md`}
      >
        {/* Brand & Kiosk Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <DinkaholicsLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-black text-lg sm:text-xl tracking-tight font-display ${
                  isDark ? 'text-white' : 'text-[#172033]'
                }`}
              >
                Dinkaholics
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#103F32] text-[#35D879] border border-[#35D879]/30 shadow-sm">
                <Tv className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Clubhouse TV</span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-xs font-semibold truncate max-w-[200px] sm:max-w-xs ${
                  isDark ? 'text-[#9BB7AB]' : 'text-[#475569]'
                }`}
              >
                {session.name}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#35D879]" />
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#35D879]">
                <span className="w-2 h-2 rounded-full bg-[#35D879] animate-ping" />
                <span>Live Feed</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: High-Readability Stadium Clock */}
        <div className="hidden md:flex flex-col items-center justify-center">
          <div
            className={`text-2xl lg:text-3xl font-black font-mono tracking-tight tabular-nums ${
              isDark ? 'text-white' : 'text-[#103F32]'
            }`}
          >
            {currentTime}
          </div>
          <div
            className={`text-[11px] font-bold uppercase tracking-wider ${
              isDark ? 'text-[#7D9F91]' : 'text-[#64748B]'
            }`}
          >
            {currentDate}
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Layout Mode Selector */}
          <div
            className={`hidden sm:flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-[#081813] border-[#1C4E3E]' : 'bg-[#E5F0E9] border-[#CBDCD1]'
            }`}
          >
            <button
              onClick={() => setLayoutMode('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                layoutMode === 'split'
                  ? 'bg-[#103F32] text-[#35D879] shadow-sm'
                  : isDark
                  ? 'text-[#9BB7AB] hover:text-white'
                  : 'text-[#475569] hover:text-black'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                layoutMode === 'grid'
                  ? 'bg-[#103F32] text-[#35D879] shadow-sm'
                  : isDark
                  ? 'text-[#9BB7AB] hover:text-white'
                  : 'text-[#475569] hover:text-black'
              }`}
            >
              All Courts
            </button>
            <button
              onClick={() => setLayoutMode('focus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                layoutMode === 'focus'
                  ? 'bg-[#103F32] text-[#35D879] shadow-sm'
                  : isDark
                  ? 'text-[#9BB7AB] hover:text-white'
                  : 'text-[#475569] hover:text-black'
              }`}
            >
              Marquee
            </button>
          </div>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`touch-target px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              autoRotate
                ? 'bg-[#103F32] border-[#35D879] text-[#35D879]'
                : isDark
                ? 'bg-[#0E2C22] border-[#1C4E3E] text-[#9BB7AB] hover:text-white'
                : 'bg-white border-[#CBDCD1] text-[#475569] hover:text-black'
            }`}
            title="Auto-cycle through courts every 12s"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Auto-Cycle</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`touch-target p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-[#103F32] border-[#35D879]/40 text-[#35D879]'
                : isDark
                ? 'bg-[#0E2C22] border-[#1C4E3E] text-[#607D70]'
                : 'bg-white border-[#CBDCD1] text-slate-400'
            }`}
            title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
            aria-label="Sound Toggle"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Switcher (Clubhouse Dark vs High-Contrast Day) */}
          <button
            onClick={() => setThemeMode(isDark ? 'forest_light' : 'forest_dark')}
            className={`touch-target p-2 rounded-xl border transition ${
              isDark
                ? 'bg-[#0E2C22] border-[#1C4E3E] text-[#9BB7AB] hover:text-white'
                : 'bg-white border-[#CBDCD1] text-[#475569] hover:text-black'
            }`}
            title={isDark ? 'Switch to Day Light Mode' : 'Switch to Clubhouse Night Dark Mode'}
            aria-label="Theme Mode"
          >
            <Sparkles className="w-4 h-4 text-[#35D879]" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`touch-target p-2 rounded-xl border transition ${
              isFullscreen
                ? 'bg-[#103F32] border-[#35D879] text-[#35D879]'
                : isDark
                ? 'bg-[#0E2C22] border-[#1C4E3E] text-[#9BB7AB] hover:text-white'
                : 'bg-white border-[#CBDCD1] text-[#475569]'
            }`}
            title="Toggle True Fullscreen (Press F)"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Kiosk Button */}
          <button
            onClick={onClose}
            className="touch-target px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
            title="Exit Clubhouse Kiosk (Press Esc)"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Exit TV</span>
          </button>
        </div>
      </header>

      {/* Auto Rotate Progress Bar */}
      {autoRotate && (
        <div className="w-full h-1 bg-[#103F32]/50 overflow-hidden">
          <div
            className="h-full bg-[#35D879] transition-all duration-100 ease-linear"
            style={{ width: `${autoRotateProgress}%` }}
          />
        </div>
      )}

      {/* Live Stadium Metrics Ribbon */}
      <div
        className={`shrink-0 px-4 sm:px-8 py-2.5 border-b grid grid-cols-2 sm:grid-cols-4 gap-3 ${
          isDark ? 'bg-[#091D16] border-[#174335]' : 'bg-[#EAF3EE] border-[#D6E4DC]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#103F32] border border-[#35D879]/40 flex items-center justify-center text-[#35D879] shadow-sm shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div
              className={`text-base sm:text-lg font-black font-mono leading-none ${
                isDark ? 'text-white' : 'text-[#172033]'
              }`}
            >
              {activeMatchesList.length} / {session.courtCount} Live
            </div>
            <div
              className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                isDark ? 'text-[#87A89A]' : 'text-[#64748B]'
              }`}
            >
              Active Courts
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#103F32] border border-[#35D879]/40 flex items-center justify-center text-[#35D879] shadow-sm shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div
              className={`text-base sm:text-lg font-black font-mono leading-none ${
                isDark ? 'text-white' : 'text-[#172033]'
              }`}
            >
              {waitingPlayers.length} Waiting
            </div>
            <div
              className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                isDark ? 'text-[#87A89A]' : 'text-[#64748B]'
              }`}
            >
              Next 4 On Deck
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#103F32] border border-[#35D879]/40 flex items-center justify-center text-[#35D879] shadow-sm shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div
              className={`text-base sm:text-lg font-black font-mono leading-none ${
                isDark ? 'text-white' : 'text-[#172033]'
              }`}
            >
              {completedMatches.length} Games
            </div>
            <div
              className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                isDark ? 'text-[#87A89A]' : 'text-[#64748B]'
              }`}
            >
              Finished Today
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#103F32] border border-[#35D879]/40 flex items-center justify-center text-[#35D879] shadow-sm shrink-0">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div
              className={`text-base sm:text-lg font-black font-mono leading-none truncate max-w-[130px] ${
                isDark ? 'text-white' : 'text-[#172033]'
              }`}
            >
              {topStreaks[0] ? `${topStreaks[0].name} (${topStreaks[0].streak}W)` : 'Even Play'}
            </div>
            <div
              className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                isDark ? 'text-[#87A89A]' : 'text-[#64748B]'
              }`}
            >
              Top Win Streak
            </div>
          </div>
        </div>
      </div>

      {/* Main Kiosk Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {layoutMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Left Column (Courts Grid - 8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2
                  className={`text-lg sm:text-xl font-black uppercase tracking-wider font-display flex items-center gap-2 ${
                    isDark ? 'text-[#35D879]' : 'text-[#103F32]'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                  <span>Live Court Action</span>
                </h2>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    isDark ? 'bg-[#0E2C22] text-[#9BB7AB]' : 'bg-[#E5F0E9] text-[#103F32]'
                  }`}
                >
                  {session.courtCount} Courts Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeCourtNumbers.map((courtNum) => {
                  const activeMatchId = session.activeCourtMatches[courtNum];
                  const activeMatch = matches.find((m) => m.id === activeMatchId) || null;
                  const recommendation = recommendationsByCourt[courtNum] || null;
                  const courtName = session.courtNames?.[courtNum] || `Court ${courtNum}`;

                  return (
                    <KioskCourtCard
                      key={courtNum}
                      courtNumber={courtNum}
                      courtName={courtName}
                      activeMatch={activeMatch}
                      recommendation={recommendation}
                      playersById={playersById}
                      isDark={isDark}
                      getMatchDuration={getMatchDuration}
                      onStartRecommended={onStartRecommended}
                      onEnterScore={onEnterScore}
                    />
                  );
                })}
              </div>
            </div>

            {/* Right Column (On Deck & Standings - 4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* On-Deck Board (Top Priority for waiting players) */}
              <div
                className={`rounded-2xl border p-5 shadow-xl ${
                  isDark ? 'bg-[#0C241C] border-[#1C4E3E]' : 'bg-white border-[#D6E4DC]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#35D879] animate-pulse" />
                    <h3
                      className={`text-base font-black uppercase tracking-wider font-display ${
                        isDark ? 'text-white' : 'text-[#172033]'
                      }`}
                    >
                      On Deck (Next Up)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#35D879]/20 text-[#35D879] border border-[#35D879]/30">
                    Get Paddles
                  </span>
                </div>

                {onDeckPlayers.length === 0 ? (
                  <div
                    className={`text-center py-6 text-xs font-semibold rounded-xl border border-dashed ${
                      isDark
                        ? 'border-[#1C4E3E] text-[#6D8F81]'
                        : 'border-[#CBDCD1] text-slate-400'
                    }`}
                  >
                    All checked-in players are currently on court!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {onDeckPlayers.map((player, idx) => (
                      <div
                        key={player.id}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                          isDark
                            ? 'bg-[#103328] border-[#225B48]'
                            : 'bg-[#F2F7F4] border-[#D6E4DC]'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <PlayerAvatar
                            name={player.name}
                            avatar={player.avatar}
                            className="w-10 h-10 rounded-full border border-white/10"
                          />
                          <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#35D879] text-[#081813] font-black text-[10px] flex items-center justify-center border-2 border-[#103328]">
                            #{idx + 1}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`font-black text-xs truncate ${
                              isDark ? 'text-white' : 'text-[#172033]'
                            }`}
                          >
                            {player.name}
                          </div>
                          <div className="text-[10px] text-[#35D879] font-bold">
                            {SKILL_LEVEL_DUPR[player.skillRating]}
                          </div>
                          <div
                            className={`text-[9px] font-medium ${
                              isDark ? 'text-[#87A89A]' : 'text-[#64748B]'
                            }`}
                          >
                            Wait: {Math.max(1, Math.round(((player.waitingSince ? Date.now() - player.waitingSince : 0) / 60000)))}m
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Later queue if any */}
                {laterQueuePlayers.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#1C4E3E]/40">
                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                        isDark ? 'text-[#87A89A]' : 'text-[#64748B]'
                      }`}
                    >
                      In Queue ({laterQueuePlayers.length} more)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {laterQueuePlayers.map((p, i) => (
                        <span
                          key={p.id}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 ${
                            isDark
                              ? 'bg-[#0E2C22] border-[#1C4E3E] text-[#9BB7AB]'
                              : 'bg-white border-[#D6E4DC] text-[#475569]'
                          }`}
                        >
                          <span className="text-[#35D879] font-mono">#{i + 5}</span>
                          <span className="truncate max-w-[80px]">{p.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Clubhouse Leaderboard Snapshot */}
              <div
                className={`rounded-2xl border p-5 shadow-xl flex-1 ${
                  isDark ? 'bg-[#0C241C] border-[#1C4E3E]' : 'bg-white border-[#D6E4DC]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-base font-black uppercase tracking-wider font-display flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-[#172033]'
                    }`}
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Session Leaders</span>
                  </h3>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      isDark ? 'text-[#7D9F91]' : 'text-[#64748B]'
                    }`}
                  >
                    Wins Today
                  </span>
                </div>

                <div className="space-y-2.5">
                  {topStreaks.map((p, rank) => {
                    const isGold = rank === 0;
                    return (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                          isGold
                            ? 'bg-[#103F32] border-[#35D879]/50 shadow-sm'
                            : isDark
                            ? 'bg-[#0F2F24] border-[#1A4C3D]'
                            : 'bg-[#F2F7F4] border-[#D6E4DC]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center font-mono ${
                              rank === 0
                                ? 'bg-amber-400 text-slate-900'
                                : rank === 1
                                ? 'bg-slate-300 text-slate-900'
                                : rank === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-[#1C4E3E] text-[#9BB7AB]'
                            }`}
                          >
                            {rank + 1}
                          </span>
                          <div className="truncate">
                            <div
                              className={`font-black text-xs truncate ${
                                isDark ? 'text-white' : 'text-[#172033]'
                              }`}
                            >
                              {p.name}
                            </div>
                            <div className="text-[10px] text-[#35D879] font-bold">
                              {SKILL_LEVEL_DUPR[p.skillRating]}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black font-mono text-[#35D879]">
                            {p.sessionWins}W - {p.sessionLosses}L
                          </div>
                          <div
                            className={`text-[9px] font-semibold ${
                              isDark ? 'text-[#87A89A]' : 'text-[#64748B]'
                            }`}
                          >
                            {p.streak > 1 ? `🔥 ${p.streak} streak` : `${p.sessionGamesPlayed} played`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {layoutMode === 'grid' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2
                className={`text-xl font-black uppercase tracking-wider font-display flex items-center gap-2 ${
                  isDark ? 'text-[#35D879]' : 'text-[#103F32]'
                }`}
              >
                <Layers className="w-5 h-5" />
                <span>All Courts Grid View</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeCourtNumbers.map((courtNum) => {
                const activeMatchId = session.activeCourtMatches[courtNum];
                const activeMatch = matches.find((m) => m.id === activeMatchId) || null;
                const recommendation = recommendationsByCourt[courtNum] || null;
                const courtName = session.courtNames?.[courtNum] || `Court ${courtNum}`;

                return (
                  <KioskCourtCard
                    key={courtNum}
                    courtNumber={courtNum}
                    courtName={courtName}
                    activeMatch={activeMatch}
                    recommendation={recommendation}
                    playersById={playersById}
                    isDark={isDark}
                    getMatchDuration={getMatchDuration}
                    onStartRecommended={onStartRecommended}
                    onEnterScore={onEnterScore}
                  />
                );
              })}
            </div>
          </div>
        )}

        {layoutMode === 'focus' && (
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() =>
                  setFocusCourtIndex((prev) => (prev - 1 + session.courtCount) % session.courtCount)
                }
                className="p-3 rounded-2xl bg-[#103F32] border border-[#35D879]/40 text-[#35D879] hover:scale-105 transition active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-[#35D879]">
                  Marquee Spotlight
                </span>
                <h2 className="text-2xl font-black font-display text-white">
                  Court {focusCourtIndex + 1} of {session.courtCount}
                </h2>
              </div>
              <button
                onClick={() => setFocusCourtIndex((prev) => (prev + 1) % session.courtCount)}
                className="p-3 rounded-2xl bg-[#103F32] border border-[#35D879]/40 text-[#35D879] hover:scale-105 transition active:scale-95"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Focused Court Marquee Card */}
            <div className="w-full">
              {(() => {
                const courtNum = focusCourtIndex + 1;
                const activeMatchId = session.activeCourtMatches[courtNum];
                const activeMatch = matches.find((m) => m.id === activeMatchId) || null;
                const recommendation = recommendationsByCourt[courtNum] || null;
                const courtName = session.courtNames?.[courtNum] || `Court ${courtNum}`;

                return (
                  <KioskCourtCard
                    courtNumber={courtNum}
                    courtName={courtName}
                    activeMatch={activeMatch}
                    recommendation={recommendation}
                    playersById={playersById}
                    isDark={isDark}
                    getMatchDuration={getMatchDuration}
                    onStartRecommended={onStartRecommended}
                    onEnterScore={onEnterScore}
                    isMarquee
                  />
                );
              })()}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Live Clubhouse Ticker */}
      <footer
        className={`shrink-0 px-4 sm:px-8 py-2 border-t flex items-center justify-between gap-4 text-xs ${
          isDark ? 'bg-[#06140F] border-[#143B2E] text-[#87A89A]' : 'bg-white border-[#D6E4DC] text-[#64748B]'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#103F32] text-[#35D879] shrink-0">
            TV TIP
          </span>
          <span className="truncate">
            Press <strong className="text-white font-mono">F</strong> for Fullscreen •{' '}
            <strong className="text-white font-mono">Space</strong> to Pause Auto-Cycle •{' '}
            <strong className="text-white font-mono">Esc</strong> to Exit
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] font-bold">
          <span className="text-[#35D879] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35D879]" />
            Kiosk Active
          </span>
        </div>
      </footer>
    </div>
  );
};

// Sub-component: Kiosk Court Card with Top-Down Visual Arena Representation
interface KioskCourtCardProps {
  courtNumber: number;
  courtName: string;
  activeMatch: Match | null;
  recommendation: MatchCandidate | null;
  playersById: Record<string, Player>;
  isDark: boolean;
  getMatchDuration: (startTime: number) => string;
  onStartRecommended?: (courtNumber: number, candidate: MatchCandidate) => void;
  onEnterScore?: (match: Match) => void;
  isMarquee?: boolean;
}

const KioskCourtCard: React.FC<KioskCourtCardProps> = ({
  courtNumber,
  courtName,
  activeMatch,
  recommendation,
  playersById,
  isDark,
  getMatchDuration,
  onStartRecommended,
  onEnterScore,
  isMarquee = false,
}) => {
  const [durationStr, setDurationStr] = useState<string>('0:00');

  useEffect(() => {
    if (!activeMatch) return;
    const update = () => {
      setDurationStr(getMatchDuration(activeMatch.startTime));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [activeMatch, getMatchDuration]);

  const getP = (id: string): Player => {
    return (
      playersById[id] || {
        id,
        name: 'Player',
        skillRating: 3,
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
        waitingSince: null,
        totalWaitingTimeMs: 0,
        teammateHistory: {},
        opponentHistory: {},
      }
    );
  };

  if (activeMatch) {
    const pA1 = getP(activeMatch.teamA[0]);
    const pA2 = getP(activeMatch.teamA[1]);
    const pB1 = getP(activeMatch.teamB[0]);
    const pB2 = getP(activeMatch.teamB[1]);

    const hasLiveScore = activeMatch.scoreA !== null && activeMatch.scoreB !== null;

    return (
      <div
        className={`rounded-2xl border transition-all shadow-xl overflow-hidden flex flex-col ${
          isDark
            ? 'bg-[#0C241C] border-[#1C4E3E] hover:border-[#35D879]/50'
            : 'bg-white border-[#D6E4DC] hover:border-[#35D879]'
        } ${isMarquee ? 'p-6 sm:p-8' : 'p-4 sm:p-5'}`}
      >
        {/* Court Top Ribbon */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1C4E3E]/40 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#35D879] animate-ping" />
            <span
              className={`font-black tracking-tight font-display ${
                isMarquee ? 'text-2xl' : 'text-base'
              } ${isDark ? 'text-white' : 'text-[#172033]'}`}
            >
              {courtName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono tracking-wider bg-[#103F32] text-[#35D879] border border-[#35D879]/40 shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>{durationStr}</span>
            </span>
            {onEnterScore && (
              <button
                onClick={() => onEnterScore(activeMatch)}
                className="px-2.5 py-1 rounded-lg bg-[#35D879] text-[#0A2018] text-xs font-bold hover:bg-[#43e687] transition active:scale-95 shadow-sm"
              >
                Score
              </button>
            )}
          </div>
        </div>

        {/* Visual Court Layout (Team A | Net/Kitchen | Team B) */}
        <div
          className={`rounded-xl border relative p-3 sm:p-4 mb-3 ${
            isDark
              ? 'bg-[#081813] border-[#194637]'
              : 'bg-[#F2F7F4] border-[#D6E4DC]'
          }`}
        >
          {/* Pickleball NVZ Center Net Line */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 bg-[#103F32]/60 border-x border-white/20 flex flex-col items-center justify-between py-1 pointer-events-none">
            <span className="text-[8px] font-black uppercase tracking-widest text-[#35D879] rotate-90 transform origin-center whitespace-nowrap">
              NVZ
            </span>
            <div className="w-full border-t border-dashed border-white/40" />
            <span className="text-[8px] font-black uppercase tracking-widest text-[#35D879] rotate-90 transform origin-center whitespace-nowrap">
              KITCHEN
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-12 relative z-10">
            {/* Team A (Left Side) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#35D879]">
                  Team Alpha
                </span>
                {hasLiveScore && (
                  <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                    {activeMatch.scoreA}
                  </span>
                )}
              </div>

              {/* Player A1 */}
              <div className="flex items-center gap-2">
                <PlayerAvatar
                  name={pA1.name}
                  avatar={pA1.avatar}
                  className={isMarquee ? 'w-12 h-12 rounded-full border border-white/20' : 'w-8 h-8 rounded-full border border-white/10'}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-black truncate ${
                      isMarquee ? 'text-base' : 'text-xs'
                    } ${isDark ? 'text-white' : 'text-[#172033]'}`}
                  >
                    {pA1.name}
                  </div>
                  <div className="text-[10px] text-[#35D879] font-bold">
                    {SKILL_LEVEL_DUPR[pA1.skillRating]}
                  </div>
                </div>
              </div>

              {/* Player A2 */}
              <div className="flex items-center gap-2">
                <PlayerAvatar
                  name={pA2.name}
                  avatar={pA2.avatar}
                  className={isMarquee ? 'w-12 h-12 rounded-full border border-white/20' : 'w-8 h-8 rounded-full border border-white/10'}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-black truncate ${
                      isMarquee ? 'text-base' : 'text-xs'
                    } ${isDark ? 'text-white' : 'text-[#172033]'}`}
                  >
                    {pA2.name}
                  </div>
                  <div className="text-[10px] text-[#35D879] font-bold">
                    {SKILL_LEVEL_DUPR[pA2.skillRating]}
                  </div>
                </div>
              </div>
            </div>

            {/* Team B (Right Side) */}
            <div className="space-y-3 text-right">
              <div className="flex items-center justify-between flex-row-reverse">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#35D879]">
                  Team Bravo
                </span>
                {hasLiveScore && (
                  <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                    {activeMatch.scoreB}
                  </span>
                )}
              </div>

              {/* Player B1 */}
              <div className="flex items-center gap-2 flex-row-reverse">
                <PlayerAvatar
                  name={pB1.name}
                  avatar={pB1.avatar}
                  className={isMarquee ? 'w-12 h-12 rounded-full border border-white/20' : 'w-8 h-8 rounded-full border border-white/10'}
                />
                <div className="min-w-0 flex-1 text-right">
                  <div
                    className={`font-black truncate ${
                      isMarquee ? 'text-base' : 'text-xs'
                    } ${isDark ? 'text-white' : 'text-[#172033]'}`}
                  >
                    {pB1.name}
                  </div>
                  <div className="text-[10px] text-[#35D879] font-bold">
                    {SKILL_LEVEL_DUPR[pB1.skillRating]}
                  </div>
                </div>
              </div>

              {/* Player B2 */}
              <div className="flex items-center gap-2 flex-row-reverse">
                <PlayerAvatar
                  name={pB2.name}
                  avatar={pB2.avatar}
                  className={isMarquee ? 'w-12 h-12 rounded-full border border-white/20' : 'w-8 h-8 rounded-full border border-white/10'}
                />
                <div className="min-w-0 flex-1 text-right">
                  <div
                    className={`font-black truncate ${
                      isMarquee ? 'text-base' : 'text-xs'
                    } ${isDark ? 'text-white' : 'text-[#172033]'}`}
                  >
                    {pB2.name}
                  </div>
                  <div className="text-[10px] text-[#35D879] font-bold">
                    {SKILL_LEVEL_DUPR[pB2.skillRating]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Match Footer Tag */}
        <div className="flex items-center justify-between text-[11px] pt-1">
          <span
            className={`font-semibold ${isDark ? 'text-[#87A89A]' : 'text-[#64748B]'}`}
          >
            {activeMatch.explanation || 'Fair Doubles Rotation'}
          </span>
          <span className="text-[#35D879] font-mono font-bold uppercase">
            Game In Progress
          </span>
        </div>
      </div>
    );
  }

  // If court is open / recommended match ready
  if (recommendation) {
    const pA1 = getP(recommendation.teamA[0]);
    const pA2 = getP(recommendation.teamA[1]);
    const pB1 = getP(recommendation.teamB[0]);
    const pB2 = getP(recommendation.teamB[1]);

    return (
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xl flex flex-col justify-between ${
          isDark
            ? 'bg-[#091D16] border-[#1C4E3E]'
            : 'bg-white border-[#D6E4DC]'
        } ${isMarquee ? 'p-6 sm:p-8' : ''}`}
      >
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#1C4E3E]/40 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span
                className={`font-black tracking-tight font-display ${
                  isMarquee ? 'text-2xl' : 'text-base'
                } ${isDark ? 'text-white' : 'text-[#172033]'}`}
              >
                {courtName}
              </span>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-400 border border-amber-400/30">
              Up Next
            </span>
          </div>

          <div className="text-center py-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#35D879]">
              Recommended Matchup • {Math.round(recommendation.balanceScore)}% Parity
            </span>
          </div>

          {/* Player Grid */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#87A89A]">
                Side A
              </span>
              <div className="text-xs font-bold text-white truncate">{pA1.name}</div>
              <div className="text-xs font-bold text-white truncate">{pA2.name}</div>
            </div>
            <div className="space-y-2 text-right">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#87A89A]">
                Side B
              </span>
              <div className="text-xs font-bold text-white truncate">{pB1.name}</div>
              <div className="text-xs font-bold text-white truncate">{pB2.name}</div>
            </div>
          </div>
        </div>

        {onStartRecommended && (
          <button
            onClick={() => onStartRecommended(courtNumber, recommendation)}
            className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#103F32] hover:bg-[#155443] border border-[#35D879]/50 text-[#35D879] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
          >
            <Play className="w-4 h-4 fill-[#35D879]" />
            <span>Call Players to Court</span>
          </button>
        )}
      </div>
    );
  }

  // Completely open court
  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col items-center justify-center text-center ${
        isDark ? 'bg-[#091D16] border-[#1C4E3E]' : 'bg-white border-[#D6E4DC]'
      } min-h-[220px]`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#103F32] border border-[#35D879]/30 flex items-center justify-center text-[#35D879] mb-3">
        <Layers className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-black font-display text-white">{courtName}</h3>
      <p className="text-xs text-[#87A89A] mt-1 max-w-xs">
        Court is available and open for play. Next match will be assigned automatically.
      </p>
      <span className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#103F32] text-[#35D879] border border-[#35D879]/30">
        Court Open
      </span>
    </div>
  );
};
