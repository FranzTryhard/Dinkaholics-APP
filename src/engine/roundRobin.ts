import { Player } from '../types';

export interface RoundRobinMatch {
  id: string;
  roundNumber: number;
  courtNumber: number;
  teamA: [string, string];
  teamB: [string, string];
  scoreA: number | null;
  scoreB: number | null;
  winnerTeam: 'teamA' | 'teamB' | null;
  completed: boolean;
}

export interface RoundRobinRound {
  roundNumber: number;
  matches: RoundRobinMatch[];
  byes: string[]; // player IDs resting this round
}

export interface PlayerStanding {
  player: Player;
  played: number;
  wins: number;
  losses: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
}

/**
 * Generates an optimized doubles round robin schedule matrix.
 * Prioritizes:
 * 1. Even distribution of byes (resting players)
 * 2. Rotating partners so players team up with as many different participants as possible
 * 3. Fair court allocation
 */
export function generateRoundRobinSchedule(
  participants: Player[],
  availableCourts: number = 2,
  numRounds?: number
): RoundRobinRound[] {
  if (participants.length < 4) return [];

  const playerIds = participants.map((p) => p.id);
  const N = playerIds.length;
  const courtsPerRound = Math.min(availableCourts, Math.floor(N / 4));
  const playersPerRound = courtsPerRound * 4;

  // Determine standard number of rounds (e.g. 5 rounds or N-1)
  const totalRounds = numRounds || (N <= 4 ? 3 : N <= 8 ? 5 : 7);

  const rounds: RoundRobinRound[] = [];
  const partnershipCounts: Record<string, Record<string, number>> = {};
  const byeCounts: Record<string, number> = {};

  playerIds.forEach((id) => {
    partnershipCounts[id] = {};
    byeCounts[id] = 0;
    playerIds.forEach((otherId) => {
      partnershipCounts[id][otherId] = 0;
    });
  });

  for (let r = 1; r <= totalRounds; r++) {
    // 1. Select players for this round, prioritizing those with the fewest byes / fewest games
    const sortedForSelection = [...playerIds].sort((a, b) => {
      return (byeCounts[b] || 0) - (byeCounts[a] || 0);
    });

    const activePlayers = sortedForSelection.slice(0, playersPerRound);
    const byes = sortedForSelection.slice(playersPerRound);
    byes.forEach((id) => {
      byeCounts[id] = (byeCounts[id] || 0) + 1;
    });

    // 2. Group into courts and form pairs minimizing repeat partnerships
    const roundMatches: RoundRobinMatch[] = [];
    const pool = [...activePlayers];

    for (let c = 1; c <= courtsPerRound; c++) {
      if (pool.length < 4) break;

      // Take 4 players for this court
      const courtFour = pool.splice(0, 4);

      // Try the 3 pairing permutations and pick the one with lowest partner repeat score
      const perm1: [[string, string], [string, string]] = [
        [courtFour[0], courtFour[1]],
        [courtFour[2], courtFour[3]],
      ];
      const perm2: [[string, string], [string, string]] = [
        [courtFour[0], courtFour[2]],
        [courtFour[1], courtFour[3]],
      ];
      const perm3: [[string, string], [string, string]] = [
        [courtFour[0], courtFour[3]],
        [courtFour[1], courtFour[2]],
      ];

      const scorePerm = (p: [[string, string], [string, string]]) => {
        const cost1 = (partnershipCounts[p[0][0]]?.[p[0][1]] || 0);
        const cost2 = (partnershipCounts[p[1][0]]?.[p[1][1]] || 0);
        return cost1 + cost2;
      };

      const perms = [perm1, perm2, perm3].sort((a, b) => scorePerm(a) - scorePerm(b));
      const chosen = perms[0];

      // Record partnerships
      partnershipCounts[chosen[0][0]][chosen[0][1]]++;
      partnershipCounts[chosen[0][1]][chosen[0][0]]++;
      partnershipCounts[chosen[1][0]][chosen[1][1]]++;
      partnershipCounts[chosen[1][1]][chosen[1][0]]++;

      roundMatches.push({
        id: `rr_r${r}_c${c}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        roundNumber: r,
        courtNumber: c,
        teamA: chosen[0],
        teamB: chosen[1],
        scoreA: null,
        scoreB: null,
        winnerTeam: null,
        completed: false,
      });
    }

    rounds.push({
      roundNumber: r,
      matches: roundMatches,
      byes,
    });
  }

  return rounds;
}

/**
 * Computes live tournament leaderboard standings from completed round-robin matches.
 */
export function calculateStandings(
  participants: Player[],
  rounds: RoundRobinRound[]
): PlayerStanding[] {
  const standingsMap: Record<
    string,
    {
      played: number;
      wins: number;
      losses: number;
      pointsFor: number;
      pointsAgainst: number;
    }
  > = {};

  participants.forEach((p) => {
    standingsMap[p.id] = {
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    };
  });

  rounds.forEach((round) => {
    round.matches.forEach((m) => {
      if (m.completed && m.scoreA !== null && m.scoreB !== null && m.winnerTeam) {
        const teamAPlayers = m.teamA;
        const teamBPlayers = m.teamB;
        const isTeamAWinner = m.winnerTeam === 'teamA';

        // Team A stats
        teamAPlayers.forEach((pId) => {
          if (!standingsMap[pId]) return;
          standingsMap[pId].played += 1;
          standingsMap[pId].pointsFor += m.scoreA || 0;
          standingsMap[pId].pointsAgainst += m.scoreB || 0;
          if (isTeamAWinner) {
            standingsMap[pId].wins += 1;
          } else {
            standingsMap[pId].losses += 1;
          }
        });

        // Team B stats
        teamBPlayers.forEach((pId) => {
          if (!standingsMap[pId]) return;
          standingsMap[pId].played += 1;
          standingsMap[pId].pointsFor += m.scoreB || 0;
          standingsMap[pId].pointsAgainst += m.scoreA || 0;
          if (!isTeamAWinner) {
            standingsMap[pId].wins += 1;
          } else {
            standingsMap[pId].losses += 1;
          }
        });
      }
    });
  });

  const list: PlayerStanding[] = participants.map((p) => {
    const s = standingsMap[p.id] || { played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
    const winPct = s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0;
    const pointDiff = s.pointsFor - s.pointsAgainst;

    return {
      player: p,
      played: s.played,
      wins: s.wins,
      losses: s.losses,
      winPct,
      pointsFor: s.pointsFor,
      pointsAgainst: s.pointsAgainst,
      pointDiff,
    };
  });

  // Sort by Wins desc, Point Diff desc, Points For desc
  return list.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return b.pointsFor - a.pointsFor;
  });
}

export type TournamentFormat = 'round_robin' | 'king_of_court';

export interface KingCourtLadderState {
  currentRound: number;
  courtAssignments: {
    courtNumber: number;
    isKingCourt: boolean;
    courtLabel: string;
    teamA: [string, string];
    teamB: [string, string];
    scoreA: number | null;
    scoreB: number | null;
    winnerTeam: 'teamA' | 'teamB' | null;
    completed: boolean;
  }[];
  waitingQueue: string[];
}

/**
 * Generates initial round for King of the Court Ladder format.
 * Court 1 is the King's Court.
 */
export function generateInitialKingLadder(
  participants: Player[],
  availableCourts: number = 2
): RoundRobinRound {
  if (participants.length < 4) return { roundNumber: 1, matches: [], byes: [] };

  // Seed by skill rating descending
  const sorted = [...participants].sort((a, b) => b.skillRating - a.skillRating);
  const playerIds = sorted.map((p) => p.id);

  const courtsCount = Math.min(availableCourts, Math.floor(playerIds.length / 4));
  const activeIds = playerIds.slice(0, courtsCount * 4);
  const byes = playerIds.slice(courtsCount * 4);

  const matches: RoundRobinMatch[] = [];

  for (let c = 1; c <= courtsCount; c++) {
    const startIdx = (c - 1) * 4;
    const courtFour = activeIds.slice(startIdx, startIdx + 4);
    matches.push({
      id: `kotc_r1_c${c}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roundNumber: 1,
      courtNumber: c,
      teamA: [courtFour[0], courtFour[3]],
      teamB: [courtFour[1], courtFour[2]],
      scoreA: null,
      scoreB: null,
      winnerTeam: null,
      completed: false,
    });
  }

  return {
    roundNumber: 1,
    matches,
    byes,
  };
}

/**
 * Advances King of the Court to next round:
 * - Court 1 (King) Winners STAY on Court 1 (split or stay)
 * - Court 1 Losers DROP to Court 2
 * - Court 2 Winners MOVE UP to Court 1
 * - Court 2 Losers DROP to Court 3 (or Byes)
 * - Waiting players enter lowest court
 */
export function advanceKingCourtLadder(
  previousRound: RoundRobinRound,
  allParticipants: Player[],
  availableCourts: number
): RoundRobinRound {
  const nextRoundNum = previousRound.roundNumber + 1;
  const courts = [...previousRound.matches].sort((a, b) => a.courtNumber - b.courtNumber);
  const numCourts = courts.length;

  const winnersByCourt: Record<number, [string, string]> = {};
  const losersByCourt: Record<number, [string, string]> = {};

  courts.forEach((m) => {
    const isWinnerA = m.winnerTeam === 'teamA' || ((m.scoreA ?? 0) >= (m.scoreB ?? 0));
    winnersByCourt[m.courtNumber] = isWinnerA ? m.teamA : m.teamB;
    losersByCourt[m.courtNumber] = isWinnerA ? m.teamB : m.teamA;
  });

  const nextMatches: RoundRobinMatch[] = [];
  const incomingByes = [...previousRound.byes];
  const newByes: string[] = [];

  for (let c = 1; c <= numCourts; c++) {
    let courtPlayers: string[] = [];

    if (c === 1) {
      // Court 1: King Court
      // Winners from Court 1 stay (split to play with incoming winners from Court 2)
      const kingStayers = winnersByCourt[1] || courts[0].teamA;
      const court2Promoters = numCourts >= 2 ? (winnersByCourt[2] || courts[1].teamA) : (losersByCourt[1] || courts[0].teamB);

      // Pair 1 king with 1 challenger for fair King of Court play
      const teamA: [string, string] = [kingStayers[0], court2Promoters[0]];
      const teamB: [string, string] = [kingStayers[1], court2Promoters[1]];

      nextMatches.push({
        id: `kotc_r${nextRoundNum}_c1_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        roundNumber: nextRoundNum,
        courtNumber: 1,
        teamA,
        teamB,
        scoreA: null,
        scoreB: null,
        winnerTeam: null,
        completed: false,
      });
    } else {
      // Court c (c >= 2)
      // Losers from Court c-1 drop down to Court c
      const droppedFromAbove = losersByCourt[c - 1] || [];
      
      let incomingLower: string[] = [];
      if (c === numCourts) {
        // Lowest court: if there are players in byes queue, rotate them in!
        if (incomingByes.length >= 2) {
          incomingLower = incomingByes.splice(0, 2);
          // Lowest court losers go to byes
          const lowestLosers = losersByCourt[c] || [];
          newByes.push(...lowestLosers);
        } else {
          incomingLower = losersByCourt[c] || [];
        }
      } else {
        // Winners from court c+1 move up to court c
        incomingLower = winnersByCourt[c + 1] || [];
      }

      const teamA: [string, string] = [droppedFromAbove[0] || '', incomingLower[0] || ''];
      const teamB: [string, string] = [droppedFromAbove[1] || '', incomingLower[1] || ''];

      nextMatches.push({
        id: `kotc_r${nextRoundNum}_c${c}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        roundNumber: nextRoundNum,
        courtNumber: c,
        teamA,
        teamB,
        scoreA: null,
        scoreB: null,
        winnerTeam: null,
        completed: false,
      });
    }
  }

  newByes.push(...incomingByes);

  return {
    roundNumber: nextRoundNum,
    matches: nextMatches,
    byes: newByes,
  };
}

