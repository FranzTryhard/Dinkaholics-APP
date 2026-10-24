import {
  calculateBalanceScore,
  calculateFairnessScore,
  calculateVarietyScore,
  recommendMatchForCourt,
  recommendMatchesForAvailableCourts,
  createMatchFromRecommendation,
} from '../matchmaker';
import { Player, Session } from '../../types';
import { DEFAULT_ROTATION_CONFIG } from '../config';
import { StorageService } from '../storage';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

function makePlayer(
  id: string,
  name: string,
  rating: 1 | 2 | 3 | 4 | 5,
  options: Partial<Player> = {}
): Player {
  return {
    id,
    name,
    skillRating: rating,
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
    waitingSince: Date.now() - 5000,
    totalWaitingTimeMs: 5000,
    teammateHistory: {},
    opponentHistory: {},
    ...options,
  };
}

function makeSession(mode: 'balanced' | 'winner_stays' | 'social', courts: number = 2): Session {
  return {
    id: 'test_session',
    name: 'Test Session',
    courtCount: courts,
    rotationMode: mode,
    rotationConfig: { ...DEFAULT_ROTATION_CONFIG },
    status: 'active',
    startTime: Date.now(),
    endTime: null,
    participantIds: [],
    activeCourtMatches: {},
  };
}

console.log('--- RUNNING MATCHMAKER ENGINE UNIT TESTS ---');

// Test 1: Balance Score Calculation
{
  const p1 = makePlayer('1', 'P1', 5);
  const p2 = makePlayer('2', 'P2', 2);
  const p3 = makePlayer('3', 'P3', 4);
  const p4 = makePlayer('4', 'P4', 3);

  const balance = calculateBalanceScore([p1, p2], [p3, p4]);
  assert(balance.ratingA === 7 && balance.ratingB === 7, 'Team A and Team B both have sum rating of 7');
  assert(balance.ratingDiff === 0, 'Rating difference is exactly 0 for 5+2 vs 4+3');
  assert(balance.score > 8, 'Balance score is high (>8) for equal combined ratings');
}

// Test 2: Exactly 4 players produce a valid match
{
  const players = [
    makePlayer('1', 'P1', 1),
    makePlayer('2', 'P2', 2),
    makePlayer('3', 'P3', 3),
    makePlayer('4', 'P4', 4),
  ];
  const session = makeSession('balanced', 1);
  const recommendation = recommendMatchForCourt(1, players, session);

  assert(recommendation !== null, '4 players always produce a valid recommendation');
  if (recommendation) {
    const allAssigned = [...recommendation.teamA, ...recommendation.teamB];
    assert(new Set(allAssigned).size === 4, 'All 4 distinct players assigned');
    assert(recommendation.explanation.length > 5, 'Explanation is generated');
  }
}

// Test 3: Less than 4 players produces null
{
  const players = [
    makePlayer('1', 'P1', 3),
    makePlayer('2', 'P2', 3),
    makePlayer('3', 'P3', 3),
  ];
  const session = makeSession('balanced', 1);
  const recommendation = recommendMatchForCourt(1, players, session);
  assert(recommendation === null, 'Fewer than 4 players safely returns null');
}

// Test 4: 8 players across 2 courts produces non-overlapping matches
{
  const players = Array.from({ length: 8 }, (_, i) =>
    makePlayer(`p${i + 1}`, `Player ${i + 1}`, ((i % 5) + 1) as any, {
      waitingSince: Date.now() - (i + 1) * 60000,
    })
  );
  const session = makeSession('balanced', 2);
  const recs = recommendMatchesForAvailableCourts([1, 2], players, session);

  assert(recs[1] !== null && recs[2] !== null, 'Both courts received recommendations');
  if (recs[1] && recs[2]) {
    const court1Players = new Set([...recs[1].teamA, ...recs[1].teamB]);
    const court2Players = new Set([...recs[2].teamA, ...recs[2].teamB]);
    const overlap = [...court1Players].filter((id) => court2Players.has(id));
    assert(overlap.length === 0, 'Zero player overlap between Court 1 and Court 2 (no double-assignment)');
  }
}

// Test 5: 9 players rotation fairness
{
  // 9 players: 8 play, 1 waits. The longest waiting players should be chosen first.
  const players = Array.from({ length: 9 }, (_, i) =>
    makePlayer(`p${i + 1}`, `Player ${i + 1}`, 3, {
      waitingSince: Date.now() - (i === 8 ? 1000 : (i + 1) * 60000), // Player 9 arrived just now, others waited longer
    })
  );
  const session = makeSession('balanced', 2);
  const recs = recommendMatchesForAvailableCourts([1, 2], players, session);

  const scheduled = new Set([
    ...(recs[1] ? [...recs[1].teamA, ...recs[1].teamB] : []),
    ...(recs[2] ? [...recs[2].teamA, ...recs[2].teamB] : []),
  ]);
  assert(scheduled.size === 8, '8 players scheduled across 2 courts');
  assert(!scheduled.has('p9'), 'Player with shortest wait (p9) waits in queue fairly');
}

