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
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { courtAudio } from '../utils/audio';
import { PickleballBounceLoader } from './PickleballBounceLoader';
import { StorageService } from '../engine/storage';
import { PlayerAvatar } from './PlayerAvatar';

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
  // Player index on serving team (0 or 1) who is currently serving
  const [serverPlayerIndex, setServerPlayerIndex] = useState<0 | 1>(0);
  // Current court positions: [leftBoxPlayerIdx, rightBoxPlayerIdx]
  const [teamAPositions, setTeamAPositions] = useState<[number, number]>([0, 1]);
  const [teamBPositions, setTeamBPositions] = useState<[number, number]>([0, 1]);
  // Scoring mode: 'side_out' (traditional doubles 1-2-Sideout) or 'rally' (point every rally)
  const [scoringMode, setScoringMode] = useState<'side_out' | 'rally'>('side_out');

  const [history, setHistory] = useState<
    Array<{
      a: number;
      b: number;
      sNum: 1 | 2;
      sTeam: 'teamA' | 'teamB';
      sPlayerIdx: 0 | 1;
      posA: [number, number];
      posB: [number, number];
    }>
  >([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMatchEnded, setIsMatchEnded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(courtAudio.getSoundEnabled());
  const [isBigDigitMode, setIsBigDigitMode] = useState(false);
  const [isSwappedSides, setIsSwappedSides] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (isSubmitting || isMatchEnded) return;
    const update = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - match.startTime) / 1000)));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [match.startTime, isSubmitting, isMatchEnded]);

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

  // The active server object
  const activeServerPlayer =
    servingTeam === 'teamA'
      ? teamAPlayers[serverPlayerIndex] || teamAPlayers[0]
      : teamBPlayers[serverPlayerIndex] || teamBPlayers[0];

  // Pickleball score string: Server Score - Receiver Score - Server Number
  const serverScore = servingTeam === 'teamA' ? scoreA : scoreB;
  const receiverScore = servingTeam === 'teamA' ? scoreB : scoreA;

  const handleScorePoint = (scoringTeam: 'teamA' | 'teamB') => {
    // Record history for full undo
    setHistory((prev) => [
      ...prev,
      {
        a: scoreA,
        b: scoreB,
        sNum: serverNumber,
        sTeam: servingTeam,
        sPlayerIdx: serverPlayerIndex,
        posA: [...teamAPositions] as [number, number],
        posB: [...teamBPositions] as [number, number],
      },
    ]);

    let nextA = scoreA;
    let nextB = scoreB;
    let nextServerNumber = serverNumber;
    let nextServingTeam = servingTeam;
    let nextServerPlayerIndex = serverPlayerIndex;
    let nextPosA: [number, number] = [...teamAPositions];
    let nextPosB: [number, number] = [...teamBPositions];

    if (scoringMode === 'rally') {
      // In Rally Scoring: whoever wins the rally scores a point
      if (scoringTeam === 'teamA') {
        nextA = scoreA + 1;
      } else {
        nextB = scoreB + 1;
      }

      if (scoringTeam === servingTeam) {
        // Serving team scored: switch sides, same server continues
        if (servingTeam === 'teamA') {
          nextPosA = [teamAPositions[1], teamAPositions[0]];
        } else {
          nextPosB = [teamBPositions[1], teamBPositions[0]];
        }
        setToastMessage(`+1 Point to ${scoringTeam === 'teamA' ? 'Team 1' : 'Team 2'}!`);
        courtAudio.playPaddleHit();
      } else {
        // Receiving team scored: serve switches to receiving team
        nextServingTeam = scoringTeam;
        nextServerNumber = 1;
        nextServerPlayerIndex = 0;
        const newServer = scoringTeam === 'teamA' ? teamAPlayers[0] : teamBPlayers[0];
        setToastMessage(`+1 Point! Serve switches to ${newServer.name}`);
        courtAudio.playSideOut();
      }
    } else {
      // Traditional Side-Out Doubles Scoring:
      if (scoringTeam === servingTeam) {
        // Serving team scored a point!
        if (scoringTeam === 'teamA') {
          nextA = scoreA + 1;
          // Serving team players switch left/right court sides
          nextPosA = [teamAPositions[1], teamAPositions[0]];
          setToastMessage(`+1 Point to Team 1! ${teamAPlayers[serverPlayerIndex].name} serves again`);
        } else {
          nextB = scoreB + 1;
          // Serving team players switch left/right court sides
          nextPosB = [teamBPositions[1], teamBPositions[0]];
          setToastMessage(`+1 Point to Team 2! ${teamBPlayers[serverPlayerIndex].name} serves again`);
        }
        courtAudio.playPaddleHit();
      } else {
        // Receiving team won the rally (serving team faults)
        if (serverNumber === 1) {
          // Serve switches to Second Server on the SAME team!
          nextServerNumber = 2;
          nextServerPlayerIndex = serverPlayerIndex === 0 ? 1 : 0;
          const partner =
            servingTeam === 'teamA'
              ? teamAPlayers[nextServerPlayerIndex]
              : teamBPlayers[nextServerPlayerIndex];
          setToastMessage(`Second Server! ${partner.name} now serving (#2)`);
        } else {
          // Server 2 faulted -> SIDE OUT! Serve switches to the OTHER team!
          nextServerNumber = 1;
          nextServingTeam = servingTeam === 'teamA' ? 'teamB' : 'teamA';
          nextServerPlayerIndex = 0;
          const nextTeamServer =
            nextServingTeam === 'teamA' ? teamAPlayers[0] : teamBPlayers[0];
          setToastMessage(
            `Side out! ${nextTeamServer.name} now serving for ${
              nextServingTeam === 'teamA' ? 'Team 1' : 'Team 2'
            }`
          );
        }
        courtAudio.playSideOut();
      }
    }

    setScoreA(nextA);
    setScoreB(nextB);
    setServerNumber(nextServerNumber);
    setServingTeam(nextServingTeam);
    setServerPlayerIndex(nextServerPlayerIndex);
    setTeamAPositions(nextPosA);
    setTeamBPositions(nextPosB);

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
    setServerPlayerIndex(last.sPlayerIdx);
    setTeamAPositions(last.posA);
    setTeamBPositions(last.posB);
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
  };

  const handleSideOut = () => {
    setHistory((prev) => [
      ...prev,
      {
        a: scoreA,
        b: scoreB,
        sNum: serverNumber,
        sTeam: servingTeam,
        sPlayerIdx: serverPlayerIndex,
        posA: [...teamAPositions] as [number, number],
        posB: [...teamBPositions] as [number, number],
      },
    ]);
    let nextNum: 1 | 2 = 1;
    let nextTeam: 'teamA' | 'teamB' = servingTeam;
    let nextIdx: 0 | 1 = serverPlayerIndex;

    if (serverNumber === 1 && scoringMode === 'side_out') {
      nextNum = 2;
      nextIdx = serverPlayerIndex === 0 ? 1 : 0;
      const partner = servingTeam === 'teamA' ? teamAPlayers[nextIdx] : teamBPlayers[nextIdx];
      setToastMessage(`Second Server! ${partner.name} now serving (#2)`);
    } else {
      nextNum = 1;
      nextTeam = servingTeam === 'teamA' ? 'teamB' : 'teamA';
      nextIdx = 0;
      const nextServer = nextTeam === 'teamA' ? teamAPlayers[0] : teamBPlayers[0];
      setToastMessage(`Side out! ${nextServer.name} now serving for ${nextTeam === 'teamA' ? 'Team 1' : 'Team 2'}`);
    }
    setServerNumber(nextNum);
    setServingTeam(nextTeam);
    setServerPlayerIndex(nextIdx);
    courtAudio.playSideOut();
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Submitting transition screen
  if (isSubmitting) {
    const isWinnerA = scoreA >= scoreB;
    const winnerPlayers = isWinnerA ? teamAPlayers : teamBPlayers;
    const winnerNames = winnerPlayers.map((p) => p.name).join(' & ');
    const winner: 'teamA' | 'teamB' = scoreA > scoreB ? 'teamA' : 'teamB';
    const animDuration = StorageService.getAnimationDuration();

    return (
      <PickleballBounceLoader
        fullScreen={true}
        duration={animDuration}
        winnerPlayers={winnerPlayers}
        message={winnerNames}
        submessage={`Final Score ${scoreA} - ${scoreB}`}
        onComplete={() => {
          onFinishMatch(match.id, scoreA, scoreB, winner);
        }}
      />
    );
  }

  // Match Ended Celebration Screen
  if (isMatchEnded) {
    const isWinnerA = scoreA >= scoreB;
    const winnerPlayers = isWinnerA ? teamAPlayers : teamBPlayers;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in fade-in duration-200">
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
                  <PlayerAvatar
                    avatar={p.avatar}
                    name={p.name}
                    className="w-12 h-12 rounded-full border-2 border-[#D4E938]"
                  />
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
              className="touch-target w-full py-3 rounded-xl bg-[#84CC16] hover:bg-lime-400 text-[#0A271E] font-black text-xs shadow-md transition active:scale-95 font-display"
            >
              Confirm Result & Next Rotation
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

  // BIG DIGIT MODE (Tripod / Direct Outdoor Sunlight Mode)
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
      <div className="fixed inset-0 z-50 bg-[#061811] text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-150 pt-[env(safe-area-inset-top)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Top HUD: Court-Side Tripod Controls */}
        <div className="px-3 sm:px-4 py-2.5 bg-[#0a2319] border-b border-emerald-900/60 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsBigDigitMode(false)}
              className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
              title="Return to standard scorekeeper"
              aria-label="Return to standard scorekeeper"
            >
              <Minimize2 className="w-4 h-4 text-[#84CC16]" />
              <span className="hidden sm:inline">Standard View</span>
            </button>
            <button
              onClick={toggleSound}
              className={`touch-target p-2 rounded-xl transition ${
                soundEnabled
                  ? 'text-[#84CC16] bg-white/10 hover:bg-white/20'
                  : 'text-white/40 hover:bg-white/10'
              }`}
              title={soundEnabled ? 'Mute court audio' : 'Unmute court audio'}
              aria-label={soundEnabled ? 'Mute court audio' : 'Unmute court audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Center: Pickleball Score Announcement Banner */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black font-mono tracking-wider text-slate-100 bg-[#030e0a] px-3.5 py-1 rounded-full border border-emerald-800/80">
              <span className="text-[#84CC16] font-bold">{serverScore}</span>
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
              aria-label="Switch sides (change ends)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Switch Ends</span>
            </button>
            <button
              onClick={handleConfirmFinish}
              className="touch-target px-3 py-1.5 rounded-xl bg-[#84CC16] hover:bg-lime-400 text-[#07241A] font-black text-xs transition active:scale-95 shadow-sm"
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
                ? 'bg-gradient-to-b from-[#103F32] to-[#0A271E] border-[#84CC16]/80 shadow-[0_0_30px_rgba(132,204,22,0.15)]'
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
                <div className="inline-flex items-center gap-1.5 bg-[#84CC16] text-[#0A2B22] px-2.5 py-1 rounded-full text-xs font-black shadow-md">
                  <PickleballIcon className="w-4 h-4 text-[#0A2B22]" />
                  <span>SERVING · {activeServerPlayer.name} (#{serverNumber})</span>
                </div>
              )}
            </div>

            {/* Huge Score Number */}
            <div className="flex items-center justify-center my-auto py-4">
              <span className={`text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] font-black font-mono tabular-nums leading-none tracking-tighter ${
                isLeftServing ? 'text-[#84CC16]' : 'text-white'
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
                ? 'bg-gradient-to-b from-[#103F32] to-[#0A271E] border-[#84CC16]/80 shadow-[0_0_30px_rgba(132,204,22,0.15)]'
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
                <div className="inline-flex items-center gap-1.5 bg-[#84CC16] text-[#0A2B22] px-2.5 py-1 rounded-full text-xs font-black shadow-md">
                  <PickleballIcon className="w-4 h-4 text-[#0A2B22]" />
                  <span>SERVING · {activeServerPlayer.name} (#{serverNumber})</span>
                </div>
              )}
            </div>

            {/* Huge Score Number */}
            <div className="flex items-center justify-center my-auto py-4">
              <span className={`text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] font-black font-mono tabular-nums leading-none tracking-tighter ${
                isRightServing ? 'text-[#84CC16]' : 'text-white'
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

        {/* Floating Quick Action Bar */}
        <div className="px-4 py-3 bg-[#0a2319] border-t border-emerald-900/60 flex items-center justify-center gap-3">
          <button
            onClick={handleSideOut}
            className="touch-target px-4 py-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
          >
            <span>Fault / Rotate Server</span>
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

  // STANDARD POLISHED VIEW (Mobile-First Court-Side Scorekeeper)
  const playerLeftA = teamAPlayers[teamAPositions[0]] || teamAPlayers[0];
  const playerRightA = teamAPlayers[teamAPositions[1]] || teamAPlayers[1];
  const playerLeftB = teamBPlayers[teamBPositions[0]] || teamBPlayers[0];
  const playerRightB = teamBPlayers[teamBPositions[1]] || teamBPlayers[1];

  const isLeftAServing = servingTeam === 'teamA' && activeServerPlayer.id === playerLeftA.id;
  const isRightAServing = servingTeam === 'teamA' && activeServerPlayer.id === playerRightA.id;
  const isLeftBServing = servingTeam === 'teamB' && activeServerPlayer.id === playerLeftB.id;
  const isRightBServing = servingTeam === 'teamB' && activeServerPlayer.id === playerRightB.id;

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F9F8] flex flex-col justify-between overflow-hidden select-none pt-[env(safe-area-inset-top)] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* 1. Header and match information */}
      <header className="px-3 sm:px-5 py-2.5 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0 shadow-2xs">
        {/* Left: Back button, Sound toggle, Fullscreen/Tripod mode */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={onClose}
            className="touch-target p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95"
            title="Exit scorekeeper"
            aria-label="Exit scorekeeper"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={toggleSound}
            className={`touch-target p-2 rounded-xl transition active:scale-95 ${
              soundEnabled
                ? 'text-[#0F382C] bg-[#E5F8EC] hover:bg-[#C4EED3]'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={soundEnabled ? 'Mute court audio' : 'Unmute court audio'}
            aria-label={soundEnabled ? 'Mute court audio' : 'Unmute court audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsBigDigitMode(true)}
            className="touch-target inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 text-xs font-semibold transition active:scale-95 shadow-2xs"
            title="Switch to Court-Side Tripod Fullscreen Mode"
            aria-label="Switch to Court-Side Mode"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#0F382C]" />
            <span className="hidden sm:inline">Court-Side Mode</span>
          </button>
        </div>

        {/* Center: Live Court Name and Timer */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-bold text-slate-900 text-sm tracking-tight font-display">
              {match.courtName || `Court ${match.courtNumber}`}
            </h2>
          </div>
          <div className="text-[11px] font-mono tabular-nums text-slate-500 font-medium flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatTimer(elapsed)}</span>
          </div>
        </div>

        {/* Right: Finish Game Action */}
        <button
          onClick={handleConfirmFinish}
          className="touch-target px-3.5 py-1.5 rounded-xl bg-[#0F382C] hover:bg-[#154637] text-white font-bold text-xs shadow-2xs transition active:scale-95"
          aria-label="Finish Game"
        >
          Finish Game
        </button>
      </header>

      {/* 2. Main Middle Scoring Canvas (Fits Mobile Viewport without Scrolling) */}
      <main className="flex-1 w-full max-w-md mx-auto px-3 py-2 flex flex-col justify-between min-h-0 relative">
        {/* Floating Toast Message */}
        {toastMessage && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-[#0F382C] text-[#84CC16] text-xs font-bold shadow-lg border border-[#84CC16]/40 animate-in fade-in slide-in-from-top-2 duration-150 whitespace-nowrap">
            {toastMessage}
          </div>
        )}

        {/* Top: Scoreboard Card (The Primary Visual Anchor) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3 shadow-2xs flex flex-col items-center shrink-0">
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
            Official Call: Server · Receiver · Server #
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-6 my-1">
            {/* Server Score */}
            <div className="flex flex-col items-center min-w-[65px]">
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-[#0F382C] leading-none">
                {serverScore}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Server
              </span>
            </div>

            {/* Separator */}
            <span className="text-3xl font-mono font-bold text-slate-300 leading-none">·</span>

            {/* Receiver Score */}
            <div className="flex flex-col items-center min-w-[65px]">
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-slate-800 leading-none">
                {receiverScore}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Receiver
              </span>
            </div>

            {/* Separator */}
            <span className="text-3xl font-mono font-bold text-slate-300 leading-none">·</span>

            {/* Server Number (Restrained Lime Accent Treatment) */}
            <div className="flex flex-col items-center min-w-[65px]">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-[#0F382C] text-[#84CC16] border border-[#84CC16]/40 shadow-2xs">
                <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums leading-none">
                  #{serverNumber}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Server #
              </span>
            </div>
          </div>

          {/* Active Server Info Strip */}
          <div className="w-full pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 truncate">
              <PickleballIcon className="w-3.5 h-3.5 text-[#84CC16] shrink-0" />
              <span className="font-semibold text-slate-800 truncate">
                Serving: <strong className="text-[#0F382C]">{servingTeam === 'teamA' ? 'Team 1' : 'Team 2'}</strong> ({activeServerPlayer.name})
              </span>
            </div>
            <span className="text-slate-400 text-[10px] font-mono shrink-0 ml-2">
              Play to 11 (by 2)
            </span>
          </div>
        </div>

        {/* Middle: Compact Controls & Instructions Row */}
        <div className="my-1 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
          {/* Side-Out vs Rally Segmented Control */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-200/80 border border-slate-200 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setScoringMode('side_out')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                scoringMode === 'side_out'
                  ? 'bg-[#0F382C] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-Out
            </button>
            <button
              type="button"
              onClick={() => setScoringMode('rally')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                scoringMode === 'rally'
                  ? 'bg-[#0F382C] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rally
            </button>
          </div>

          {/* Subtle Contextual Fault / Next Server Indicator */}
          <span className="text-[10px] font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-lg truncate text-center">
            {scoringMode === 'side_out'
              ? (serverNumber === 1 ? 'Fault = Next Server (#2)' : 'Fault = Side Out (Change)')
              : 'Rally = Point Every Turn'}
          </span>

          {/* Undo Control (Always Present - Eliminates Layout Shifting) */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95 shrink-0 ${
              history.length > 0
                ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                : 'bg-transparent text-slate-300 border border-transparent cursor-not-allowed'
            }`}
            title={history.length > 0 ? 'Undo last point' : 'No points to undo'}
            aria-label="Undo last point"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>

        {/* Center: Interactive Pickleball Court (The Primary Interactive Element) */}
        <div className="flex-1 w-full max-h-[360px] min-h-[220px] rounded-2xl border-2 border-white/90 shadow-md overflow-hidden flex flex-col bg-[#0F382C] relative select-none">
          {/* Top Half: Team 1 Service Area */}
          <div
            className={`flex-1 relative flex border-b border-white/60 transition ${
              servingTeam === 'teamA' ? 'bg-[#154E3E]' : 'bg-[#0F382C]'
            }`}
          >
            {/* Team 1 Left Court Box (Deuce / Right from Team 1's perspective) */}
            <div
              onClick={() => handleScorePoint('teamA')}
              className={`flex-1 border-r border-white/40 flex flex-col items-center justify-center p-2 relative cursor-pointer hover:bg-white/5 active:scale-[0.99] transition ${
                isLeftAServing ? 'bg-[#1a5b47]' : ''
              }`}
              title={`Score point for Team 1 (${playerLeftA.name})`}
            >
              {/* Player Avatar with Server Indicator strictly inside Avatar Boundary */}
              <div className="relative">
                <PlayerAvatar
                  avatar={playerLeftA.avatar}
                  name={playerLeftA.name}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow transition-all duration-200 ${
                    isLeftAServing
                      ? 'ring-2 ring-inset ring-[#84CC16] shadow-[inset_0_0_8px_rgba(132,204,22,0.6),0_0_12px_rgba(132,204,22,0.35)]'
                      : 'border border-white/40'
                  }`}
                >
                  {isLeftAServing && (
                    <>
                      {/* Subtle lime-green inner-ring */}
                      <div className="absolute inset-0 rounded-full ring-2 ring-inset ring-[#84CC16] pointer-events-none" />
                      {/* Glowing server badge inside avatar boundary */}
                      <div className="absolute bottom-0 inset-x-0 py-0.5 bg-[#061E16]/90 backdrop-blur-xs flex items-center justify-center border-t border-[#84CC16]/60 pointer-events-none">
                        <span className="text-[8px] font-black font-mono text-[#84CC16] drop-shadow-[0_0_3px_rgba(132,204,22,0.9)] leading-none">
                          #{serverNumber}
                        </span>
                      </div>
                    </>
                  )}
                </PlayerAvatar>
              </div>

              {/* Player Name & Info */}
              <div className="mt-1 text-center min-w-0 px-1 pointer-events-none">
                <span className="text-xs font-bold text-white block truncate max-w-[95px] drop-shadow-xs">
                  {playerLeftA.name}
                </span>
                <span className="text-[10px] text-emerald-200/80 font-mono tabular-nums block">
                  L{playerLeftA.skillRating} · Team 1
                </span>
              </div>
            </div>

            {/* Team 1 Right Court Box */}
            <div
              onClick={() => handleScorePoint('teamA')}
              className={`flex-1 flex flex-col items-center justify-center p-2 relative cursor-pointer hover:bg-white/5 active:scale-[0.99] transition ${
                isRightAServing ? 'bg-[#1a5b47]' : ''
              }`}
              title={`Score point for Team 1 (${playerRightA.name})`}
            >
              {/* Player Avatar with Server Indicator strictly inside Avatar Boundary */}
              <div className="relative">
                <PlayerAvatar
                  avatar={playerRightA.avatar}
                  name={playerRightA.name}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow transition-all duration-200 ${
                    isRightAServing
                      ? 'ring-2 ring-inset ring-[#84CC16] shadow-[inset_0_0_8px_rgba(132,204,22,0.6),0_0_12px_rgba(132,204,22,0.35)]'
                      : 'border border-white/40'
                  }`}
                >
                  {isRightAServing && (
                    <>
                      {/* Subtle lime-green inner-ring */}
                      <div className="absolute inset-0 rounded-full ring-2 ring-inset ring-[#84CC16] pointer-events-none" />
                      {/* Glowing server badge inside avatar boundary */}
                      <div className="absolute bottom-0 inset-x-0 py-0.5 bg-[#061E16]/90 backdrop-blur-xs flex items-center justify-center border-t border-[#84CC16]/60 pointer-events-none">
                        <span className="text-[8px] font-black font-mono text-[#84CC16] drop-shadow-[0_0_3px_rgba(132,204,22,0.9)] leading-none">
                          #{serverNumber}
                        </span>
                      </div>
                    </>
                  )}
                </PlayerAvatar>
              </div>

              {/* Player Name & Info */}
              <div className="mt-1 text-center min-w-0 px-1 pointer-events-none">
                <span className="text-xs font-bold text-white block truncate max-w-[95px] drop-shadow-xs">
                  {playerRightA.name}
                </span>
                <span className="text-[10px] text-emerald-200/80 font-mono tabular-nums block">
                  L{playerRightA.skillRating} · Team 1
                </span>
              </div>
            </div>
          </div>

          {/* Central Non-Volley Zone (The Kitchen) & Net Line */}
          <div className="h-8 sm:h-9 bg-[#0A261D] border-y border-white/60 flex items-center justify-center relative shrink-0">
            {/* Center Net Division */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/90 z-10" />
            <div className="relative z-20 px-2 py-0.5 rounded bg-[#0A261D]/90 border border-white/20 text-[9px] sm:text-[10px] font-bold text-emerald-200/90 uppercase tracking-widest font-mono">
              Non-Volley Zone (Kitchen)
            </div>
          </div>

          {/* Bottom Half: Team 2 Service Area */}
          <div
            className={`flex-1 relative flex border-t border-white/60 transition ${
              servingTeam === 'teamB' ? 'bg-[#154E3E]' : 'bg-[#0F382C]'
            }`}
          >
            {/* Team 2 Left Court Box */}
            <div
              onClick={() => handleScorePoint('teamB')}
              className={`flex-1 border-r border-white/40 flex flex-col items-center justify-center p-2 relative cursor-pointer hover:bg-white/5 active:scale-[0.99] transition ${
                isLeftBServing ? 'bg-[#1a5b47]' : ''
              }`}
              title={`Score point for Team 2 (${playerLeftB.name})`}
            >
              {/* Player Avatar with Server Indicator strictly inside Avatar Boundary */}
              <div className="relative">
                <PlayerAvatar
                  avatar={playerLeftB.avatar}
                  name={playerLeftB.name}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow transition-all duration-200 ${
                    isLeftBServing
                      ? 'ring-2 ring-inset ring-[#84CC16] shadow-[inset_0_0_8px_rgba(132,204,22,0.6),0_0_12px_rgba(132,204,22,0.35)]'
                      : 'border border-white/40'
                  }`}
                >
                  {isLeftBServing && (
                    <>
                      {/* Subtle lime-green inner-ring */}
                      <div className="absolute inset-0 rounded-full ring-2 ring-inset ring-[#84CC16] pointer-events-none" />
                      {/* Glowing server badge inside avatar boundary */}
                      <div className="absolute bottom-0 inset-x-0 py-0.5 bg-[#061E16]/90 backdrop-blur-xs flex items-center justify-center border-t border-[#84CC16]/60 pointer-events-none">
                        <span className="text-[8px] font-black font-mono text-[#84CC16] drop-shadow-[0_0_3px_rgba(132,204,22,0.9)] leading-none">
                          #{serverNumber}
                        </span>
                      </div>
                    </>
                  )}
                </PlayerAvatar>
              </div>

              {/* Player Name & Info */}
              <div className="mt-1 text-center min-w-0 px-1 pointer-events-none">
                <span className="text-xs font-bold text-white block truncate max-w-[95px] drop-shadow-xs">
                  {playerLeftB.name}
                </span>
                <span className="text-[10px] text-emerald-200/80 font-mono tabular-nums block">
                  L{playerLeftB.skillRating} · Team 2
                </span>
              </div>
            </div>

            {/* Team 2 Right Court Box */}
            <div
              onClick={() => handleScorePoint('teamB')}
              className={`flex-1 flex flex-col items-center justify-center p-2 relative cursor-pointer hover:bg-white/5 active:scale-[0.99] transition ${
                isRightBServing ? 'bg-[#1a5b47]' : ''
              }`}
              title={`Score point for Team 2 (${playerRightB.name})`}
            >
              {/* Player Avatar with Server Indicator strictly inside Avatar Boundary */}
              <div className="relative">
                <PlayerAvatar
                  avatar={playerRightB.avatar}
                  name={playerRightB.name}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow transition-all duration-200 ${
                    isRightBServing
                      ? 'ring-2 ring-inset ring-[#84CC16] shadow-[inset_0_0_8px_rgba(132,204,22,0.6),0_0_12px_rgba(132,204,22,0.35)]'
                      : 'border border-white/40'
                  }`}
                >
                  {isRightBServing && (
                    <>
                      {/* Subtle lime-green inner-ring */}
                      <div className="absolute inset-0 rounded-full ring-2 ring-inset ring-[#84CC16] pointer-events-none" />
                      {/* Glowing server badge inside avatar boundary */}
                      <div className="absolute bottom-0 inset-x-0 py-0.5 bg-[#061E16]/90 backdrop-blur-xs flex items-center justify-center border-t border-[#84CC16]/60 pointer-events-none">
                        <span className="text-[8px] font-black font-mono text-[#84CC16] drop-shadow-[0_0_3px_rgba(132,204,22,0.9)] leading-none">
                          #{serverNumber}
                        </span>
                      </div>
                    </>
                  )}
                </PlayerAvatar>
              </div>

              {/* Player Name & Info */}
              <div className="mt-1 text-center min-w-0 px-1 pointer-events-none">
                <span className="text-xs font-bold text-white block truncate max-w-[95px] drop-shadow-xs">
                  {playerRightB.name}
                </span>
                <span className="text-[10px] text-emerald-200/80 font-mono tabular-nums block">
                  L{playerRightB.skillRating} · Team 2
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer Quick-Touch Scoring Actions */}
      <footer className="px-3 sm:px-4 py-2.5 bg-white border-t border-[#E2E8F0] shrink-0">
        <div className="max-w-md mx-auto flex items-center gap-2">
          {/* Team 1 Score Action */}
          <button
            onClick={() => handleScorePoint('teamA')}
            className={`touch-target flex-1 py-2.5 px-2 rounded-xl text-white font-bold text-xs shadow-xs transition active:scale-95 flex flex-col items-center justify-center ${
              servingTeam === 'teamA'
                ? 'bg-[#0F382C] ring-2 ring-[#84CC16]'
                : 'bg-[#185341] hover:bg-[#1e6650]'
            }`}
            aria-label={`Score point for Team 1, current score ${scoreA}`}
          >
            <span className="text-xs font-black truncate max-w-full">
              +1 Team 1 ({scoreA})
            </span>
            <span className="text-[10px] text-emerald-200/90 font-medium truncate max-w-full">
              {teamAPlayers.map((p) => p.name).join(' & ')}
            </span>
          </button>

          {/* Fault / Rotate Serve Button */}
          <button
            onClick={handleSideOut}
            className="touch-target px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 font-bold text-xs transition active:scale-95 flex flex-col items-center justify-center shrink-0 min-w-[95px]"
            title="Fault / Rotate Serve"
            aria-label="Fault / Rotate Serve"
          >
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Fault / Rotate</span>
            <span className="text-xs text-[#0F382C] font-black">
              {scoringMode === 'side_out' && serverNumber === 1 ? 'Server #2' : 'Side Out'}
            </span>
          </button>

          {/* Team 2 Score Action */}
          <button
            onClick={() => handleScorePoint('teamB')}
            className={`touch-target flex-1 py-2.5 px-2 rounded-xl text-white font-bold text-xs shadow-xs transition active:scale-95 flex flex-col items-center justify-center ${
              servingTeam === 'teamB'
                ? 'bg-[#0F382C] ring-2 ring-[#84CC16]'
                : 'bg-[#185341] hover:bg-[#1e6650]'
            }`}
            aria-label={`Score point for Team 2, current score ${scoreB}`}
          >
            <span className="text-xs font-black truncate max-w-full">
              +1 Team 2 ({scoreB})
            </span>
            <span className="text-[10px] text-emerald-200/90 font-medium truncate max-w-full">
              {teamBPlayers.map((p) => p.name).join(' & ')}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
