import {
  Player,
  Session,
  Match,
  MatchCandidate,
  RotationMode,
  SkillLevel,
} from '../../types';
import {
  calculateBalanceScore,
  calculateFairnessScore,
  calculateVarietyScore,
  prioritizeEligiblePlayers,
  recommendMatchForCourt,
  recommendMatchesForAvailableCourts,
  createMatchFromRecommendation,
  getEffectiveWaitMs,
} from '../matchmaker';
import { StorageService } from '../storage';
import { DEFAULT_ROTATION_CONFIG } from '../config';

function createMockPlayer(
  id: string,
  name: string,
  skillRating: SkillLevel,
  options: Partial<Player> = {}
): Player {
  return {
    id,
    name,
    skillRating,
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
    waitingSince: Date.now() - 100000,
    totalWaitingTimeMs: 0,
    teammateHistory: {},
    opponentHistory: {},
    ...options,
  };
}

function createMockSession(mode: RotationMode = 'balanced', courtCount: number = 2): Session {
  return {
    id: 'test_session_1',
    name: 'Audit Test Session',
    courtCount,
    courtNames: { 1: 'Court 1', 2: 'Court 2' },
    rotationMode: mode,
    rotationConfig: { ...DEFAULT_ROTATION_CONFIG, maxConsecutiveGames: 2 },
    status: 'active',
    startTime: Date.now() - 3600000,
    endTime: null,
    participantIds: [],
    activeCourtMatches: { 1: null, 2: null },
  };
}

interface TestResult {
  scenario: string;
  passed: boolean;
  details: string;
  data?: any;
}

const testResults: TestResult[] = [];

console.log('====================================================');
console.log('STARTING PICKLEMATCH VERIFICATION & AUDIT TEST SUITE');
console.log('====================================================\n');

// ----------------------------------------------------
// SCENARIO 1: All players having the same rating
// ----------------------------------------------------
try {
  const players = [
    createMockPlayer('p1', 'Alice', 3),
    createMockPlayer('p2', 'Bob', 3),
    createMockPlayer('p3', 'Charlie', 3),
    createMockPlayer('p4', 'Diana', 3),
  ];
  const session = createMockSession('balanced');
  const candidate = recommendMatchForCourt(1, players, session);

  const passed =
    candidate !== null &&
    candidate.ratingDiff === 0 &&
    candidate.teamARating === 6 &&
    candidate.teamBRating === 6 &&
    candidate.balanceScore === 10;

  testResults.push({
    scenario: 'Scenario 1: All players having the same rating (all Level 3)',
    passed,
    details: passed
      ? `Produced perfectly balanced match (6 vs 6, diff: ${candidate?.ratingDiff}, balanceScore: ${candidate?.balanceScore})`
      : `Failed to produce 0 rating diff: got diff ${candidate?.ratingDiff}`,
    data: candidate,
  });
} catch (e: any) {
  testResults.push({
    scenario: 'Scenario 1: All players having the same rating',
    passed: false,
    details: `Error thrown: ${e.message}`,
  });
}

// ----------------------------------------------------
// SCENARIO 2: Mixture of beginner and advanced players
// ----------------------------------------------------
try {
  const players = [
    createMockPlayer('p1', 'Pro 1', 5),
    createMockPlayer('p2', 'Pro 2', 5),
    createMockPlayer('p3', 'Beginner 1', 1),
    createMockPlayer('p4', 'Beginner 2', 1),
  ];
  const session = createMockSession('balanced');
  const candidate = recommendMatchForCourt(1, players, session);

  // Ideal pairing is (Pro 1 + Beginner 1 or 2) vs (Pro 2 + Beginner 2 or 1) -> 6 vs 6.
  // Unbalanced pairing would be (Pro 1 + Pro 2 = 10) vs (Beginner 1 + Beginner 2 = 2) -> diff 8.
  const passed =
    candidate !== null &&
    candidate.ratingDiff === 0 &&
    candidate.teamARating === 6 &&
    candidate.teamBRating === 6;

  testResults.push({
    scenario: 'Scenario 2: Mixture of beginner (1) and advanced (5) players',
    passed,
    details: passed
      ? `Correctly paired (5+1 vs 5+1), rating diff: 0, balanceScore: ${candidate?.balanceScore}`
      : `Failed to pair 5+1 vs 5+1: teamARating=${candidate?.teamARating}, teamBRating=${candidate?.teamBRating}, diff=${candidate?.ratingDiff}`,
    data: candidate,
  });
} catch (e: any) {
  testResults.push({
    scenario: 'Scenario 2: Mixture of beginner and advanced players',
    passed: false,
    details: `Error thrown: ${e.message}`,
  });
}

