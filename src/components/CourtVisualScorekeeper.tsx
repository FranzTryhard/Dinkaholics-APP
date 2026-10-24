import React, { useState, useEffect } from 'react';
import { Match, Player } from '../types';
import { PickleballIcon } from './PickleballIcon';
import {
  Trophy,
  Undo2,
  ArrowLeft,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCw,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { courtAudio } from '../utils/audio';

interface CourtVisualScorekeeperProps {
  match: Match;
  playersById: Record<string, Player>;
  onClose: () => void;
  onFinishMatch: (matchId: string, scoreA: number, scoreB: number, winnerTeam: 'teamA' | 'teamB') => void;
}

export const CourtVisualScorekeeper: React.FC<CourtVisualScorekeeperProps> = ({
  match,
  playersById,
  onClose,
  onFinishMatch,
}) => {
  const [scoreA, setScoreA] = useState(match.scoreA || 0);
  const [scoreB, setScoreB] = useState(match.scoreB || 0);
  const [serverNumber, setServerNumber] = useState<1 | 2>(1);
  const [servingTeam, setServingTeam] = useState<'teamA' | 'teamB'>('teamA');
  const [history, setHistory] = useState<Array<{ a: number; b: number; sNum: 1 | 2; sTeam: 'teamA' | 'teamB' }>>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMatchEnded, setIsMatchEnded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(courtAudio.getSoundEnabled());
  const [isBigDigitMode, setIsBigDigitMode] = useState(false);
  const [isSwappedSides, setIsSwappedSides] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const update = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - match.startTime) / 1000)));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [match.startTime]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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

  const teamAPlayers = match.teamA.map(getPlayer);
  const teamBPlayers = match.teamB.map(getPlayer);

  // Pickleball score string: Server Score - Receiver Score - Server Number
  const serverScore = servingTeam === 'teamA' ? scoreA : scoreB;
  const receiverScore = servingTeam === 'teamA' ? scoreB : scoreA;

  const handleScorePoint = (scoringTeam: 'teamA' | 'teamB') => {
    // Record history for undo
    setHistory((prev) => [...prev, { a: scoreA, b: scoreB, sNum: serverNumber, sTeam: servingTeam }]);

    let nextA = scoreA;
    let nextB = scoreB;
    let nextServerNumber = serverNumber;
    let nextServingTeam = servingTeam;

    if (scoringTeam === servingTeam) {
      // Serving team scored a point!
      if (scoringTeam === 'teamA') {
        nextA = scoreA + 1;
        setToastMessage(`+1 Point to Team 1!`);
      } else {
        nextB = scoreB + 1;
        setToastMessage(`+1 Point to Team 2!`);
      }
      courtAudio.playPaddleHit();
    } else {
      // Side out / Change of server
      if (serverNumber === 1) {
        nextServerNumber = 2;
        setToastMessage(`Second Server!`);
      } else {
        nextServerNumber = 1;
        nextServingTeam = servingTeam === 'teamA' ? 'teamB' : 'teamA';
        setToastMessage(`Side out! ${nextServingTeam === 'teamA' ? 'Team 1' : 'Team 2'} now serving`);
      }
      courtAudio.playSideOut();
    }

    setScoreA(nextA);
    setScoreB(nextB);
    setServerNumber(nextServerNumber);
    setServingTeam(nextServingTeam);

    // Check for win condition (11 points and win by 2)
    if (
      (nextA >= 11 && nextA - nextB >= 2) ||
      (nextB >= 11 && nextB - nextA >= 2)
    ) {
      setIsMatchEnded(true);
      courtAudio.playMatchWin();
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }

    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    courtAudio.setSoundEnabled(next);
    if (next) {
      courtAudio.playPaddleHit();
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setScoreA(last.a);
    setScoreB(last.b);
    setServerNumber(last.sNum);
    setServingTeam(last.sTeam);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setIsMatchEnded(false);
  };

  const handleConfirmFinish = () => {
    if (isSubmitting) return;
    if (scoreA === scoreB) {
      setToastMessage('Match cannot end in a tie. One team must win.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setIsSubmitting(true);
    const winner: 'teamA' | 'teamB' = scoreA > scoreB ? 'teamA' : 'teamB';
    onFinishMatch(match.id, scoreA, scoreB, winner);
  };

  if (isMatchEnded) {
    const isWinnerA = scoreA >= scoreB;
    const winnerPlayers = isWinnerA ? teamAPlayers : teamBPlayers;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F382C] via-[#144637] to-[#081F19] text-white p-7 shadow-2xl flex flex-col items-center text-center relative overflow-hidden border border-[#1b5c49]/50">
          <div className="w-28 h-28 rounded-full bg-lime-400/10 blur-xl absolute top-8 pointer-events-none" />

          {/* Trophy Illustration */}
          <div className="relative mb-3 mt-1">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 p-4 shadow-xl flex items-center justify-center text-slate-900 mx-auto">
              <Trophy className="w-12 h-12 text-amber-700 stroke-[2] fill-amber-300" />
            </div>
          </div>

          <div className="text-xs uppercase tracking-widest font-bold text-emerald-200">
            {match.courtName || `Court ${match.courtNumber}`}
          </div>
          <h2 className="text-2xl font-black text-white mt-1 font-display tracking-tight">
            {isWinnerA ? 'Team 1 Takes the Win!' : 'Team 2 Takes the Win!'}
          </h2>
          <div className="text-4xl font-black font-mono tabular-nums text-[#D4E938] mt-2 mb-4">
            {scoreA} - {scoreB}
          </div>

          {/* Winning Players list */}
          <div className="w-full space-y-2 mb-6">
            <div className="flex items-center justify-center gap-4">
              {winnerPlayers.map((p) => (
                <div key={p.id} className="flex flex-col items-center">
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#D4E938]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/20 text-white font-bold flex items-center justify-center border-2 border-[#D4E938]">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-white mt-1 truncate max-w-[100px]">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-lime-300 font-mono tabular-nums">Level {p.skillRating}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-2">
            <button
              onClick={handleConfirmFinish}
              disabled={isSubmitting}
              className={`touch-target w-full py-3 rounded-xl bg-[#84CC16] text-[#0A271E] font-black text-xs shadow-md hover:bg-lime-400 transition active:scale-95 font-display ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Recording Result...' : 'Confirm Result & Next Rotation'}
            </button>
            <button
              onClick={handleUndo}
              className="touch-target w-full py-2.5 rounded-xl border border-white/20 text-emerald-100 font-semibold text-xs hover:bg-white/10 transition"
            >
              Back to Scorekeeper
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSideOut = () => {
    setHistory((prev) => [...prev, { a: scoreA, b: scoreB, sNum: serverNumber, sTeam: servingTeam }]);
    let nextNum: 1 | 2 = 1;
    let nextTeam: 'teamA' | 'teamB' = servingTeam;
    if (serverNumber === 1) {
      nextNum = 2;
      setToastMessage('Second Server!');
    } else {
      nextNum = 1;
      nextTeam = servingTeam === 'teamA' ? 'teamB' : 'teamA';
      setToastMessage(`Side out! ${nextTeam === 'teamA' ? 'Team 1' : 'Team 2'} serving`);
    }
    setServerNumber(nextNum);
    setServingTeam(nextTeam);
    courtAudio.playSideOut();
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (isBigDigitMode) {
    const leftTeam = isSwappedSides ? 'teamB' : 'teamA';
    const rightTeam = isSwappedSides ? 'teamA' : 'teamB';
    const leftScore = leftTeam === 'teamA' ? scoreA : scoreB;
    const rightScore = rightTeam === 'teamA' ? scoreA : scoreB;
    const leftPlayers = leftTeam === 'teamA' ? teamAPlayers : teamBPlayers;
    const rightPlayers = rightTeam === 'teamA' ? teamAPlayers : teamBPlayers;
    const isLeftServing = servingTeam === leftTeam;
    const isRightServing = servingTeam === rightTeam;

    return (
      <div className="fixed inset-0 z-50 bg-[#061811] text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-150">
        {/* Top HUD: Court-Side Tripod Controls */}
        <div className="px-4 py-3 bg-[#0a2319] border-b border-emerald-900/60 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBigDigitMode(false)}
              className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
              title="Return to standard scorekeeper"
            >
              <Minimize2 className="w-4 h-4 text-[#D4E938]" />
              <span className="hidden sm:inline">Standard View</span>
            </button>
            <button
              onClick={toggleSound}
              className={`touch-target p-2 rounded-xl transition ${
                soundEnabled
                  ? 'text-[#D4E938] bg-white/10 hover:bg-white/20'
                  : 'text-white/40 hover:bg-white/10'
              }`}
              title={soundEnabled ? 'Mute court audio' : 'Unmute court audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Center: Pickleball Official Score Announcement Banner */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black font-mono tracking-wider text-slate-100 bg-[#030e0a] px-3.5 py-1 rounded-full border border-emerald-800/80">
              <span className="text-[#D4E938] font-bold">{serverScore}</span>
              <span className="text-emerald-500">-</span>
              <span className="text-white font-bold">{receiverScore}</span>
              <span className="text-emerald-500">-</span>
              <span className="text-[#84CC16] bg-emerald-950 px-1.5 rounded text-[11px] font-bold">
                #{serverNumber}
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5 uppercase tracking-wider flex items-center gap-1">
              <span>{match.courtName || `Court ${match.courtNumber}`}</span>
              <span>·</span>
              <Clock className="w-2.5 h-2.5 inline" />
              <span>{formatTimer(elapsed)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSwappedSides(!isSwappedSides)}
              className="touch-target inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 text-xs font-semibold transition"
              title="Switch sides (change ends)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Switch Ends</span>
            </button>
            <button
              onClick={handleConfirmFinish}
              className="touch-target px-3 py-1.5 rounded-xl bg-[#84CC16] text-[#0A271E] font-black text-xs hover:bg-lime-400 transition shadow-sm"
            >
              Finish
            </button>
          </div>
        </div>

        {/* Main High-Contrast Giant Split Screen */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2 sm:p-4 relative">
          {/* Left Team Interactive Panel */}
          <div
            onClick={() => handleScorePoint(leftTeam)}
            className={`rounded-3xl p-5 flex flex-col justify-between cursor-pointer transition active:scale-[0.99] border-2 relative overflow-hidden ${
              isLeftServing
                ? 'bg-gradient-to-b from-[#0F382C] to-[#0A271E] border-[#84CC16]/80 shadow-[0_0_30px_rgba(132,204,22,0.15)]'
                : 'bg-[#0A2017] border-emerald-900/50 hover:border-emerald-800'
            }`}
          >
            {/* Team Info Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest font-mono text-emerald-400 font-bold">
                  {leftTeam === 'teamA' ? 'Team 1' : 'Team 2'}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white font-display mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                  {leftPlayers.map((p) => p.name).join(' & ')}
                </h3>
              </div>

              {isLeftServing && (
                <div className="inline-flex items-center gap-1.5 bg-[#84CC16] text-[#081F19] px-2.5 py-1 rounded-full text-xs font-black shadow-md animate-pulse">
                  <PickleballIcon className="w-4 h-4 text-[#081F19]" />
                  <span>SERVING · #{serverNumber}</span>
                </div>
              )}
            </div>

            {/* Huge Score Number */}
            <div className="flex items-center justify-center my-auto py-4">
              <span className={`text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] font-black font-mono tabular-nums leading-none tracking-tighter ${
                isLeftServing ? 'text-[#D4E938]' : 'text-white'
              }`}>
                {leftScore}
              </span>
            </div>

            {/* Bottom Tap Action Callout */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-800/40">
              <span className="text-[11px] text-emerald-300 font-medium">Tap side to score</span>
              <span className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider">
                +1 Point
              </span>
            </div>
          </div>

          {/* Right Team Interactive Panel */}
          <div
            onClick={() => handleScorePoint(rightTeam)}
            className={`rounded-3xl p-5 flex flex-col justify-between cursor-pointer transition active:scale-[0.99] border-2 relative overflow-hidden ${
              isRightServing
                ? 'bg-gradient-to-b from-[#0F382C] to-[#0A271E] border-[#84CC16]/80 shadow-[0_0_30px_rgba(132,204,22,0.15)]'
                : 'bg-[#0A2017] border-emerald-900/50 hover:border-emerald-800'
            }`}
          >
            {/* Team Info Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest font-mono text-emerald-400 font-bold">
                  {rightTeam === 'teamA' ? 'Team 1' : 'Team 2'}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white font-display mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                  {rightPlayers.map((p) => p.name).join(' & ')}
                </h3>
              </div>

              {isRightServing && (
                <div className="inline-flex items-center gap-1.5 bg-[#84CC16] text-[#081F19] px-2.5 py-1 rounded-full text-xs font-black shadow-md animate-pulse">
                  <PickleballIcon className="w-4 h-4 text-[#081F19]" />
                  <span>SERVING · #{serverNumber}</span>
                </div>
              )}
            </div>

            {/* Huge Score Number */}
            <div className="flex items-center justify-center my-auto py-4">
              <span className={`text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] font-black font-mono tabular-nums leading-none tracking-tighter ${
                isRightServing ? 'text-[#D4E938]' : 'text-white'
              }`}>
                {rightScore}
              </span>
            </div>

            {/* Bottom Tap Action Callout */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-800/40">
              <span className="text-[11px] text-emerald-300 font-medium">Tap side to score</span>
              <span className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider">
                +1 Point
              </span>
            </div>
          </div>
        </div>

        {/* Floating Quick Action Bar for Referees / Bench Operators */}
        <div className="px-4 py-3 bg-[#0a2319] border-t border-emerald-900/60 flex items-center justify-center gap-3">
          <button
            onClick={handleSideOut}
            className="touch-target px-4 py-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
          >
            <span>Side Out / Change Server</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={handleUndo}
              className="touch-target px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
            >
              <Undo2 className="w-4 h-4" />
              <span>Undo Point</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F9F8] flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="touch-target p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
            title="Exit scorekeeper"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={toggleSound}
            className={`touch-target p-2 rounded-xl transition ${
              soundEnabled
                ? 'text-[#0F382C] bg-emerald-50 hover:bg-emerald-100'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={soundEnabled ? 'Mute court audio' : 'Unmute court audio'}
            aria-label={soundEnabled ? 'Mute court audio' : 'Unmute court audio'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsBigDigitMode(true)}
            className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0F382C] font-bold text-xs transition"
            title="Switch to Court-Side Tripod Fullscreen Mode"
          >
            <Maximize2 className="w-4 h-4 text-[#0F382C]" />
            <span className="hidden sm:inline">Court-Side Mode</span>
          </button>
        </div>

        <div className="text-center">
          <h2 className="font-bold text-slate-900 text-sm tracking-tight font-display">
            {match.courtName || `Court ${match.courtNumber}`} · Live
          </h2>
          <div className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            {formatTimer(elapsed)}
          </div>
        </div>

        <button
          onClick={handleConfirmFinish}
          className="touch-target text-xs font-bold text-[#0F382C] hover:underline px-3 py-1.5"
        >
          Finish Game
        </button>
      </div>

      {/* Main Score Area */}
      <div className="p-4 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Pickleball Call: Server - Receiver - Server #
        </div>

        {/* Big Official Pickleball Score: Server Score - Receiver Score - Server Number */}
        <div className="flex items-center gap-3 sm:gap-4 my-2">
          <div className="text-center">
            <span className="text-5xl font-black font-mono tabular-nums text-[#0F382C]">
              {serverScore}
            </span>
            <div className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Server</div>
          </div>
          <span className="text-4xl font-mono text-slate-300">-</span>
          <div className="text-center">
            <span className="text-5xl font-black font-mono tabular-nums text-slate-800">
              {receiverScore}
            </span>
            <div className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Receiver</div>
          </div>
          <span className="text-4xl font-mono text-slate-300">-</span>
          <div className="text-center">
            <span className="text-5xl font-black font-mono tabular-nums text-[#D4E938] bg-[#0F382C] px-3 py-0.5 rounded-xl">
              {serverNumber}
            </span>
            <div className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Server #</div>
          </div>
        </div>

        {/* Undo button */}
        {history.length > 0 && (
          <button
            onClick={handleUndo}
            className="touch-target flex items-center gap-1 text-xs font-semibold text-[#0F382C] hover:underline my-2"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo last point</span>
          </button>
        )}

        <div className="text-xs font-medium text-slate-600 mt-2 text-center">
          Tap court team area below or use buttons to score:
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="my-2 px-3 py-1.5 rounded-full bg-[#0F382C] text-[#D4E938] text-xs font-bold animate-bounce shadow-md">
            {toastMessage}
          </div>
        )}

        {/* Interactive Pickleball Court Top-Down View */}
        <div className="mt-3 w-full aspect-[4/5] max-h-80 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex flex-col bg-[#144637] relative">
          {/* Top Half: Team 1 */}
          <button
            type="button"
            onClick={() => handleScorePoint('teamA')}
            className={`flex-1 relative flex border-b-2 border-white/50 transition active:scale-[0.99] ${
              servingTeam === 'teamA' ? 'bg-[#1b5c49]' : 'bg-[#0F382C]'
            }`}
          >
            {/* Left box */}
            <div className="flex-1 border-r border-white/30 flex items-center justify-center p-2 relative">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shadow">
                {teamAPlayers[0].name.charAt(0)}
              </div>
              <span className="absolute bottom-2 text-[10px] text-white/90 font-medium truncate max-w-[80px]">
                {teamAPlayers[0].name}
              </span>
            </div>

            {/* Right box */}
            <div className="flex-1 flex items-center justify-center p-2 relative">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shadow">
                {teamAPlayers[1].name.charAt(0)}
              </div>
              <span className="absolute bottom-2 text-[10px] text-white/90 font-medium truncate max-w-[80px]">
                {teamAPlayers[1].name}
              </span>
            </div>

            {/* Serving indicator ball on Team A */}
            {servingTeam === 'teamA' && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#84CC16] text-[#0A271E] font-black text-[9px] px-1.5 py-0.5 rounded-full shadow">
                <PickleballIcon className="w-3 h-3 text-[#0A271E]" />
                <span>Serving</span>
              </div>
            )}
          </button>

          {/* Kitchen / Non-Volley Zone */}
          <div className="h-10 bg-[#0c2e24] border-y-2 border-white/70 flex items-center justify-center text-[10px] font-bold text-white/80 uppercase tracking-widest shadow-inner">
            Non-Volley Zone (NVZ)
          </div>

          {/* Bottom Half: Team 2 */}
          <button
            type="button"
            onClick={() => handleScorePoint('teamB')}
            className={`flex-1 relative flex transition active:scale-[0.99] ${
              servingTeam === 'teamB' ? 'bg-[#1b5c49]' : 'bg-[#0F382C]'
            }`}
          >
            {/* Left box */}
            <div className="flex-1 border-r border-white/30 flex items-center justify-center p-2 relative">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shadow">
                {teamBPlayers[0].name.charAt(0)}
              </div>
              <span className="absolute top-2 text-[10px] text-white/90 font-medium truncate max-w-[80px]">
                {teamBPlayers[0].name}
              </span>
            </div>

            {/* Right box */}
            <div className="flex-1 flex items-center justify-center p-2 relative">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shadow">
                {teamBPlayers[1].name.charAt(0)}
              </div>
              <span className="absolute top-2 text-[10px] text-white/90 font-medium truncate max-w-[80px]">
                {teamBPlayers[1].name}
              </span>
            </div>

            {/* Serving indicator ball on Team B */}
            {servingTeam === 'teamB' && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-[#84CC16] text-[#0A271E] font-black text-[9px] px-1.5 py-0.5 rounded-full shadow">
                <PickleballIcon className="w-3 h-3 text-[#0A271E]" />
                <span>Serving</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => handleScorePoint('teamA')}
            className="touch-target flex-1 py-3 rounded-xl bg-[#0F382C] text-white font-bold text-xs hover:bg-[#144637] shadow-sm transition active:scale-95"
          >
            +1 Team 1 ({scoreA})
          </button>
          <button
            onClick={() => handleScorePoint('teamB')}
            className="touch-target flex-1 py-3 rounded-xl bg-[#0F382C] text-white font-bold text-xs hover:bg-[#144637] shadow-sm transition active:scale-95"
          >
            +1 Team 2 ({scoreB})
          </button>
        </div>
      </div>
    </div>
  );
};
