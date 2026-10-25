import {
  Player,
  Session,
  Match,
  MatchCandidate,
  RotationMode,
  SessionSummary,
} from '../types';
import { INITIAL_DEMO_PLAYERS, INITIAL_DEMO_SESSION, INITIAL_DEMO_MATCHES } from './mockData';

const PLAYERS_KEY = 'picklematch_players_v1';
const ACTIVE_SESSION_KEY = 'picklematch_active_session_v1';
const MATCHES_KEY = 'picklematch_matches_v1';
const SESSIONS_HISTORY_KEY = 'picklematch_sessions_history_v1';

const memoryStore = new Map<string, string>();

function safeGet(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return memoryStore.get(key) || null;
}

function safeSet(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  } else {
    memoryStore.set(key, value);
  }
}

function safeRemove(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(key);
  } else {
    memoryStore.delete(key);
  }
}

export class StorageService {
  /**
   * Load all saved players. If none exist, initializes with default demo players.
   */
  static getPlayers(): Player[] {
    try {
      const data = safeGet(PLAYERS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Filter out any predefined demo players
          const nonDemo = parsed.filter(
            (p: Player) => !p.isDemo && !p.id.match(/^p([1-9]|10)$/)
          );
          if (nonDemo.length !== parsed.length) {
            this.savePlayers(nonDemo);
          }
          return nonDemo;
        }
      }
    } catch (e) {
      console.error('Failed to read players from storage', e);
    }
    this.savePlayers([]);
    return [];
  }

  static savePlayers(players: Player[]): void {
    try {
      safeSet(PLAYERS_KEY, JSON.stringify(players));
    } catch (e) {
      console.error('Failed to save players to storage', e);
    }
  }

  /**
   * Load active session.
   */
  static getActiveSession(): Session | null {
    try {
      const data = safeGet(ACTIVE_SESSION_KEY);
      if (data) {
        const parsed: Session = JSON.parse(data);
        // Clear old demo session if present
        if (parsed.id === 'session_demo_1' || (parsed.participantIds && parsed.participantIds.some(id => id.match(/^p([1-9]|10)$/)))) {
          safeRemove(ACTIVE_SESSION_KEY);
          return null;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to read active session', e);
    }
    return null;
  }

  static saveActiveSession(session: Session | null): void {
    try {
      if (session) {
        safeSet(ACTIVE_SESSION_KEY, JSON.stringify(session));
      } else {
        safeRemove(ACTIVE_SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to save active session', e);
    }
  }

  /**
   * Load all matches.
   */
  static getMatches(): Match[] {
    try {
      const data = safeGet(MATCHES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Remove old demo matches
          const nonDemo = parsed.filter((m: Match) => !m.id.startsWith('demo_match_'));
          if (nonDemo.length !== parsed.length) {
            this.saveMatches(nonDemo);
          }
          return nonDemo;
        }
      }
    } catch (e) {
      console.error('Failed to read matches', e);
    }
    return [];
  }

  static saveMatches(matches: Match[]): void {
    try {
      safeSet(MATCHES_KEY, JSON.stringify(matches));
    } catch (e) {
      console.error('Failed to save matches', e);
    }
  }

  /**
   * Resets data to clean empty state.
   */
  static resetToDemo(): { players: Player[]; session: Session | null; matches: Match[] } {
    safeRemove(PLAYERS_KEY);
    safeRemove(ACTIVE_SESSION_KEY);
    safeRemove(MATCHES_KEY);
    return { players: [], session: null, matches: [] };
  }

  /**
   * Completely clear players and start fresh with empty state.
   */
  static clearAll(): void {
    safeRemove(PLAYERS_KEY);
    safeRemove(ACTIVE_SESSION_KEY);
    safeRemove(MATCHES_KEY);
  }

  /**
   * Record a match result idempotently and update all player statistics.
   * Guarantees duplicate submissions do not double count wins/losses.
   */
  static recordMatchResult(
    matchId: string,
    scoreA: number,
    scoreB: number,
    winnerTeam: 'teamA' | 'teamB',
    players: Player[],
    session: Session,
    matches: Match[]
  ): {
    updatedPlayers: Player[];
    updatedSession: Session;
    updatedMatches: Match[];
    completedMatch: Match;
  } {
    const existingMatch = matches.find((m) => m.id === matchId);
    if (!existingMatch) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Authoritative persistence check: inspect stored matches to prevent race conditions
    const storedMatches = this.getMatches();
    const storedMatch = storedMatches.find((m) => m.id === matchId);
    if (storedMatch && storedMatch.status === 'completed' && storedMatch.confirmedAt) {
      return {
        updatedPlayers: players,
        updatedSession: session,
        updatedMatches: storedMatches,
        completedMatch: storedMatch,
      };
    }

    // In-memory idempotency check
    if (existingMatch.status === 'completed' && existingMatch.confirmedAt) {
      return {
        updatedPlayers: players,
        updatedSession: session,
        updatedMatches: matches,
        completedMatch: existingMatch,
      };
    }

    const now = Date.now();
    const durationSeconds = Math.max(1, Math.round((now - existingMatch.startTime) / 1000));

    const completedMatch: Match = {
      ...existingMatch,
      scoreA,
      scoreB,
      winnerTeam,
      status: 'completed',
      endTime: now,
      durationSeconds,
      confirmedAt: now,
    };

    const teamAPlayerIds = new Set(existingMatch.teamA);
    const teamBPlayerIds = new Set(existingMatch.teamB);
    const allMatchPlayerIds = new Set([...existingMatch.teamA, ...existingMatch.teamB]);

    const isTeamAWinner = winnerTeam === 'teamA';

    // Update each participating player
    const updatedPlayers = players.map((p) => {
      if (!allMatchPlayerIds.has(p.id)) {
        return p;
      }

      const isTeamA = teamAPlayerIds.has(p.id);
      const isWinner = (isTeamA && isTeamAWinner) || (!isTeamA && !isTeamAWinner);

      // Identify partner & opponents
      const partnerId = isTeamA
        ? existingMatch.teamA.find((id) => id !== p.id)!
        : existingMatch.teamB.find((id) => id !== p.id)!;
      const opponentIds = isTeamA ? existingMatch.teamB : existingMatch.teamA;

      const newTeammateHistory = { ...(p.teammateHistory || {}) };
      newTeammateHistory[partnerId] = (newTeammateHistory[partnerId] || 0) + 1;

      const newOpponentHistory = { ...(p.opponentHistory || {}) };
      opponentIds.forEach((oppId) => {
        newOpponentHistory[oppId] = (newOpponentHistory[oppId] || 0) + 1;
      });

      // Update streak
      let newStreak = p.streak;
      if (isWinner) {
        newStreak = newStreak > 0 ? newStreak + 1 : 1;
      } else {
        newStreak = newStreak < 0 ? newStreak - 1 : -1;
      }

      // Consecutive games calculation:
      // If winner, increment consecutive games. If loser, consecutive games resets to 0.
      let nextConsecutive = isWinner ? p.consecutiveGames + 1 : 0;
      let nextStatus: Player['status'] = 'available';

      return {
        ...p,
        totalGamesPlayed: p.totalGamesPlayed + 1,
        wins: isWinner ? p.wins + 1 : p.wins,
        losses: isWinner ? p.losses : p.losses + 1,
        streak: newStreak,
        sessionGamesPlayed: p.sessionGamesPlayed + 1,
        sessionWins: isWinner ? p.sessionWins + 1 : p.sessionWins,
        sessionLosses: isWinner ? p.sessionLosses : p.sessionLosses + 1,
        consecutiveGames: nextConsecutive,
        lastMatchTime: now,
        waitingSince: now,
        status: nextStatus,
        teammateHistory: newTeammateHistory,
        opponentHistory: newOpponentHistory,
      };
    });

    // Update court state in session: clear court active match
    const newActiveMatches = { ...session.activeCourtMatches };
    newActiveMatches[existingMatch.courtNumber] = null;

    const updatedSession: Session = {
      ...session,
      activeCourtMatches: newActiveMatches,
    };

    // Update matches array
    const updatedMatches = matches.map((m) => (m.id === matchId ? completedMatch : m));

    this.savePlayers(updatedPlayers);
    this.saveActiveSession(updatedSession);
    this.saveMatches(updatedMatches);

    return {
      updatedPlayers,
      updatedSession,
      updatedMatches,
      completedMatch,
    };
  }

  /**
   * Get user preference for full-screen celebration duration (2000ms or 3000ms)
   * Default: 2000ms (2.0s)
   */
  static getAnimationDuration(): number {
    const val = safeGet('picklematch_anim_duration');
    if (val === '3000' || val === '3') return 3000;
    return 2000;
  }

  /**
   * Set user preference for full-screen celebration duration
   */
  static setAnimationDuration(durationMs: number): void {
    safeSet('picklematch_anim_duration', String(durationMs));
  }
}

