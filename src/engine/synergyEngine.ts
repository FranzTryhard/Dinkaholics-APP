import { Player, Match } from '../types';

export interface HeadToHeadStats {
  playerA: Player;
  playerB: Player;
  // As Opponents
  matchesAsOpponents: Match[];
  playerAWins: number;
  playerBWins: number;
  totalOpponentMatches: number;
  playerAPoints: number;
  playerBPoints: number;
  pointDiff: number; // playerA - playerB
  avgPointsA: number;
  avgPointsB: number;
  currentStreakHolder: 'playerA' | 'playerB' | 'none';
  currentStreakCount: number;
  clutchGamesCount: number; // Matches decided by <= 2 points
  clutchWinsA: number;
  clutchWinsB: number;
  
  // As Partners
  matchesAsPartners: Match[];
  partnerWins: number;
  partnerLosses: number;
  partnerWinPct: number;
  partnerPointsFor: number;
  partnerPointsAgainst: number;
  partnerPointDiff: number;
}

export interface PairSynergy {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  // As partners
  partnerMatches: number;
  partnerWins: number;
  partnerLosses: number;
  partnerWinPct: number;
  // As opponents
  opponentMatches: number;
  p1WinsAgainstP2: number;
  p2WinsAgainstP1: number;
}

export interface PlayerChemistryInsights {
  player: Player;
  bestPartner: { player: Player; matches: number; wins: number; winPct: number } | null;
  toughestRival: { player: Player; matches: number; lossesAgainst: number; winPctAgainst: number } | null;
  favoriteOpponent: { player: Player; matches: number; winsAgainst: number; winPctAgainst: number } | null;
  totalPartnersCount: number;
  totalOpponentsCount: number;
}

/**
 * Computes deep Head-to-Head rivalry and partnership statistics between any two players.
 */
export function calculateHeadToHead(
  playerA: Player,
  playerB: Player,
  matches: Match[]
): HeadToHeadStats {
  const pAId = playerA.id;
  const pBId = playerB.id;

  const completedMatches = matches.filter(
    (m) => m.status === 'completed' && m.scoreA !== null && m.scoreB !== null
  );

  const matchesAsOpponents: Match[] = [];
  const matchesAsPartners: Match[] = [];

  let playerAWins = 0;
  let playerBWins = 0;
  let playerAPoints = 0;
  let playerBPoints = 0;
  let clutchGamesCount = 0;
  let clutchWinsA = 0;
  let clutchWinsB = 0;

  let partnerWins = 0;
  let partnerLosses = 0;
  let partnerPointsFor = 0;
  let partnerPointsAgainst = 0;

  // Track chronological matches for streak calculation (sorted oldest to newest)
  const chronoOpponentMatches = [...completedMatches]
    .filter((m) => {
      const aInTeamA = m.teamA.includes(pAId);
      const aInTeamB = m.teamB.includes(pAId);
      const bInTeamA = m.teamA.includes(pBId);
      const bInTeamB = m.teamB.includes(pBId);
      return (aInTeamA && bInTeamB) || (aInTeamB && bInTeamA);
    })
    .sort((a, b) => (a.confirmedAt || a.startTime) - (b.confirmedAt || b.startTime));

  chronoOpponentMatches.forEach((m) => {
    matchesAsOpponents.push(m);
    const aInTeamA = m.teamA.includes(pAId);
    const scoreA = m.scoreA ?? 0;
    const scoreB = m.scoreB ?? 0;

    const myScore = aInTeamA ? scoreA : scoreB;
    const oppScore = aInTeamA ? scoreB : scoreA;

    playerAPoints += myScore;
    playerBPoints += oppScore;

    const aWon = aInTeamA ? m.winnerTeam === 'teamA' : m.winnerTeam === 'teamB';
    if (aWon) {
      playerAWins++;
    } else {
      playerBWins++;
    }

    const margin = Math.abs(myScore - oppScore);
    if (margin <= 2) {
      clutchGamesCount++;
      if (aWon) clutchWinsA++;
      else clutchWinsB++;
    }
  });

  // Calculate current rivalry streak
  let currentStreakHolder: 'playerA' | 'playerB' | 'none' = 'none';
  let currentStreakCount = 0;

  if (chronoOpponentMatches.length > 0) {
    const reversed = [...chronoOpponentMatches].reverse();
    const lastMatch = reversed[0];
    const lastAInTeamA = lastMatch.teamA.includes(pAId);
    const lastAWon = lastAInTeamA
      ? lastMatch.winnerTeam === 'teamA'
      : lastMatch.winnerTeam === 'teamB';

    currentStreakHolder = lastAWon ? 'playerA' : 'playerB';
    currentStreakCount = 0;

    for (const match of reversed) {
      const aInA = match.teamA.includes(pAId);
      const aWon = aInA
        ? match.winnerTeam === 'teamA'
        : match.winnerTeam === 'teamB';
      const holderWon = currentStreakHolder === 'playerA' ? aWon : !aWon;

      if (holderWon) {
        currentStreakCount++;
      } else {
        break;
      }
    }
  }

  // Calculate Partnership matches
  completedMatches.forEach((m) => {
    const bothInA = m.teamA.includes(pAId) && m.teamA.includes(pBId);
    const bothInB = m.teamB.includes(pAId) && m.teamB.includes(pBId);

    if (bothInA || bothInB) {
      matchesAsPartners.push(m);
      const scoreA = m.scoreA ?? 0;
      const scoreB = m.scoreB ?? 0;
      const ourScore = bothInA ? scoreA : scoreB;
      const theirScore = bothInA ? scoreB : scoreA;

      partnerPointsFor += ourScore;
      partnerPointsAgainst += theirScore;

      const weWon = bothInA ? m.winnerTeam === 'teamA' : m.winnerTeam === 'teamB';
      if (weWon) {
        partnerWins++;
      } else {
        partnerLosses++;
      }
    }
  });

  const totalOpponentMatches = matchesAsOpponents.length;
  const partnerMatchesCount = matchesAsPartners.length;

  return {
    playerA,
    playerB,
    matchesAsOpponents,
    playerAWins,
    playerBWins,
    totalOpponentMatches,
    playerAPoints,
    playerBPoints,
    pointDiff: playerAPoints - playerBPoints,
    avgPointsA: totalOpponentMatches > 0 ? +(playerAPoints / totalOpponentMatches).toFixed(1) : 0,
    avgPointsB: totalOpponentMatches > 0 ? +(playerBPoints / totalOpponentMatches).toFixed(1) : 0,
    currentStreakHolder,
    currentStreakCount,
    clutchGamesCount,
    clutchWinsA,
    clutchWinsB,
    matchesAsPartners,
    partnerWins,
    partnerLosses,
    partnerWinPct:
      partnerMatchesCount > 0 ? Math.round((partnerWins / partnerMatchesCount) * 100) : 0,
    partnerPointsFor,
    partnerPointsAgainst,
    partnerPointDiff: partnerPointsFor - partnerPointsAgainst,
  };
}

