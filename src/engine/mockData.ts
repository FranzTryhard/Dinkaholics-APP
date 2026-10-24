import { Player, Session, Match } from '../types';
import { DEFAULT_ROTATION_CONFIG } from './config';

// All predefined players cleared per user request. Fresh roster ready for custom player entry.
export const INITIAL_DEMO_PLAYERS: Player[] = [];

export const INITIAL_DEMO_MATCHES: Match[] = [];

export const INITIAL_DEMO_SESSION: Session = {
  id: 'session_fresh_1',
  name: 'Dinkaholics Open Play',
  courtCount: 2,
  courtNames: {
    1: 'Championship Court',
    2: 'West Garden Court',
  },
  rotationMode: 'balanced',
  rotationConfig: {
    ...DEFAULT_ROTATION_CONFIG,
    winnerStaysRule: 'stay_together',
    maxConsecutiveGames: 2,
  },
  status: 'setup',
  startTime: null,
  endTime: null,
  participantIds: [],
  activeCourtMatches: {
    1: null,
    2: null,
  },
};
