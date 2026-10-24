import {
  Player,
  Match,
  MatchCandidate,
  Session,
  RotationMode,
  RotationConfig,
  SkillLevel,
} from '../types';
import { WEIGHTS_BY_MODE, DEFAULT_ROTATION_CONFIG } from './config';

/**
 * Returns the 3 unique pairings of 4 players into 2 doubles teams.
 */
function getPairings(p: [Player, Player, Player, Player]): Array<[[Player, Player], [Player, Player]]> {
  return [
    [[p[0], p[1]], [p[2], p[3]]],
    [[p[0], p[2]], [p[1], p[3]]],
    [[p[0], p[3]], [p[1], p[2]]],
  ];
}

/**
 * Validates and clamps a player skill rating strictly to 1, 2, 3, 4, or 5.
 * Defaults missing or invalid ratings safely to 3 (Intermediate).
 */
export function sanitizeSkillRating(rating: unknown): SkillLevel {
  if (typeof rating === 'number' && !Number.isNaN(rating)) {
    const rounded = Math.round(rating);
    if (rounded <= 1) return 1;
    if (rounded >= 5) return 5;
    return rounded as SkillLevel;
  }
  if (typeof rating === 'string') {
    const parsed = parseInt(rating, 10);
    if (!Number.isNaN(parsed)) {
      return sanitizeSkillRating(parsed);
    }
  }
  return 3;
}

/**
 * Computes balance score (0 to 10 scale).
 * 10 is perfectly balanced (equal team rating and similar internal distribution).
 */
export function calculateBalanceScore(
  teamA: [Player, Player],
  teamB: [Player, Player]
): {
  score: number;
  ratingA: number;
  ratingB: number;
  ratingDiff: number;
  spreadA: number;
  spreadB: number;
} {
  const rA1 = sanitizeSkillRating(teamA[0]?.skillRating);
  const rA2 = sanitizeSkillRating(teamA[1]?.skillRating);
  const rB1 = sanitizeSkillRating(teamB[0]?.skillRating);
  const rB2 = sanitizeSkillRating(teamB[1]?.skillRating);

  const ratingA = rA1 + rA2;
  const ratingB = rB1 + rB2;
  const ratingDiff = Math.abs(ratingA - ratingB);

  // Spread disparity: e.g. Level 5 + Level 1 (spread 4) vs Level 3 + Level 3 (spread 0)
  const spreadA = Math.abs(rA1 - rA2);
  const spreadB = Math.abs(rB1 - rB2);
  const spreadDiff = Math.abs(spreadA - spreadB);

  // Base score 10, penalize for rating difference and severe spread disparity
  let score = 10 - (ratingDiff * 2.8) - (spreadDiff * 0.4);
  score = Math.max(0, Math.min(10, score));

  return { score, ratingA, ratingB, ratingDiff, spreadA, spreadB };
}

/**
 * Computes fairness score (0 to 10 scale) based on waiting time and games played.
 * Higher score means the combination gives court time to players who need it most.
 */
export function calculateFairnessScore(
  players: [Player, Player, Player, Player],
  allAvailablePlayers: Player[]
): number {
  if (allAvailablePlayers.length === 0) return 10;

  // Find max games played in session among all available
  const maxGames = Math.max(...allAvailablePlayers.map((p) => p.sessionGamesPlayed), 0);
  const maxWait = Math.max(...allAvailablePlayers.map((p) => getEffectiveWaitMs(p)), 1000);

  let gamesScoreSum = 0;
  let waitScoreSum = 0;

  for (const p of players) {
    // Fewer games played => higher fairness score
    const gamesRatio = maxGames === 0 ? 1 : 1 - (p.sessionGamesPlayed / (maxGames + 1));
    gamesScoreSum += gamesRatio;

    // Longer wait time => higher fairness score
    const waitMs = getEffectiveWaitMs(p);
    const waitRatio = Math.min(1, waitMs / maxWait);
    waitScoreSum += waitRatio;

    // Penalty if player has high consecutive games
    if (p.consecutiveGames > 0) {
      gamesScoreSum -= p.consecutiveGames * 0.3;
    }
  }

  const normalized = ((gamesScoreSum / 4) * 0.5 + (waitScoreSum / 4) * 0.5) * 10;
  return Math.max(0, Math.min(10, normalized));
}

/**
 * Computes variety score (0 to 10 scale).
 * Penalizes players who have partnered together or played against each other in this session.
 */
