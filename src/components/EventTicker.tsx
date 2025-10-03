'use client';

interface EventData {
  'Event Name': string;
  'Date & Time': string;
  Location: string;
  Latitude: string;
  Longitude: string;
  'Event URL'?: string;
}

interface EventTickerProps {
  events: EventData[];
  onEventClick?: (event: EventData) => void;
}

const EventTicker: React.FC<EventTickerProps> = ({ events, onEventClick }) => {
  if (!events || events.length === 0) return null;

  const formatted = events.map((e) => {
    const date = new Date(e['Date & Time']);
    const dateStr = isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const text = `${e['Event Name']}${dateStr ? ' • ' + dateStr : ''}`;
    return { text, event: e };
  });

  // Duplicate the list to achieve seamless infinite scroll
  const loopItems = [...formatted, ...formatted];

  return (
    <div className="event-ticker">
      <div className="event-ticker-viewport">
        <div className="event-ticker-track">
          {loopItems.map((item, idx) => (
            <span
              key={idx}
              className="event-ticker-item"
              onClick={() => onEventClick?.(item.event)}
            >
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventTicker;


