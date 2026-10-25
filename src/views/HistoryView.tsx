import React, { useState } from 'react';
import { Match, Player } from '../types';
import { DEFAULT_PLAYER_AVATAR } from '../engine/config';
import {
  Trophy,
  MapPin,
  Search,
  SlidersHorizontal,
  Clock,
  ChevronRight,
  Download,
} from 'lucide-react';

interface HistoryViewProps {
  matches: Match[];
  playersById: Record<string, Player>;
  activeMatches?: Match[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  matches,
  playersById,
  activeMatches = [],
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'ongoing'>('history');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'lose'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const completedMatches = [...matches]
    .filter((m) => m.status === 'completed')
    .sort((a, b) => (b.confirmedAt || b.startTime) - (a.confirmedAt || a.startTime));

  const getPlayer = (id: string): Player => {
    return (
      playersById[id] || {
        id,
        name: 'Player',
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
      }
    );
  };

  const currentMatchList = activeTab === 'history' ? completedMatches : activeMatches;

  const filteredMatches = currentMatchList.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const names = [...m.teamA, ...m.teamB]
        .map((id) => getPlayer(id).name.toLowerCase())
        .join(' ');
      if (!names.includes(q)) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (completedMatches.length === 0) return;
    const headers = ['Match #', 'Court', 'Team 1 Players', 'Team 2 Players', 'Team 1 Score', 'Team 2 Score', 'Winner', 'Timestamp'];
    const rows = completedMatches.map((m) => {
      const t1 = m.teamA.map((id) => getPlayer(id).name).join(' & ');
      const t2 = m.teamB.map((id) => getPlayer(id).name).join(' & ');
      const s1 = m.scoreA ?? 0;
      const s2 = m.scoreB ?? 0;
      const winner = m.winnerTeam === 'teamA' ? 'Team 1' : m.winnerTeam === 'teamB' ? 'Team 2' : 'Tie';
      const time = new Date(m.confirmedAt || m.startTime).toLocaleString();
      return [
        m.matchNumber,
        `"${m.courtName || `Court ${m.courtNumber}`}"`,
        `"${t1}"`,
        `"${t2}"`,
        s1,
        s2,
        `"${winner}"`,
        `"${time}"`,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `picklematch-session-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <Clock className="w-6 h-6 text-[#0F382C]" />
            <span>Match History & Activity</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed record of completed doubles games, scores, and matchups
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Toggle: History | In Progress */}
          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <button
              onClick={() => setActiveTab('history')}
              className={`touch-target px-3 py-1 rounded-lg transition ${
                activeTab === 'history'
                  ? 'bg-[#0F382C] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedMatches.length})
            </button>
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`touch-target px-3 py-1 rounded-lg transition ${
                activeTab === 'ongoing'
                  ? 'bg-[#0F382C] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live ({activeMatches.length})
            </button>
          </div>

          {/* Export CSV Button */}
          {completedMatches.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="touch-target px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#0F382C] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
              title="Export all match results to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter matches by player name..."
          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0F382C] focus:ring-1 focus:ring-[#0F382C] transition shadow-2xs"
        />
      </div>

      {/* Match Cards Grid */}
      {filteredMatches.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200/90 text-xs text-slate-400">
          No matches found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const team1 = match.teamA.map(getPlayer);
            const team2 = match.teamB.map(getPlayer);
            const isWinnerA = match.winnerTeam === 'teamA';
            const isWinnerB = match.winnerTeam === 'teamB';

            return (
              <div
                key={match.id}
                className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs space-y-3 flex flex-col justify-between"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <span className="font-bold text-slate-900">
                      Match #{match.matchNumber}
                    </span>
                    <span>·</span>
                    <span>{match.courtName || `Court ${match.courtNumber}`}</span>
                  </div>

                  {match.status === 'completed' ? (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-emerald-600" />
                      <span>Final</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  )}
                </div>

                {/* Teams & Scores */}
                <div className="space-y-2">
                  {/* Team 1 */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-xl transition ${
                      isWinnerA ? 'bg-emerald-50/70 border border-emerald-100' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-slate-400 w-4">
                        T1
                      </span>
                      <div className="flex -space-x-1.5 shrink-0">
                        {team1.map((p) => (
                          <div
                            key={p.id}
                            className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center font-bold text-xs text-slate-700 overflow-hidden"
                          >
                            <img
                              src={p.avatar || DEFAULT_PLAYER_AVATAR}
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
                              }}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <span
                        className={`text-xs truncate ${
                          isWinnerA ? 'font-bold text-slate-900' : 'text-slate-600'
                        }`}
                      >
                        {team1.map((p) => p.name).join(' & ')}
                      </span>
                    </div>

                    <span
                      className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ml-2 ${
                        isWinnerA
                          ? 'bg-[#0F382C] text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {match.scoreA !== null ? match.scoreA : '-'}
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-xl transition ${
                      isWinnerB ? 'bg-emerald-50/70 border border-emerald-100' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-slate-400 w-4">
                        T2
                      </span>
                      <div className="flex -space-x-1.5 shrink-0">
                        {team2.map((p) => (
                          <div
                            key={p.id}
                            className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center font-bold text-xs text-slate-700 overflow-hidden"
                          >
                            <img
                              src={p.avatar || DEFAULT_PLAYER_AVATAR}
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
                              }}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <span
                        className={`text-xs truncate ${
                          isWinnerB ? 'font-bold text-slate-900' : 'text-slate-600'
                        }`}
                      >
                        {team2.map((p) => p.name).join(' & ')}
                      </span>
                    </div>

                    <span
                      className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ml-2 ${
                        isWinnerB
                          ? 'bg-[#0F382C] text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {match.scoreB !== null ? match.scoreB : '-'}
                    </span>
                  </div>
                </div>

                {/* Recommendation Reason note if available */}
                {match.explanation && (
                  <div className="text-[11px] text-slate-500 bg-slate-50/70 px-2.5 py-1.5 rounded-lg border border-slate-100 truncate">
                    Reason: {match.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
