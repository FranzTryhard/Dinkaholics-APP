import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Player,
  Session,
  Match,
  MatchCandidate,
  RotationMode,
  SkillLevel,
  PlayerStatus,
  RotationConfig,
} from './types';
import { StorageService } from './engine/storage';
import {
  recommendMatchesForAvailableCourts,
  createMatchFromRecommendation,
} from './engine/matchmaker';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ScoreEntryModal } from './components/ScoreEntryModal';
import { CourtVisualScorekeeper } from './components/CourtVisualScorekeeper';
import { ManualMatchModal } from './components/ManualMatchModal';
import { SessionSetupModal } from './components/SessionSetupModal';
import { EndSessionModal } from './components/EndSessionModal';

import { DashboardView } from './views/DashboardView';
import { CourtsView } from './views/CourtsView';
import { PlayersView } from './views/PlayersView';
import { LeaderboardView } from './views/LeaderboardView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { RoundRobinView } from './views/RoundRobinView';
import { PickleballIcon } from './components/PickleballIcon';
import { DinkaholicsLogo } from './components/DinkaholicsLogo';
import { Layers, Play, Users, RotateCcw } from 'lucide-react';
import { INITIAL_DEMO_PLAYERS, INITIAL_DEMO_SESSION } from './engine/mockData';