export function calculateVarietyScore(
  teamA: [Player, Player],
  teamB: [Player, Player]
): number {
  const pA1 = teamA[0];
  const pA2 = teamA[1];
  const pB1 = teamB[0];
  const pB2 = teamB[1];

  // Teammate repetition
  const teamAPartnerCount = (pA1.teammateHistory?.[pA2.id] || 0);
  const teamBPartnerCount = (pB1.teammateHistory?.[pB2.id] || 0);
  const totalPartnerRepeats = teamAPartnerCount + teamBPartnerCount;

  // Opponent repetition
  let totalOpponentRepeats = 0;
  totalOpponentRepeats += (pA1.opponentHistory?.[pB1.id] || 0);
  totalOpponentRepeats += (pA1.opponentHistory?.[pB2.id] || 0);
  totalOpponentRepeats += (pA2.opponentHistory?.[pB1.id] || 0);
  totalOpponentRepeats += (pA2.opponentHistory?.[pB2.id] || 0);

  // Score starts at 10, deducting for repeated combinations
  let score = 10 - (totalPartnerRepeats * 2.5) - (totalOpponentRepeats * 0.6);
  return Math.max(0, Math.min(10, score));
}

/**
 * Calculates effective waiting time in ms for a player.
 */
export function getEffectiveWaitMs(player: Player, now: number = Date.now()): number {
  if (player.status !== 'available') return 0;
  if (!player.waitingSince) {
    return player.totalWaitingTimeMs || 0;
  }
  return (player.totalWaitingTimeMs || 0) + Math.max(0, now - player.waitingSince);
}

/**
 * Formats wait duration into clean human readable string (e.g. "8m", "14m", "< 1m").
 */
export function formatWaitTime(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return '< 1m';
  return `${mins}m`;
}

/**
 * Generate human-readable, authentic explanation based on the exact scores and rules.
 */
export function generateMatchExplanation(
  teamA: [Player, Player],
  teamB: [Player, Player],
  balanceData: ReturnType<typeof calculateBalanceScore>,
  mode: RotationMode,
  ruleTags: string[],
  waitTimeInfo?: { longestWaiters: string[] }
): string {
  const reasons: string[] = [];

  // Rating balance clause
  if (balanceData.ratingDiff === 0) {
    reasons.push(`Perfect rating parity (${balanceData.ratingA} vs ${balanceData.ratingB})`);
  } else if (balanceData.ratingDiff <= 1) {
    reasons.push(`Competitive balance (${balanceData.ratingA} vs ${balanceData.ratingB})`);
  } else {
    reasons.push(`Match rating ${balanceData.ratingA} vs ${balanceData.ratingB}`);
  }

  // Waiting priority clause
  if (waitTimeInfo && waitTimeInfo.longestWaiters.length > 0) {
    reasons.push(`prioritizes longest-waiting players (${waitTimeInfo.longestWaiters.join(' & ')})`);
  }

  // Variety clause
  const aPartnerTimes = teamA[0].teammateHistory?.[teamA[1].id] || 0;
  const bPartnerTimes = teamB[0].teammateHistory?.[teamB[1].id] || 0;
  if (aPartnerTimes === 0 && bPartnerTimes === 0) {
    reasons.push('features new doubles partnerships for both sides');
  } else if (aPartnerTimes === 0 || bPartnerTimes === 0) {
    reasons.push('introduces a fresh team combination');
  }

  // Mode specific note
  if (mode === 'winner_stays' && ruleTags.includes('winner_stays_applied')) {
    reasons.push('previous game winners stay on court against top challengers');
  } else if (mode === 'king_of_court') {
    if (ruleTags.includes('king_court_defense')) {
      reasons.push('Court 1 champions defend their crown against promoted challengers');
    } else if (ruleTags.includes('ladder_advancement')) {
      reasons.push('winners advance up toward Court 1 while runners-up battle to reclaim position');
    } else if (ruleTags.includes('ladder_base_rotation')) {
      reasons.push('queue challengers enter at ladder base court');
    } else {
      reasons.push('ladder tier matchmaking (winners move up, runners-up move down)');
    }
  } else if (mode === 'social') {
    reasons.push('maximizes group mixing');
  }

  return reasons.length > 0 ? reasons.join(', ') + '.' : 'Optimal match evaluated by court fairness algorithm.';
}

/**
 * Evaluate a single 4-player doubles candidate and compute full candidate metadata.
 */
