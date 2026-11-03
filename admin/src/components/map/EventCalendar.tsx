import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { MN, pad, TODAY, fd } from '../../utils/format';

interface EventCalendarProps {
  onClose?: () => void;
  onNavigateToEvent?: (id: number) => void;
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ onNavigateToEvent }) => {
  const todayObj = new Date(TODAY);
  const [year, setYear] = useState(todayObj.getFullYear() || 2026);
  const [month, setMonth] = useState(isNaN(todayObj.getMonth()) ? 10 : todayObj.getMonth());
  const [selectedDate, setSelectedDate] = useState(TODAY);

  const events = apiClient.getEvents();

  // Day counts mapping
  const dayCounts: Record<string, number> = {};
  events.forEach(e => {
    dayCounts[e.date] = (dayCounts[e.date] || 0) + 1;
  });

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(prev => prev - 1);
    } else {
      setMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(prev => prev + 1);
    } else {
      setMonth(prev => prev + 1);
    }
  };

  const dayButtons = [];
  for (let i = 0; i < firstDay; i++) {
    dayButtons.push(<i key={`empty-${i}`} />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
    const count = dayCounts[dateKey] || 0;
    const isSelected = dateKey === selectedDate;
    const isToday = dateKey === TODAY;

    dayButtons.push(
      <button
        key={d}
        className={`cd ${isSelected ? 'sel' : ''} ${isToday ? 'td' : ''}`}
        onClick={() => setSelectedDate(dateKey)}
        aria-label={`${d}-${MN[month]}: ${count} ta tadbir`}
      >
        <span>{d}</span>
        <small>{count || ''}</small>
      </button>
    );
  }

  const selectedEvents = events
    .filter(e => e.date === selectedDate)
    .sort((a, b) => (a.time < b.time ? -1 : 1));

  return (
    <div className="pop cal" style={{ display: 'block' }}>
      <div className="chd">
        <button className="ib" onClick={handlePrevMonth} aria-label="Oldingi oy">
          ‹
        </button>
        <b>
          {MN[month][0].toUpperCase() + MN[month].slice(1)}, {year}
        </b>
        <button className="ib" onClick={handleNextMonth} aria-label="Keyingi oy">
          ›
        </button>
      </div>

      <div className="cg">
        {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(w => (
          <em key={w}>{w}</em>
        ))}
        {dayButtons}
      </div>

      <div className="sm cs">
        <b>{fd(selectedDate)}:</b> {selectedEvents.length} ta tadbir
      </div>

      <div className="cl">
        {selectedEvents.map(e => (
          <a
            key={e.id}
            href={`#tadbir-${e.id}`}
            onClick={ev => {
              if (onNavigateToEvent) {
                ev.preventDefault();
                onNavigateToEvent(e.id);
              }
            }}
          >
            <span>{e.time}</span>
            {e.title}
          </a>
        ))}
        {selectedEvents.length === 0 && (
          <div className="sm" style={{ padding: '8px' }}>
            Ushbu kunga tadbirlar rejalashtirilmagan
          </div>
        )}
      </div>
    </div>
  );
};