export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => StorageService.getPlayers());
  const [session, setSession] = useState<Session | null>(() => StorageService.getActiveSession());
  const [matches, setMatches] = useState<Match[]>(() => StorageService.getMatches());
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Modals state
  const [activeScoreMatch, setActiveScoreMatch] = useState<Match | null>(null);
  const [customCourtNumber, setCustomCourtNumber] = useState<number | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Recommendations state: courtNumber -> MatchCandidate
  const [recommendations, setRecommendations] = useState<Record<number, MatchCandidate | null>>({});

  // Fallback active session and players to guarantee full dashboard visual presence
  const effectiveSession: Session = useMemo(() => {
    if (session && session.status === 'active') {
      return session;
    }
    return INITIAL_DEMO_SESSION;
  }, [session]);

  const effectivePlayers: Player[] = useMemo(() => {
    if (players && players.length > 0) {
      return players;
    }
    return INITIAL_DEMO_PLAYERS;
  }, [players]);

  // Fast map for lookup
  const playersById = useMemo(() => {
    return effectivePlayers.reduce<Record<string, Player>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [effectivePlayers]);

  // Recalculate match recommendations for all currently idle courts
  const recalculateRecommendations = useCallback(() => {
    const currentSession = effectiveSession;
    const currentPlayers = effectivePlayers;

    // Determine available courts (courts with NO active match)
    const availableCourtNumbers: number[] = [];
    for (let c = 1; c <= currentSession.courtCount; c++) {
      if (!currentSession.activeCourtMatches[c]) {
        availableCourtNumbers.push(c);
      }
    }

    if (availableCourtNumbers.length === 0) {
      setRecommendations({});
      return;
    }

    // Gather last completed match for each court (for Winner-Stays rotation rules)
    const previousMatchesByCourt: Record<number, Match | null> = {};
    availableCourtNumbers.forEach((courtNum) => {
      const courtMatches = matches
        .filter((m) => m.courtNumber === courtNum && m.status === 'completed')
        .sort((a, b) => (b.confirmedAt || b.startTime) - (a.confirmedAt || a.startTime));
      previousMatchesByCourt[courtNum] = courtMatches[0] || null;
    });

    const recs = recommendMatchesForAvailableCourts(
      availableCourtNumbers,
      currentPlayers,
      currentSession,
      previousMatchesByCourt,
      matches
    );

    setRecommendations(recs);
  }, [effectiveSession, effectivePlayers, matches]);

  // Recalculate whenever session, players, or matches change
  useEffect(() => {
    recalculateRecommendations();
  }, [recalculateRecommendations]);

  // Handler: Start Recommended Match
  const handleStartRecommended = (courtNumber: number, candidate: MatchCandidate) => {
    const activeSession = session && session.status === 'active' ? session : effectiveSession;
    if (!session || session.status !== 'active') {
      setSession(activeSession);
      StorageService.saveActiveSession(activeSession);
    }
    if (players.length === 0) {
      setPlayers(effectivePlayers);
      StorageService.savePlayers(effectivePlayers);
    }

    const matchNumber = matches.length + 1;
    const courtName = activeSession.courtNames?.[courtNumber] || `Court ${courtNumber}`;
    const newMatch = createMatchFromRecommendation(
      activeSession.id,
      courtNumber,
      matchNumber,
      candidate,
      courtName,
      activeSession.rotationMode
    );

    // Update participating players status to 'playing' and credit waiting duration
    const now = Date.now();
    const participantIds = new Set([...candidate.teamA, ...candidate.teamB]);
    const updatedPlayers = players.map((p) => {
      if (participantIds.has(p.id)) {
        const addedWait = p.waitingSince ? Math.max(0, now - p.waitingSince) : 0;
        return {
          ...p,
          status: 'playing' as PlayerStatus,
          waitingSince: null,
          totalWaitingTimeMs: (p.totalWaitingTimeMs || 0) + addedWait,
        };
      }
      return p;
    });

    const updatedSession: Session = {
      ...activeSession,
      activeCourtMatches: {
        ...activeSession.activeCourtMatches,
        [courtNumber]: newMatch.id,
      },
    };

    const updatedMatches = [...matches, newMatch];

    setPlayers(updatedPlayers);
    setSession(updatedSession);
    setMatches(updatedMatches);

    StorageService.savePlayers(updatedPlayers);
    StorageService.saveActiveSession(updatedSession);
    StorageService.saveMatches(updatedMatches);
  };

  // Handler: Confirm Match Result
  const handleConfirmScore = (
    matchId: string,
    scoreA: number,
    scoreB: number,
    winnerTeam: 'teamA' | 'teamB'
  ) => {
    if (!session) return;

    const result = StorageService.recordMatchResult(
      matchId,
      scoreA,
      scoreB,
      winnerTeam,
      players,
      session,
      matches
    );

    setPlayers(result.updatedPlayers);
    setSession(result.updatedSession);
    setMatches(result.updatedMatches);
    setActiveScoreMatch(null);
  };

  // Handler: Start Custom Manual Match
  const handleStartCustomMatch = (courtNumber: number, candidate: MatchCandidate) => {
    handleStartRecommended(courtNumber, candidate);
    setCustomCourtNumber(null);
  };

  // Handler: Regenerate Recommendation for a Court
  const handleRegenerateRecommendation = (courtNumber: number) => {
    recalculateRecommendations();
  };

  // Handler: Switch Rotation Mode on the fly
  const handleSwitchMode = (mode: RotationMode) => {
    const activeSession = session && session.status === 'active' ? session : effectiveSession;
    const updatedSession: Session = {
      ...activeSession,
      rotationMode: mode,
      status: 'active',
    };
    setSession(updatedSession);
    StorageService.saveActiveSession(updatedSession);
  };

  // Handler: Toggle Player Status (available, resting, etc.)
  const handleTogglePlayerStatus = (playerId: string, nextStatus: PlayerStatus) => {
    const now = Date.now();
    const sourcePlayers = players.length > 0 ? players : effectivePlayers;
    const updatedPlayers = sourcePlayers.map((p) => {
      if (p.id === playerId) {
        return {
          ...p,
          status: nextStatus,
          waitingSince: nextStatus === 'available' ? now : null,
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);
  };

  // Handler: Update Player Skill Rating
  const handleUpdatePlayerRating = (playerId: string, newRating: SkillLevel) => {
    const updatedPlayers = players.map((p) => {
      if (p.id === playerId) {
        return { ...p, skillRating: newRating };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);
  };

  // Handler: Add New Player
  const handleAddPlayer = (newPlayerData: Omit<Player, 'id'>) => {
    const newPlayer: Player = {
      ...newPlayerData,
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);
  };

  // Handler: Delete Player
  const handleDeletePlayer = (playerId: string) => {
    const updatedPlayers = players.filter((p) => p.id !== playerId);
    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);
  };

  // Handler: Update Player Details
  const handleUpdatePlayerDetails = (updatedPlayer: Player) => {
    const updatedPlayers = players.map((p) =>
      p.id === updatedPlayer.id ? updatedPlayer : p
    );
    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);
  };

  // Handler: Launch New Session
  const handleStartSession = (newSession: Session) => {
    const participantSet = new Set(newSession.participantIds);
    const updatedPlayers = players.map((p) => {
      const isPart = participantSet.has(p.id);
      return {
        ...p,
        status: isPart ? ('available' as PlayerStatus) : ('resting' as PlayerStatus),
        sessionGamesPlayed: 0,
        sessionWins: 0,
        sessionLosses: 0,
        consecutiveGames: 0,
        waitingSince: isPart ? Date.now() : null,
        totalWaitingTimeMs: 0,
        teammateHistory: {},
        opponentHistory: {},
      };
    });

    setPlayers(updatedPlayers);
    setSession(newSession);
    setIsSetupModalOpen(false);

    StorageService.savePlayers(updatedPlayers);
    StorageService.saveActiveSession(newSession);
  };

  // Handler: End Session
  const handleConfirmEndSession = () => {
    if (!session) return;
    const endedSession: Session = {
      ...session,
      status: 'completed',
      endTime: Date.now(),
      activeCourtMatches: {},
    };

    const updatedPlayers = players.map((p) => ({
      ...p,
      status: 'available' as PlayerStatus,
    }));

    setPlayers(updatedPlayers);
    setSession(endedSession);
    setIsEndSessionModalOpen(false);

    StorageService.savePlayers(updatedPlayers);
    StorageService.saveActiveSession(endedSession);
  };

  // Handler: Reset to Demo Data
  const handleResetDemo = () => {
    const { players: demoPlayers, session: demoSession, matches: demoMatches } =
      StorageService.resetToDemo();
    setPlayers(demoPlayers);
    setSession(demoSession);
    setMatches(demoMatches);
  };

  // Handler: Clear All Data
  const handleClearAll = () => {
    StorageService.clearAll();
    setPlayers([]);
    setSession(null);
    setMatches([]);
    setCurrentTab('players');
  };

  // Handler: Update Session Config
  const handleUpdateSessionConfig = (newConfig: RotationConfig) => {
    if (!session) return;
    const updatedSession: Session = {
      ...session,
      rotationConfig: newConfig,
    };
    setSession(updatedSession);
    StorageService.saveActiveSession(updatedSession);
  };

  const activeMatchesCount = matches.filter(
    (m) => m.sessionId === session?.id && m.status === 'in_progress'
  ).length;

  const waitingCount = players.filter((p) => p.status === 'available').length;

  return (
    <div className="min-h-screen bg-[#F8F9F8] text-slate-900 flex flex-col font-sans selection:bg-[#84CC16] selection:text-slate-950">
      <OfflineIndicator />

      {/* Top Navigation */}
      <Navbar
        session={effectiveSession}
        activeMatchesCount={activeMatchesCount}
        currentTab={currentTab}
        onNewSession={() => setIsSetupModalOpen(true)}
        onResetDemo={() => setIsResetConfirmOpen(true)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4">
        {currentTab === 'dashboard' && (
          <DashboardView
            session={effectiveSession}
            players={effectivePlayers}
            matches={matches}
            recommendationsByCourt={recommendations}
            onStartRecommended={handleStartRecommended}
            onEnterScore={(match) => setActiveScoreMatch(match)}
            onManualCustomMatch={(courtNum) => setCustomCourtNumber(courtNum)}
            onRegenerateRecommendation={handleRegenerateRecommendation}
            onSwitchMode={handleSwitchMode}
            onTogglePlayerStatus={handleTogglePlayerStatus}
            onEndSessionClick={() => setIsEndSessionModalOpen(true)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'courts' && (
          <CourtsView
            session={effectiveSession}
            players={effectivePlayers}
            matches={matches}
            recommendationsByCourt={recommendations}
            onStartRecommended={handleStartRecommended}
            onEnterScore={(match) => setActiveScoreMatch(match)}
            onManualCustomMatch={(courtNum) => setCustomCourtNumber(courtNum)}
            onRegenerateRecommendation={handleRegenerateRecommendation}
          />
        )}

        {currentTab === 'tournament' && (
          <RoundRobinView
            players={players}
            session={session}
            playersById={playersById}
            onNavigateToCourts={() => setCurrentTab('courts')}
          />
        )}

        {currentTab === 'players' && (
          <PlayersView
            players={players}
            matches={matches}
            session={session}
            isSessionActive={session?.status === 'active'}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayerRating={handleUpdatePlayerRating}
            onUpdatePlayerStatus={handleTogglePlayerStatus}
            onDeletePlayer={handleDeletePlayer}
            onUpdatePlayerDetails={handleUpdatePlayerDetails}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView players={players} matches={matches} session={session} />
        )}

        {currentTab === 'history' && (
          <HistoryView
            matches={matches}
            playersById={playersById}
            activeMatches={matches.filter((m) => m.status === 'in_progress')}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            session={session}
            onUpdateSessionConfig={handleUpdateSessionConfig}
            onResetDemo={handleResetDemo}
            onClearAll={handleClearAll}
          />
        )}
      </main>

      {/* Figma Elevated Bottom Navigation with Pickleball FAB */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
        waitingCount={waitingCount}
        activeMatchesCount={activeMatchesCount}
        onOpenCreateMatch={() => setCustomCourtNumber(1)}
        onOpenAddPlayer={() => setCurrentTab('players')}
      />

      {/* Modal: Interactive Court Visual Scorekeeper matching Figma */}
      {activeScoreMatch && (
        <CourtVisualScorekeeper
          match={activeScoreMatch}
          playersById={playersById}
          onClose={() => setActiveScoreMatch(null)}
          onFinishMatch={handleConfirmScore}
        />
      )}

      {/* Modal: Custom Manual Matchmaker matching Figma Add Players screen */}
      {customCourtNumber !== null && session && (
        <ManualMatchModal
          courtNumber={customCourtNumber}
          courtName={session.courtNames?.[customCourtNumber] || `Court ${customCourtNumber}`}
          availablePlayers={players.filter((p) => p.status === 'available')}
          onClose={() => setCustomCourtNumber(null)}
          onStartCustomMatch={handleStartCustomMatch}
        />
      )}

      {/* Modal: New Session Setup */}
      {isSetupModalOpen && (
        <SessionSetupModal
          players={players}
          onClose={() => setIsSetupModalOpen(false)}
          onStartSession={handleStartSession}
          onNavigateToPlayers={() => {
            setIsSetupModalOpen(false);
            setCurrentTab('players');
          }}
        />
      )}

      {/* Modal: End Session Recap */}
      {isEndSessionModalOpen && session && (
        <EndSessionModal
          session={session}
          matches={matches}
          players={players}
          onClose={() => setIsEndSessionModalOpen(false)}
          onConfirmEnd={handleConfirmEndSession}
        />
      )}

      {/* Modal: Confirm Reset Demo Data */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 font-display">Reset to Demo Data?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              This will restore the clean 10-player demo roster and sample courts. Current active matches and unexported game logs will be replaced.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="touch-target py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition active:scale-95"
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={() => {
                  handleResetDemo();
                  setIsResetConfirmOpen(false);
                }}
                className="touch-target py-2.5 px-3 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition active:scale-95 shadow-sm"
              >
                Reset to Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