function evaluateCandidate(
  courtNumber: number,
  teamA: [Player, Player],
  teamB: [Player, Player],
  mode: RotationMode,
  allAvailablePlayers: Player[],
  ruleTags: string[] = [],
  balanceTolerance: number = 2.0
): MatchCandidate {
  const weights = WEIGHTS_BY_MODE[mode];
  const balance = calculateBalanceScore(teamA, teamB);
  const fourPlayers: [Player, Player, Player, Player] = [teamA[0], teamA[1], teamB[0], teamB[1]];
  const fairness = calculateFairnessScore(fourPlayers, allAvailablePlayers);
  const variety = calculateVarietyScore(teamA, teamB);

  // Apply penalty if rating difference exceeds configured balance tolerance
  let adjustedBalanceScore = balance.score;
  if (balance.ratingDiff > balanceTolerance) {
    adjustedBalanceScore = Math.max(0, adjustedBalanceScore - (balance.ratingDiff - balanceTolerance) * 1.5);
    if (!ruleTags.includes('tolerance_exceeded')) {
      ruleTags.push('tolerance_exceeded');
    }
  }

  // Overall weighted score incorporating all configured mode weights
  const totalWeight =
    weights.balanceWeight +
    weights.waitingTimeWeight +
    weights.varietyTeammateWeight +
    weights.varietyOpponentWeight;

  const overallScore = Number(
    (
      (adjustedBalanceScore * weights.balanceWeight +
        fairness * weights.waitingTimeWeight +
        variety * (weights.varietyTeammateWeight + weights.varietyOpponentWeight)) /
      totalWeight
    ).toFixed(2)
  );

  // Identify longest waiting players in this match
  const sortedByWait = [...fourPlayers].sort(
    (a, b) => getEffectiveWaitMs(b) - getEffectiveWaitMs(a)
  );
  const longestWaiters = sortedByWait.slice(0, 2).map((p) => p.name);

  const explanation = generateMatchExplanation(
    teamA,
    teamB,
    balance,
    mode,
    ruleTags,
    { longestWaiters }
  );

  return {
    courtNumber,
    teamA: [teamA[0].id, teamA[1].id],
    teamB: [teamB[0].id, teamB[1].id],
    teamARating: balance.ratingA,
    teamBRating: balance.ratingB,
    ratingDiff: balance.ratingDiff,
    balanceScore: Number(balance.score.toFixed(1)),
    fairnessScore: Number(fairness.toFixed(1)),
    varietyScore: Number(variety.toFixed(1)),
    overallScore,
    explanation,
    ruleTags,
  };
}

/**
 * Sorts eligible available players by priority for next match:
 * - High priority for long waiting time
 * - High priority for fewer games played in session
 * - Penalty for high consecutive games
 */
export function prioritizeEligiblePlayers(players: Player[]): Player[] {
  const now = Date.now();
  const maxGames = Math.max(...players.map((p) => p.sessionGamesPlayed), 0);

  return [...players].sort((a, b) => {
    const waitA = getEffectiveWaitMs(a, now);
    const waitB = getEffectiveWaitMs(b, now);

    // Score: fewer games = higher score, longer wait = higher score, consecutive games = penalty
    const scoreA =
      (maxGames - a.sessionGamesPlayed) * 15 +
      (waitA / 30000) * 10 -
      a.consecutiveGames * 20;

    const scoreB =
      (maxGames - b.sessionGamesPlayed) * 15 +
      (waitB / 30000) * 10 -
      b.consecutiveGames * 20;

    return scoreB - scoreA;
  });
}

/**
 * Generates the best recommended match for a single court given available players and mode.
 */