// ----------------------------------------------------
// SCENARIO 3: An odd number of available players (e.g. 5 players)
// ----------------------------------------------------
try {
  const players = [
    createMockPlayer('p1', 'Player 1', 3, { waitingSince: Date.now() - 50000 }),
    createMockPlayer('p2', 'Player 2', 3, { waitingSince: Date.now() - 40000 }),
    createMockPlayer('p3', 'Player 3', 3, { waitingSince: Date.now() - 30000 }),
    createMockPlayer('p4', 'Player 4', 3, { waitingSince: Date.now() - 20000 }),
    createMockPlayer('p5', 'Player 5', 3, { waitingSince: Date.now() - 10000 }), // shortest wait
  ];
  const session = createMockSession('balanced');
  const candidate = recommendMatchForCourt(1, players, session);

  const selectedIds = new Set([...(candidate?.teamA || []), ...(candidate?.teamB || [])]);
  const hasFourDistinct = selectedIds.size === 4;
  const leavesOneOut = players.length - selectedIds.size === 1;

  // The 4 selected should include the ones who waited longest (p1, p2, p3, p4)
  const passed = candidate !== null && hasFourDistinct && leavesOneOut;

  testResults.push({
    scenario: 'Scenario 3: Odd number of available players (5 players)',
    passed,
    details: passed
      ? `Selected exactly 4 distinct players, left 1 waiting player: excluded=${players.find((p) => !selectedIds.has(p.id))?.name}`
      : `Failed odd count: candidate=${JSON.stringify(candidate)}`,
  });
} catch (e: any) {
  testResults.push({
    scenario: 'Scenario 3: Odd number of available players',
    passed: false,
    details: `Error thrown: ${e.message}`,
  });
}

// ----------------------------------------------------
// SCENARIO 4: Too few players to create a valid match (< 4 players)
// ----------------------------------------------------
try {
  const players3 = [
    createMockPlayer('p1', 'Player 1', 3),
    createMockPlayer('p2', 'Player 2', 3),
    createMockPlayer('p3', 'Player 3', 3),
  ];
  const session = createMockSession('balanced');
  const candidate3 = recommendMatchForCourt(1, players3, session);
  const candidate0 = recommendMatchForCourt(1, [], session);

  const passed = candidate3 === null && candidate0 === null;

  testResults.push({
    scenario: 'Scenario 4: Too few players to create a valid match (0 and 3 players)',
    passed,
    details: passed
      ? `Both returned null safely without crashing`
      : `Failed: expected null, got candidate3=${candidate3}, candidate0=${candidate0}`,
  });
} catch (e: any) {
  testResults.push({
    scenario: 'Scenario 4: Too few players to create a valid match',
    passed: false,
    details: `Error thrown: ${e.message}`,
  });
}

// ----------------------------------------------------
// SCENARIO 5: A player being unavailable (status !== 'available')
// ----------------------------------------------------
try {
  const players = [
    createMockPlayer('p1', 'Player 1', 3, { status: 'available' }),
    createMockPlayer('p2', 'Player 2', 3, { status: 'available' }),
    createMockPlayer('p3', 'Player 3', 3, { status: 'resting' }), // Resting!
    createMockPlayer('p4', 'Player 4', 3, { status: 'available' }),
    createMockPlayer('p5', 'Player 5', 3, { status: 'available' }),
  ];
  const session = createMockSession('balanced');
  const recs = recommendMatchesForAvailableCourts([1], players, session);
  const cand = recs[1];

  const participantIds = cand ? [...cand.teamA, ...cand.teamB] : [];
  const restingIncluded = participantIds.includes('p3');
  const passed = cand !== null && !restingIncluded && participantIds.length === 4;

  testResults.push({
    scenario: 'Scenario 5: A player being unavailable/resting',
    passed,
    details: passed
      ? `Resting player p3 was correctly excluded from court recommendation. Participants: ${participantIds.join(', ')}`
      : `Resting player p3 was incorrectly included or match failed to form.`,
  });
} catch (e: any) {
  testResults.push({
    scenario: 'Scenario 5: A player being unavailable',
    passed: false,
    details: `Error thrown: ${e.message}`,
  });
}

