import { MatchmakingWeights, RotationMode, RotationConfig } from '../types';

export const DEFAULT_PLAYER_AVATAR = '/assets/images/dinkaholics_logo.jpg';

export const DEFAULT_ROTATION_CONFIG: RotationConfig = {
  winnerStaysRule: 'stay_together',
  maxConsecutiveGames: 2,
  balanceTolerance: 2.0, // if rating difference exceeds 2.0, encourage partner split or rebalance
  enforceFairRest: true,
  priorityForLongestWait: true,
};

export const WEIGHTS_BY_MODE: Record<RotationMode, MatchmakingWeights> = {
  balanced: {
    balanceWeight: 3.5,
    waitingTimeWeight: 2.5,
    fewestGamesWeight: 2.0,
    varietyTeammateWeight: 1.8,
    varietyOpponentWeight: 1.2,
    spreadDisparityWeight: 1.0,
  },
  winner_stays: {
    balanceWeight: 2.2,
    waitingTimeWeight: 2.8,
    fewestGamesWeight: 1.8,
    varietyTeammateWeight: 1.0,
    varietyOpponentWeight: 1.0,
    spreadDisparityWeight: 0.8,
  },
  social: {
    balanceWeight: 1.5,
    waitingTimeWeight: 2.2,
    fewestGamesWeight: 2.2,
    varietyTeammateWeight: 3.5, // prioritize fresh partnerships
    varietyOpponentWeight: 2.5, // prioritize new opponents
    spreadDisparityWeight: 0.5,
  },
  king_of_court: {
    balanceWeight: 2.5,
    waitingTimeWeight: 2.5,
    fewestGamesWeight: 2.0,
    varietyTeammateWeight: 1.8,
    varietyOpponentWeight: 1.5,
    spreadDisparityWeight: 0.8,
  },
};