export function recommendMatchForCourt(
  courtNumber: number,
  eligiblePlayers: Player[],
  session: Session,
  previousMatchOnCourt: Match | null = null,
  now: number = Date.now()
): MatchCandidate | null {
  if (eligiblePlayers.length < 4) {
    return null;
  }

  const mode = session.rotationMode;
  const config = session.rotationConfig || DEFAULT_ROTATION_CONFIG;
  const ruleTags: string[] = [];

  // ==========================================
  // MODE B: WINNER-STAYS ROTATION CHECK
  // ==========================================
  if (mode === 'winner_stays' && previousMatchOnCourt && previousMatchOnCourt.winnerTeam) {
    const winnerIds =
      previousMatchOnCourt.winnerTeam === 'teamA'
        ? previousMatchOnCourt.teamA
        : previousMatchOnCourt.teamB;

    const winnerPlayers = winnerIds
      .map((id) => eligiblePlayers.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined && p.status === 'available');

    // Check if both winners are available and haven't exceeded consecutive games
    if (winnerPlayers.length === 2) {
      const maxConsec = Math.max(...winnerPlayers.map((p) => p.consecutiveGames));
      if (maxConsec < config.maxConsecutiveGames) {
        // Winners stay!
        const remainingPlayers = eligiblePlayers.filter(
          (p) => !winnerIds.includes(p.id)
        );

        if (remainingPlayers.length >= 2) {
          // Select challengers: prioritize longest waiting available players
          const prioritizedChallengers = prioritizeEligiblePlayers(remainingPlayers);
          const candidateChallengers = prioritizedChallengers.slice(0, 6);

          let bestCandidate: MatchCandidate | null = null;
          ruleTags.push('winner_stays_applied');

          if (config.winnerStaysRule === 'split_partners') {
            // Split winners so one is on Team A and one is on Team B
            ruleTags.push('winners_split');
            const w1 = winnerPlayers[0];
            const w2 = winnerPlayers[1];

            for (let i = 0; i < candidateChallengers.length - 1; i++) {
              for (let j = i + 1; j < candidateChallengers.length; j++) {
                const c1 = candidateChallengers[i];
                const c2 = candidateChallengers[j];

                // Pairing 1: (w1, c1) vs (w2, c2)
                const cand1 = evaluateCandidate(
                  courtNumber,
                  [w1, c1],
                  [w2, c2],
                  mode,
                  eligiblePlayers,
                  ruleTags
                );
                if (!bestCandidate || cand1.overallScore > bestCandidate.overallScore) {
                  bestCandidate = cand1;
                }

                // Pairing 2: (w1, c2) vs (w2, c1)
                const cand2 = evaluateCandidate(
                  courtNumber,
                  [w1, c2],
                  [w2, c1],
                  mode,
                  eligiblePlayers,
                  ruleTags
                );
                if (!bestCandidate || cand2.overallScore > bestCandidate.overallScore) {
                  bestCandidate = cand2;
                }
              }
            }
          } else {
            // Stay together as Team A
            ruleTags.push('winners_together');
            const winningTeam: [Player, Player] = [winnerPlayers[0], winnerPlayers[1]];

            for (let i = 0; i < candidateChallengers.length - 1; i++) {
              for (let j = i + 1; j < candidateChallengers.length; j++) {
                const challengerTeam: [Player, Player] = [
                  candidateChallengers[i],
                  candidateChallengers[j],
                ];

                const cand = evaluateCandidate(
                  courtNumber,
                  winningTeam,
                  challengerTeam,
                  mode,
                  eligiblePlayers,
                  ruleTags
                );

                if (!bestCandidate || cand.overallScore > bestCandidate.overallScore) {
                  bestCandidate = cand;
                }
              }
            }
          }

          if (bestCandidate) {
            bestCandidate.winnersFromPrevious = [winnerPlayers[0].id, winnerPlayers[1].id];
            return bestCandidate;
          }
        }
      } else {
        ruleTags.push('consecutive_games_limit_reached');
      }
    }
  }

  // ==========================================
  // MODE C: KING OF THE COURT (LADDER) ROTATION
  // ==========================================
  if (mode === 'king_of_court') {
    // Court 1 is the King's Throne
    if (courtNumber === 1 && previousMatchOnCourt && previousMatchOnCourt.winnerTeam) {
      const winnerIds =
        previousMatchOnCourt.winnerTeam === 'teamA'
          ? previousMatchOnCourt.teamA
          : previousMatchOnCourt.teamB;

      const kingWinners = winnerIds
        .map((id) => eligiblePlayers.find((p) => p.id === id))
        .filter((p): p is Player => p !== undefined && p.status === 'available');

      if (
        kingWinners.length === 2 &&
        Math.max(...kingWinners.map((p) => p.consecutiveGames)) < config.maxConsecutiveGames
      ) {
        ruleTags.push('king_court_defense');
        const challengers = eligiblePlayers.filter((p) => !winnerIds.includes(p.id));

        if (challengers.length >= 2) {
          const prioritizedChallengers = prioritizeEligiblePlayers(challengers);
          const topChallengers: [Player, Player] = [
            prioritizedChallengers[0],
            prioritizedChallengers[1],
          ];

          const cand = evaluateCandidate(
            courtNumber,
            [kingWinners[0], kingWinners[1]],
            topChallengers,
            mode,
            eligiblePlayers,
            ruleTags
          );
          cand.winnersFromPrevious = [kingWinners[0].id, kingWinners[1].id];
          return cand;
        }
      }
    } else if (courtNumber > 1 && courtNumber === session.courtCount) {
      ruleTags.push('ladder_base_rotation');
    } else {
      ruleTags.push('ladder_advancement');
    }
  }

  // ==========================================
  // GENERAL MATCH CANDIDATE SEARCH (Balanced & Social & Winner-Stays fallback)
  // ==========================================
  const prioritized = prioritizeEligiblePlayers(eligiblePlayers);
  
  // To keep algorithm deterministic and performant for larger groups (e.g. 16+ players),
  // consider combinations from the top pool of prioritized eligible players.
  const poolSize = Math.min(prioritized.length, 10);
  const candidatePool = prioritized.slice(0, poolSize);

  let bestMatch: MatchCandidate | null = null;

  for (let i = 0; i < candidatePool.length - 3; i++) {
    for (let j = i + 1; j < candidatePool.length - 2; j++) {
      for (let k = j + 1; k < candidatePool.length - 1; k++) {
        for (let l = k + 1; l < candidatePool.length; l++) {
          const four: [Player, Player, Player, Player] = [
            candidatePool[i],
            candidatePool[j],
            candidatePool[k],
            candidatePool[l],
          ];

          // 3 unique pairings of these 4 players
          const pairings = getPairings(four);

          for (const [teamA, teamB] of pairings) {
            const candidate = evaluateCandidate(
              courtNumber,
              teamA,
              teamB,
              mode,
              eligiblePlayers,
              ruleTags
            );

            if (!bestMatch || candidate.overallScore > bestMatch.overallScore) {
              bestMatch = candidate;
            }
          }
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Multi-court recommendation generator.
 * Guarantees NO player is scheduled on multiple courts simultaneously.
 */
export function recommendMatchesForAvailableCourts(
  availableCourtNumbers: number[],
  allPlayers: Player[],
  session: Session,
  previousMatchesByCourt: Record<number, Match | null> = {},
  allMatches: Match[] = []
): Record<number, MatchCandidate | null> {
  const recommendations: Record<number, MatchCandidate | null> = {};
  
  // Filter players who are NOT currently in an active match
  const currentlyPlayingIds = new Set<string>();
  const activeMatchIds = new Set(Object.values(session.activeCourtMatches).filter((id): id is string => Boolean(id)));

  allMatches.forEach((m) => {
    if (activeMatchIds.has(m.id) || m.status === 'in_progress') {
      m.teamA.forEach((id) => currentlyPlayingIds.add(id));
      m.teamB.forEach((id) => currentlyPlayingIds.add(id));
    }
  });

  let remainingEligible = allPlayers.filter(
    (p) => p.status === 'available' && !currentlyPlayingIds.has(p.id)
  );

  // Generate recommendations court by court
  for (const courtNum of availableCourtNumbers) {
    if (remainingEligible.length < 4) {
      recommendations[courtNum] = null;
      continue;
    }

    const prevMatch = previousMatchesByCourt[courtNum] || null;
    const recommendation = recommendMatchForCourt(
      courtNum,
      remainingEligible,
      session,
      prevMatch
    );

    if (recommendation) {
      recommendations[courtNum] = recommendation;
      
      // Remove the 4 chosen players from eligible pool for subsequent courts
      const assignedIds = new Set([
        ...recommendation.teamA,
        ...recommendation.teamB,
      ]);
      remainingEligible = remainingEligible.filter((p) => !assignedIds.has(p.id));
    } else {
      recommendations[courtNum] = null;
    }
  }

  return recommendations;
}

/**
 * Creates an in-progress match from a recommendation.
 */
export function createMatchFromRecommendation(
  sessionId: string,
  courtNumber: number,
  matchNumber: number,
  candidate: MatchCandidate,
  courtName?: string,
  rotationMode?: RotationMode
): Match {
  return {
    id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    sessionId,
    matchNumber,
    courtNumber,
    courtName: courtName || `Court ${courtNumber}`,
    teamA: candidate.teamA,
    teamB: candidate.teamB,
    scoreA: null,
    scoreB: null,
    winnerTeam: null,
    status: 'in_progress',
    startTime: Date.now(),
    endTime: null,
    explanation: candidate.explanation,
    rotationModeUsed: rotationMode || 'balanced',
  };
}