// ----------------------------------------------------
// SCENARIO 6: Two teams having significantly different skill levels
// ----------------------------------------------------
try {
  const teamA: [Player, Player] = [
    createMockPlayer('p1', 'Grandmaster 1', 5),
    createMockPlayer('p2', 'Grandmaster 2', 5),
  ];
  const teamB: [Player, Player] = [
    createMockPlayer('p3', 'Beginner 1', 1),
    createMockPlayer('p4', 'Beginner 2', 1),
  ];

  const balance = calculateBalanceScore(teamA, teamB);
  // Team rating diff is |10 - 2| = 8.
  // Score formula: 10 - (8 * 2.8) - 0 = -12.4 -> clamped to 0.
  const passed = balance.ratingDiff === 8 && balance.score === 0;

  testResults.push({
    scenario: 'Scenario 6: Two teams having extreme skill difference (10 vs 2)',
    passed,
    details: passed
      ? `Rating difference is ${balance.ratingDiff}, balance score correctly penalized to minimum ${balance.score}`
      : `Balance score not clamped properly: diff=${balance.ratingDiff}, score=${balance.score}`,
  });
} catch (e: any) {
  testResults.push({
    scenario: 'Scenario 6: Two teams having significantly different skill levels',
    passed: false,
    details: `Error thrown: ${e.message}`,
  });
}

// ----------------------------------------------------
// SCENARIO 7: Completed match with a winner and loser
// ----------------------------------------------------
try {
  const players = [
    createMockPlayer('p1', 'Alice', 3),
    createMockPlayer('p2', 'Bob', 3),
    createMockPlayer('p3', 'Charlie', 3),
    createMockPlayer('p4', 'Diana', 3),
  ];
  const session = createMockSession('balanced');
  const match: Match = {
    id: 'm_test_7',
    sessionId: session.id,
    matchNumber: 1,
    courtNumber: 1,
    courtName: 'Court 1',
    teamA: ['p1', 'p2'],
    teamB: ['p3', 'p4'],
    scoreA: null,
    scoreB: null,
    winnerTeam: null,
    status: 'in_progress',
    startTime: Date.now() - 900000,
    endTime: null,
    explanation: 'Test',
    rotationModeUsed: 'balanced',
  };

  const result = StorageService.recordMatchResult(
    'm_test_7',
    11,
    7,
    'teamA',
    players,
    { ...session, activeCourtMatches: { 1: 'm_test_7', 2: null } },
    [match]
  );

  const p1 = result.updatedPlayers.find((p) => p.id === 'p1')!;
  const p3 = result.updatedPlayers.find((p) => p.id === 'p3')!;

  const passed =
    result.completedMatch.status === 'completed' &&
    result.completedMatch.scoreA === 11 &&
    result.completedMatch.scoreB === 7 &&
    result.completedMatch.winnerTeam === 'teamA' &&
    p1.sessionWins === 1 &&
    p1.wins === 1 &&
    p1.streak === 1 &&
    p3.sessionLosses === 1 &&
    p3.losses === 1 &&
    p3.streak === -1 &&
    p1.teammateHistory['p2'] === 1 &&
    p1.opponentHistory['p3'] === 1 &&
    result.updatedSession.activeCourtMatches[1] === null;

  testResults.push({
    scenario: 'Scenario 7: Completed match with winner (Team A 11-7)',
    passed,
    details: passed
      ? `Wins/losses, streaks (+1/-1), teammate/opponent history, and court clearing all updated correctly`
      : `Result update inconsistent: p1.wins=${p1?.wins}, p3.losses=${p3?.losses}, court1=${result.updatedSession.activeCourtMatches[1]}`,
  });
} catch (e: any) {
  testResults.push({
    scenario: 'Scenario 7: Completed match with a winner and loser',
    passed: false,
    details: `Error thrown: ${e.message}`,
  });
}

