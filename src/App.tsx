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

  // Recommendations state: courtNumber -> MatchCandidate
  const [recommendations, setRecommendations] = useState<Record<number, MatchCandidate | null>>({});

  // Fast map for lookup
  const playersById = useMemo(() => {
    return players.reduce<Record<string, Player>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [players]);

  // Recalculate match recommendations for all currently idle courts
  const recalculateRecommendations = useCallback(() => {
    if (!session || session.status !== 'active') {
      setRecommendations({});
      return;
    }

    // Determine available courts (courts with NO active match)
    const availableCourtNumbers: number[] = [];
    for (let c = 1; c <= session.courtCount; c++) {
      if (!session.activeCourtMatches[c]) {
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
      players,
      session,
      previousMatchesByCourt,
      matches
    );

    setRecommendations(recs);
  }, [session, players, matches]);

  // Recalculate whenever session, players, or matches change
  useEffect(() => {
    recalculateRecommendations();
  }, [recalculateRecommendations]);

  // Handler: Start Recommended Match
  const handleStartRecommended = (courtNumber: number, candidate: MatchCandidate) => {
    if (!session) return;

    const matchNumber = matches.length + 1;
    const courtName = session.courtNames?.[courtNumber] || `Court ${courtNumber}`;
    const newMatch = createMatchFromRecommendation(
      session.id,
      courtNumber,
      matchNumber,
      candidate,
      courtName,
      session.rotationMode
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
      ...session,
      activeCourtMatches: {
        ...session.activeCourtMatches,
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
    if (!session) return;
    const updatedSession: Session = {
      ...session,
      rotationMode: mode,
    };
    setSession(updatedSession);
    StorageService.saveActiveSession(updatedSession);
  };

  // Handler: Toggle Player Status (available, resting, etc.)
  const handleTogglePlayerStatus = (playerId: string, nextStatus: PlayerStatus) => {
    const now = Date.now();
    const updatedPlayers = players.map((p) => {
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
        session={session}
        activeMatchesCount={activeMatchesCount}
        currentTab={currentTab}
        onNewSession={() => setIsSetupModalOpen(true)}
        onResetDemo={handleResetDemo}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4">
        {session && session.status === 'active' ? (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                session={session}
                players={players}
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
                session={session}
                players={players}
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
          </>
        ) : (
          /* Empty or Concluded Session State */
          <div className="py-16 text-center max-w-md mx-auto space-y-5 px-4">
            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl mx-auto border-2 border-emerald-800/40 bg-[#0F382C]">
              <img
                src="/src/assets/images/dinkaholics_reclub_style_1792884764544.jpg"
                alt="Dinkaholics DH Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-100 text-lime-900 text-xs font-black mb-2">
                <span>DINKAHOLICS CLUB</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-display">No Active Session</h2>
              <p className="text-xs text-slate-500 mt-1">
                Start a session to begin automated fair matchmaking across your courts. No login required!
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setIsSetupModalOpen(true)}
                className="w-full py-3 rounded-2xl bg-[#0F382C] text-white font-bold text-sm hover:bg-[#154b3c] transition active:scale-95 shadow-md font-display"
              >
                Create New Session
              </button>
              <button
                onClick={() => setCurrentTab('players')}
                className="w-full py-2.5 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Manage & Add Players</span>
              </button>
            </div>
          </div>
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
    </div>
  );
}
