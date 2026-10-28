import {
  calculateHeadToHead,
  getPlayerChemistryInsights,
  calculateAllPairsSynergy,
} from '../synergyEngine';
import { Player, Match } from '../../types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

function mockPlayer(id: string, name: string): Player {
  return {
    id,
    name,
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
  };
}

function mockMatch(
  id: string,
  teamA: [string, string],
  teamB: [string, string],
  scoreA: number,
  scoreB: number
): Match {
  return {
    id,
    sessionId: 'session_1',
    matchNumber: 1,
    courtNumber: 1,
    teamA,
    teamB,
    scoreA,
    scoreB,
    winnerTeam: scoreA > scoreB ? 'teamA' : 'teamB',
    status: 'completed',
    startTime: Date.now() - 100000,
    endTime: Date.now(),
    explanation: 'Test match',
    rotationModeUsed: 'balanced',
    confirmedAt: Date.now(),
  };
}

console.log('--- RUNNING SYNERGY & HEAD-TO-HEAD UNIT TESTS ---');

const p1 = mockPlayer('p1', 'Alice');
const p2 = mockPlayer('p2', 'Bob');
const p3 = mockPlayer('p3', 'Charlie');
const p4 = mockPlayer('p4', 'Diana');

// Match 1: Alice + Charlie (11) beat Bob + Diana (7)
const m1 = mockMatch('m1', ['p1', 'p3'], ['p2', 'p4'], 11, 7);
// Match 2: Alice + Charlie (11) beat Bob + Diana (9) [Clutch game <= 2]
const m2 = mockMatch('m2', ['p1', 'p3'], ['p2', 'p4'], 11, 9);
// Match 3: Bob + Charlie (11) beat Alice + Diana (8)
const m3 = mockMatch('m3', ['p2', 'p3'], ['p1', 'p4'], 11, 8);
// Match 4: Alice + Bob partner together (11) beat Charlie + Diana (5)
const m4 = mockMatch('m4', ['p1', 'p2'], ['p3', 'p4'], 11, 5);

const matches = [m1, m2, m3, m4];

// Test 1: Head to Head between Alice and Bob
const h2h = calculateHeadToHead(p1, p2, matches);
assert(h2h.totalOpponentMatches === 3, 'Alice and Bob played 3 matches as opponents');
assert(h2h.playerAWins === 2, 'Alice has 2 wins against Bob');
assert(h2h.playerBWins === 1, 'Bob has 1 win against Alice');
assert(h2h.playerAPoints === 11 + 11 + 8, 'Alice scored 30 points against Bob');
assert(h2h.playerBPoints === 7 + 9 + 11, 'Bob scored 27 points against Alice');
assert(h2h.pointDiff === 3, 'Point differential is +3 for Alice');
assert(h2h.clutchGamesCount === 1, 'Exactly 1 clutch match (11-9)');
assert(h2h.clutchWinsA === 1, 'Alice won the clutch game');

// Test 2: Partnership between Alice and Bob
assert(h2h.matchesAsPartners.length === 1, 'Alice and Bob partnered in 1 match');
assert(h2h.partnerWins === 1, 'Alice and Bob won their partner match');
assert(h2h.partnerWinPct === 100, 'Alice and Bob have 100% win rate as partners');

// Test 3: Player chemistry insights
const aliceInsights = getPlayerChemistryInsights(p1, [p1, p2, p3, p4], matches);
assert(aliceInsights.bestPartner !== null, 'Alice has a best partner');
assert(aliceInsights.bestPartner?.player.id === 'p3' || aliceInsights.bestPartner?.player.id === 'p2', 'Best partner is Charlie or Bob');
assert(
  aliceInsights.toughestRival?.player.id === 'p2' || aliceInsights.toughestRival?.player.id === 'p3',
  'Bob or Charlie is Alice’s toughest rival'
);

// Test 4: All pairs synergy
const allPairs = calculateAllPairsSynergy([p1, p2, p3, p4], matches);
assert(allPairs.length > 0, 'Generated synergy for pairs with history');

console.log('🎉 ALL SYNERGY TESTS PASSED CLEANLY!');