// ----------------------------------------------------
// SCENARIO 8: Repeatedly generating next matchup (Winner-Stays consecutive games limit test)
// ----------------------------------------------------
try {
  // In Winner-Stays mode with maxConsecutiveGames = 2:
  // Game 1: W1+W2 win. They stay for Game 2 (consecutiveGames becomes 1 -> 2).
  // Game 2: W1+W2 win again. They MUST NOT stay for Game 3!
  const players = [
    createMockPlayer('w1', 'Winner 1', 4, { consecutiveGames: 0 }),
    createMockPlayer('w2', 'Winner 2', 4, { consecutiveGames: 0 }),
    createMockPlayer('c1', 'Challenger 1', 4),
    createMockPlayer('c2', 'Challenger 2', 4),
    createMockPlayer('c3', 'Challenger 3', 4),
    createMockPlayer('c4', 'Challenger 4', 4),
  ];
  let session = createMockSession('winner_stays');
  session.rotationConfig.maxConsecutiveGames = 2;

  // Simulate Game 1 completed: w1+w2 beat c1+c2
  const match1: Match = {
    id: 'm1',
    sessionId: session.id,
    matchNumber: 1,
    courtNumber: 1,
    teamA: ['w1', 'w2'],
    teamB: ['c1', 'c2'],
    scoreA: 11,
    scoreB: 9,
    winnerTeam: 'teamA',
    status: 'completed',
    startTime: Date.now() - 1200000,
    endTime: Date.now() - 600000,
    confirmedAt: Date.now() - 600000,
    explanation: 'Game 1',
    rotationModeUsed: 'winner_stays',
  };

  // Run recordMatchResult for Game 1
  const rec1 = StorageService.recordMatchResult(
    'm1',
    11,
    9,
    'teamA',
    players,
    session,
    [{ ...match1, status: 'in_progress', confirmedAt: undefined }]
  );

  const playersAfterG1 = rec1.updatedPlayers;
  const w1AfterG1 = playersAfterG1.find((p) => p.id === 'w1')!;

  // Recommend for Court 1 after Game 1
  const candAfterG1 = recommendMatchForCourt(1, playersAfterG1, session, match1);
  const winnersStayedG2 =
    candAfterG1 !== null &&
    (candAfterG1.teamA.includes('w1') || candAfterG1.teamB.includes('w1'));

  // Simulate Game 2 completed: w1+w2 win again!
  const match2: Match = {
    id: 'm2',
    sessionId: session.id,
    matchNumber: 2,
    courtNumber: 1,
    teamA: ['w1', 'w2'],
    teamB: ['c3', 'c4'],
    scoreA: 11,
    scoreB: 8,
    winnerTeam: 'teamA',
    status: 'completed',
    startTime: Date.now() - 600000,
    endTime: Date.now(),
    confirmedAt: Date.now(),
    explanation: 'Game 2',
    rotationModeUsed: 'winner_stays',
  };

  const rec2 = StorageService.recordMatchResult(
    'm2',
    11,
    8,
    'teamA',
    playersAfterG1,
    session,
    [{ ...match2, status: 'in_progress', confirmedAt: undefined }]
  );

  const playersAfterG2 = rec2.updatedPlayers;
  const w1AfterG2 = playersAfterG2.find((p) => p.id === 'w1')!;

  // Recommend for Court 1 after Game 2: Winners have now won 2 games in a row (maxConsecutiveGames = 2).
  // THEY MUST ROTATE OFF! They must NOT stay as winners!
  const candAfterG2 = recommendMatchForCourt(1, playersAfterG2, session, match2);
  const winnersAreForcedOff =
    candAfterG2 !== null &&
    !candAfterG2.ruleTags.includes('winner_stays_applied') &&
    candAfterG2.winnersFromPrevious === undefined;

  const passed = winnersStayedG2 && winnersAreForcedOff;

  testResults.push({
    scenario: 'Scenario 8: Repeatedly generating next matchup (Winner-Stays max 2 consecutive games)',
    passed,
    details: `Game 1: w1.consec=${w1AfterG1.consecutiveGames}, winners stayed: ${winnersStayedG2}. Game 2: w1.consec=${w1AfterG2.consecutiveGames}, winners forced off: ${winnersAreForcedOff}, ruleTags: ${candAfterG2?.ruleTags.join(', ')}`,
    data: { w1AfterG1Consec: w1AfterG1.consecutiveGames, w1AfterG2Consec: w1AfterG2.consecutiveGames, candAfterG2Tags: candAfterG2?.ruleTags },
  });
} catch (e: any) {
  testResults.push({
    scenario: 'Scenario 8: Repeatedly generating next matchup',
    passed: false,
    details: `Error thrown: ${e.message}`,
  });
}

// ----------------------------------------------------
// SCENARIO 9: Refreshing the app after recording a result (Persistence)
// ----------------------------------------------------
try {
  const testMatch: Match = {
    id: 'm_persist_test',
    sessionId: 's_persist',
    matchNumber: 99,
    courtNumber: 1,
    teamA: ['p1', 'p2'],
    teamB: ['p3', 'p4'],
    scoreA: 11,
    scoreB: 5,
    winnerTeam: 'teamA',
    status: 'completed',
    startTime: Date.now() - 100000,
    endTime: Date.now(),
    confirmedAt: Date.now(),
    explanation: 'Persistence test',
    rotationModeUsed: 'balanced',
  };

  StorageService.saveMatches([testMatch]);
  const retrievedMatches = StorageService.getMatches();
  const found = retrievedMatches.find((m) => m.id === 'm_persist_test');

  const passed = found !== undefined && found.scoreA === 11 && found.status === 'completed';

  testResults.push({
    scenario: 'Scenario 9: Refreshing the app after recording a result (Storage serialization)',
    passed,
    details: passed
      ? `Retrieved persisted match faithfully from storage layer (scoreA=11, winnerTeam=teamA, status=completed)`
      : `Failed to retrieve match from storage layer`,
  });
} catch (e: any) {
  testResults.push({
    scenario: 'Scenario 9: Refreshing the app after recording a result',
    passed: false,
    details: `Error thrown: ${e.message}`,
  });
}