// Test 6: Variety penalizes recent teammates
{
  const pA1 = makePlayer('1', 'Alice', 3, { teammateHistory: { '2': 3 } }); // Alice partnered with Bob 3 times
  const pA2 = makePlayer('2', 'Bob', 3, { teammateHistory: { '1': 3 } });
  const pB1 = makePlayer('3', 'Charlie', 3, { teammateHistory: {} });
  const pB2 = makePlayer('4', 'Diana', 3, { teammateHistory: {} });

  const scoreRepeated = calculateVarietyScore([pA1, pA2], [pB1, pB2]);
  const scoreFresh = calculateVarietyScore([pA1, pB1], [pA2, pB2]);
  assert(scoreFresh > scoreRepeated, 'Fresh partnership has significantly higher variety score than 3x repeated');
}

// Test 7: Winner-Stays mode and consecutive games limit
{
  const w1 = makePlayer('w1', 'Winner 1', 4, { consecutiveGames: 2 }); // hit max limit of 2
  const w2 = makePlayer('w2', 'Winner 2', 4, { consecutiveGames: 2 });
  const c1 = makePlayer('c1', 'Challenger 1', 4);
  const c2 = makePlayer('c2', 'Challenger 2', 4);
  const c3 = makePlayer('c3', 'Challenger 3', 4);
  const c4 = makePlayer('c4', 'Challenger 4', 4);

  const prevMatch = {
    id: 'm_prev',
    sessionId: 'test_session',
    matchNumber: 1,
    courtNumber: 1,
    teamA: ['w1', 'w2'] as [string, string],
    teamB: ['l1', 'l2'] as [string, string],
    scoreA: 11,
    scoreB: 8,
    winnerTeam: 'teamA' as const,
    status: 'completed' as const,
    startTime: Date.now() - 900000,
    endTime: Date.now(),
    explanation: 'Test prev',
    rotationModeUsed: 'winner_stays' as const,
  };

  const session = makeSession('winner_stays', 1);
  const rec = recommendMatchForCourt(1, [w1, w2, c1, c2, c3, c4], session, prevMatch);
  assert(rec !== null, 'Recommendation generated for winner stays court');
  assert(
    rec?.ruleTags.includes('consecutive_games_limit_reached') || !rec?.winnersFromPrevious,
    'Consecutive game limit respected: rotated winners off after 2 consecutive games'
  );
}

// Test 8: Idempotent match recording in storage
{
  const p1 = makePlayer('t1', 'Tom', 3);
  const p2 = makePlayer('t2', 'Jerry', 3);
  const p3 = makePlayer('t3', 'Spike', 3);
  const p4 = makePlayer('t4', 'Tyke', 3);
  const session = makeSession('balanced', 1);
  const match = {
    id: 'test_match_idempotent',
    sessionId: session.id,
    matchNumber: 1,
    courtNumber: 1,
    teamA: ['t1', 't2'] as [string, string],
    teamB: ['t3', 't4'] as [string, string],
    scoreA: null,
    scoreB: null,
    winnerTeam: null,
    status: 'in_progress' as const,
    startTime: Date.now(),
    endTime: null,
    explanation: 'Test',
    rotationModeUsed: 'balanced' as const,
  };

  const initialPlayers = [p1, p2, p3, p4];
  const initialMatches = [match];

  // First record
  const result1 = StorageService.recordMatchResult(
    match.id,
    11,
    9,
    'teamA',
    initialPlayers,
    session,
    initialMatches
  );

  const tomAfterFirst = result1.updatedPlayers.find((p) => p.id === 't1')!;
  assert(tomAfterFirst.wins === 1, 'Tom got 1 win on first submission');

  // Second duplicate submission
  const result2 = StorageService.recordMatchResult(
    match.id,
    11,
    9,
    'teamA',
    result1.updatedPlayers,
    result1.updatedSession,
    result1.updatedMatches
  );
  const tomAfterSecond = result2.updatedPlayers.find((p) => p.id === 't1')!;
  assert(tomAfterSecond.wins === 1, 'Tom still has exactly 1 win on duplicate submission (Idempotency verified)');
}

console.log('🎉 ALL ENGINE AND ROTATION TESTS PASSED CLEANLY!');