/**
 * Computes player's best partner, toughest rival, and favorite opponent.
 */
export function getPlayerChemistryInsights(
  player: Player,
  allPlayers: Player[],
  matches: Match[]
): PlayerChemistryInsights {
  const otherPlayers = allPlayers.filter((p) => p.id !== player.id);
  const playersById = allPlayers.reduce<Record<string, Player>>((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  let bestPartner: { player: Player; matches: number; wins: number; winPct: number } | null = null;
  let toughestRival: { player: Player; matches: number; lossesAgainst: number; winPctAgainst: number } | null = null;
  let favoriteOpponent: { player: Player; matches: number; winsAgainst: number; winPctAgainst: number } | null = null;

  let totalPartnersCount = 0;
  let totalOpponentsCount = 0;

  otherPlayers.forEach((other) => {
    const h2h = calculateHeadToHead(player, other, matches);

    // Partner stats
    if (h2h.matchesAsPartners.length > 0) {
      totalPartnersCount++;
      const partnerMatches = h2h.matchesAsPartners.length;
      const partnerWins = h2h.partnerWins;
      const partnerWinPct = h2h.partnerWinPct;

      if (
        !bestPartner ||
        partnerWinPct > bestPartner.winPct ||
        (partnerWinPct === bestPartner.winPct && partnerMatches > bestPartner.matches)
      ) {
        bestPartner = {
          player: other,
          matches: partnerMatches,
          wins: partnerWins,
          winPct: partnerWinPct,
        };
      }
    }

    // Rival stats
    if (h2h.totalOpponentMatches > 0) {
      totalOpponentsCount++;
      const oppMatches = h2h.totalOpponentMatches;
      const winsAgainst = h2h.playerAWins;
      const lossesAgainst = h2h.playerBWins;
      const winPctAgainst = Math.round((winsAgainst / oppMatches) * 100);

      // Toughest rival: most losses or lowest win rate
      if (
        lossesAgainst > 0 &&
        (!toughestRival ||
          lossesAgainst > toughestRival.lossesAgainst ||
          (lossesAgainst === toughestRival.lossesAgainst && winPctAgainst < toughestRival.winPctAgainst))
      ) {
        toughestRival = {
          player: other,
          matches: oppMatches,
          lossesAgainst,
          winPctAgainst,
        };
      }

      // Favorite opponent: highest wins against
      if (
        winsAgainst > 0 &&
        (!favoriteOpponent ||
          winsAgainst > favoriteOpponent.winsAgainst ||
          (winsAgainst === favoriteOpponent.winsAgainst && winPctAgainst > favoriteOpponent.winPctAgainst))
      ) {
        favoriteOpponent = {
          player: other,
          matches: oppMatches,
          winsAgainst,
          winPctAgainst,
        };
      }
    }
  });

  return {
    player,
    bestPartner,
    toughestRival,
    favoriteOpponent,
    totalPartnersCount,
    totalOpponentsCount,
  };
}

/**
 * Computes duo pairings and chemistry across all players in the club/session.
 */
export function calculateAllPairsSynergy(
  players: Player[],
  matches: Match[]
): PairSynergy[] {
  const result: PairSynergy[] = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i];
      const p2 = players[j];
      const h2h = calculateHeadToHead(p1, p2, matches);

      if (h2h.matchesAsPartners.length > 0 || h2h.totalOpponentMatches > 0) {
        result.push({
          player1Id: p1.id,
          player2Id: p2.id,
          player1Name: p1.name,
          player2Name: p2.name,
          partnerMatches: h2h.matchesAsPartners.length,
          partnerWins: h2h.partnerWins,
          partnerLosses: h2h.partnerLosses,
          partnerWinPct: h2h.partnerWinPct,
          opponentMatches: h2h.totalOpponentMatches,
          p1WinsAgainstP2: h2h.playerAWins,
          p2WinsAgainstP1: h2h.playerBWins,
        });
      }
    }
  }

  return result;
}