// ----------------------------------------------------
// SCENARIO 10: Submitting the same result more than once (Idempotency)
// ----------------------------------------------------
try {
  const initialPlayer = createMockPlayer('p1', 'Alice', 3);
  const match: Match = {
    id: 'm_idempotent_test',
    sessionId: 's_idempotent',
    matchNumber: 1,
    courtNumber: 1,
    teamA: ['p1', 'p2'],
    teamB: ['p3', 'p4'],
    scoreA: null,
    scoreB: null,
    winnerTeam: null,
    status: 'in_progress',
    startTime: Date.now() - 100000,
    endTime: null,
    explanation: 'Idempotency test',
    rotationModeUsed: 'balanced',
  };

  const session = createMockSession();

  // First submission
  const res1 = StorageService.recordMatchResult(
    'm_idempotent_test',
    11,
    6,
    'teamA',
    [initialPlayer, createMockPlayer('p2', 'Bob', 3), createMockPlayer('p3', 'C', 3), createMockPlayer('p4', 'D', 3)],
    session,
    [match]
  );

  const p1AfterFirst = res1.updatedPlayers.find((p) => p.id === 'p1')!;

  // Second submission with the updated matches and players
  const res2 = StorageService.recordMatchResult(
    'm_idempotent_test',
    11,
    6,
    'teamA',
    res1.updatedPlayers,
    res1.updatedSession,
    res1.updatedMatches
  );

  const p1AfterSecond = res2.updatedPlayers.find((p) => p.id === 'p1')!;

  // Submitting twice must NOT double count
  const passed =
    p1AfterFirst.wins === 1 &&
    p1AfterSecond.wins === 1 &&
    p1AfterFirst.sessionGamesPlayed === 1 &&
    p1AfterSecond.sessionGamesPlayed === 1;

  testResults.push({
    scenario: 'Scenario 10: Submitting the same result more than once (Idempotency)',
    passed,
    details: passed
      ? `Idempotency verified: Player wins remained 1 (did not double count to 2)`
      : `Idempotency failed: Player wins double counted from ${p1AfterFirst.wins} to ${p1AfterSecond.wins}`,
  });
} catch (e: any) {
  testResults.push({
    scenario: 'Scenario 10: Submitting the same result more than once',
    passed: false,
    details: `Error thrown: ${e.message}`,
  });
}

// ----------------------------------------------------
// BONUS AUDIT TESTS: RATING SANITIZATION & MULTI-COURT NO-DUPLICATES
// ----------------------------------------------------
try {
  // Test if missing or invalid rating crashes or produces NaN
  const invalidPlayer = createMockPlayer('p_bad', 'Bad Rating', undefined as any);
  const normalPlayer = createMockPlayer('p_good', 'Good', 3);
  const balance = calculateBalanceScore(
    [invalidPlayer, normalPlayer],
    [createMockPlayer('p3', 'C', 3), createMockPlayer('p4', 'D', 3)]
  );

  const isNan = Number.isNaN(balance.ratingA) || Number.isNaN(balance.score);
  testResults.push({
    scenario: 'Bonus Audit: Missing or undefined rating handling',
    passed: !isNan,
    details: isNan
      ? `VULNERABILITY CONFIRMED: calculateBalanceScore produced NaN (${balance.ratingA}, score=${balance.score}) when skillRating is undefined!`
      : `Handled gracefully without NaN`,
  });
} catch (e: any) {
  testResults.push({
    scenario: 'Bonus Audit: Missing or undefined rating handling',
    passed: false,
    details: `Crashed on invalid rating: ${e.message}`,
  });
}

// Print results summary
console.log('----------------------------------------------------');
console.log('AUDIT TEST SUITE RESULTS:');
console.log('----------------------------------------------------');
let passedCount = 0;
testResults.forEach((t, i) => {
  const icon = t.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${i + 1}] ${t.scenario}`);
  console.log(`   ${t.details}`);
  if (t.data) console.log(`   Data:`, JSON.stringify(t.data));
  if (t.passed) passedCount++;
});

console.log('\n====================================================');
console.log(`SUMMARY: ${passedCount} / ${testResults.length} TESTS PASSED`);
console.log('====================================================');
