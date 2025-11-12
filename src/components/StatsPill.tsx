'use client';

interface StatsPillProps {
  eventsCount: number;
  nodesCount: number;
  questsCount: number;
}

const StatsPill: React.FC<StatsPillProps> = ({ eventsCount, nodesCount, questsCount }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-[#ff4d6d] text-xs font-semibold shadow-lg">
      <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#ff4d6d] shadow-[0_0_8px_rgba(255,77,109,0.6)]"></span>
      <span>{eventsCount} Events</span>
      <span className="opacity-70">•</span>
      <span>{nodesCount} Nodes</span>
      <span className="opacity-70">•</span>
      <span>{questsCount} Quests</span>
    </div>
  );
};

export default StatsPill;
