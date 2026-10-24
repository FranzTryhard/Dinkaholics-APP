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
