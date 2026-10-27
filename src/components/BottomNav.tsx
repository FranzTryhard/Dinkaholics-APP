import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Users,
  History,
  Trophy,
  Award,
} from 'lucide-react';

export type TabType = 'dashboard' | 'courts' | 'tournament' | 'players' | 'leaderboard' | 'history' | 'settings';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  waitingCount: number;
  activeMatchesCount: number;
  onOpenCreateMatch?: () => void;
  onOpenAddPlayer?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  waitingCount,
  activeMatchesCount,
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'courts' as TabType,
      label: 'Courts',
      icon: Layers,
      badge: activeMatchesCount > 0 ? activeMatchesCount : undefined,
    },
    {
      id: 'tournament' as TabType,
      label: 'Bracket',
      icon: Trophy,
    },
    {
      id: 'players' as TabType,
      label: 'Players',
      icon: Users,
      badge: waitingCount > 0 ? waitingCount : undefined,
    },
    {
      id: 'leaderboard' as TabType,
      label: 'Ranks',
      icon: Award,
    },
    {
      id: 'history' as TabType,
      label: 'Logs',
      icon: History,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E0E7E4] px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-lg select-none">
      <div className="max-w-lg mx-auto grid grid-cols-6 gap-0.5 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`min-h-[44px] py-1 flex flex-col items-center justify-center relative rounded-xl transition ${
                isActive ? 'text-[#103F32] font-bold' : 'text-[#64748B] hover:text-[#172033]'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold font-mono tabular-nums flex items-center justify-center ${
                      isActive ? 'bg-[#35D879] text-[#0A2B22]' : 'bg-[#E0E7E4] text-[#172033]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#35D879] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
