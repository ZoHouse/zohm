'use client';

import { PartnerNodeRecord } from '@/lib/supabase';

interface NodeTickerProps {
  nodes: PartnerNodeRecord[];
  onNodeClick?: (node: PartnerNodeRecord) => void;
}

const NodeTicker: React.FC<NodeTickerProps> = ({ nodes, onNodeClick }) => {
  if (!nodes || nodes.length === 0) return null;

  const items = nodes.map((n) => {
    const location = [n.city, n.country].filter(Boolean).join(', ');
    const text = `${n.name}${location ? ' • ' + location : ''}`;
    const url = n.website || n.twitter || undefined;
    return { text, url };
  });

  const loopItems = [...items, ...items, ...items, ...items];

  return (
    <div className="event-ticker">
      <div className="event-ticker-viewport node-ticker">
        <div className="event-ticker-track">
          {loopItems.map((item, idx) => (
            <span
              key={idx}
              className="event-ticker-item"
              onClick={() => onNodeClick?.(nodes[idx % nodes.length])}
            >
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NodeTicker;


