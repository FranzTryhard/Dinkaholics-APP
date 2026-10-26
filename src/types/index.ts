export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  1: 'Beginner (DUPR 2.0–2.5)',
  2: 'Novice (DUPR 3.0)',
  3: 'Intermediate (DUPR 3.5)',
  4: 'Advanced (DUPR 4.0)',
  5: 'Expert (DUPR 4.5+)',
};

export const SKILL_LEVEL_SHORT_LABELS: Record<SkillLevel, string> = {
  1: 'Beginner',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export const SKILL_LEVEL_DUPR: Record<SkillLevel, string> = {
  1: 'DUPR 2.0–2.5',
  2: 'DUPR 3.0',
  3: 'DUPR 3.5',
  4: 'DUPR 4.0',
  5: 'DUPR 4.5+',
};

export const SKILL_LEVEL_COLORS: Record<SkillLevel, { bg: string; text: string; border: string; badge: string }> = {
  1: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', badge: 'bg-emerald-500' },
  2: { bg: 'bg-teal-500/10', text: 'text-teal-300', border: 'border-teal-500/30', badge: 'bg-teal-500' },
  3: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', badge: 'bg-blue-500' },
  4: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', badge: 'bg-amber-500' },
  5: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', badge: 'bg-rose-500' },
};

export const DEFAULT_PLAYER_AVATAR = '/assets/aistudio/image_c18b30c1.png';

export type PlayerStatus = 'available' | 'playing' | 'resting' | 'finished';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  skillRating: SkillLevel;
  performanceRating?: number; // conservative estimated rating based on games
  
  // Lifetime stats
  totalGamesPlayed: number;
  wins: number;
  losses: number;
  streak: number; // >0 win streak, <0 loss streak, 0 none

  // Current session stats
  status: PlayerStatus;
  sessionGamesPlayed: number;
  sessionWins: number;
  sessionLosses: number;
  consecutiveGames: number;
  lastMatchTime: number | null;
  waitingSince: number | null; // epoch timestamp
  totalWaitingTimeMs: number;

  // History tracking within current session
  teammateHistory: Record<string, number>; // playerId -> count
  opponentHistory: Record<string, number>; // playerId -> count

  isDemo?: boolean;
}

export type RotationMode = 'balanced' | 'winner_stays' | 'social' | 'king_of_court';

export interface RotationConfig {
  winnerStaysRule: 'stay_together' | 'split_partners';
  maxConsecutiveGames: number; // default 2 or 3
  balanceTolerance: number; // maximum rating diff before forcing rebalance
  enforceFairRest: boolean;
  priorityForLongestWait: boolean;
}

export type SessionStatus = 'setup' | 'active' | 'paused' | 'completed';

export interface Session {
  id: string;
  name: string;
  courtCount: number;
  courtNames?: Record<number, string>;
  rotationMode: RotationMode;
  rotationConfig: RotationConfig;
  status: SessionStatus;
  startTime: number | null;
  endTime: number | null;
  participantIds: string[];
  activeCourtMatches: Record<number, string | null>; // courtNumber (1-based) -> matchId
}

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed';

export interface Match {
  id: string;
  sessionId: string;
  matchNumber: number;
  courtNumber: number;
  courtName?: string;
  teamA: [string, string];
  teamB: [string, string];
  scoreA: number | null;
  scoreB: number | null;
  winnerTeam: 'teamA' | 'teamB' | null;
  status: MatchStatus;
  startTime: number;
  endTime: number | null;
  durationSeconds?: number;
  explanation: string;
  rotationModeUsed: RotationMode;
  confirmedAt?: number;
}

export interface MatchCandidate {
  courtNumber: number;
  teamA: [string, string];
  teamB: [string, string];
  teamARating: number;
  teamBRating: number;
  ratingDiff: number;
  balanceScore: number;
  fairnessScore: number;
  varietyScore: number;
  overallScore: number;
  explanation: string;
  winnersFromPrevious?: [string, string];
  ruleTags: string[];
}

export interface MatchmakingWeights {
  balanceWeight: number; // Team rating parity weight
  waitingTimeWeight: number; // Priority for players who waited long
  fewestGamesWeight: number; // Priority for players with fewer games
  varietyTeammateWeight: number; // Penalty for recently repeated partner
  varietyOpponentWeight: number; // Penalty for recently repeated opponent
  spreadDisparityWeight: number; // Penalty for unbalanced pairs (e.g. 5+1 vs 3+3)
}

export interface SessionSummary {
  sessionId: string;
  sessionName: string;
  durationMinutes: number;
  totalMatches: number;
  totalPlayers: number;
  topStreaks: { player: Player; streak: number }[];
  mostMatchesPlayed: { player: Player; count: number }[];
  mostBalancedMatch: Match | null;
}
