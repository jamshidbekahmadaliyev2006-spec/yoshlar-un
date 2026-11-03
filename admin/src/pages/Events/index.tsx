import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { eventsApi } from '../../api/events';
import { TYPES, COL, LOCS, fd } from '../../utils/format';
import { useDateFilter } from '../../store/dateFilterStore';

interface EventsPageProps {
  onNavigate: (route: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onNavigate }) => {
  const { selectedDate } = useDateFilter();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [filterByDate, setFilterByDate] = useState(true);
  const [limit, setLimit] = useState(12);

  const registered = eventsApi.getRegistered();
  const rawEvents = eventsApi.getAll(query, type);
  const events = filterByDate
    ? rawEvents.filter(e => e.date === selectedDate)
    : rawEvents;
  const visibleEvents = events.slice(0, limit);

  return (
    <div>
      {/* Yuqori Vositalar Paneli */}
      <div className="card tool">
        <label className="srch">
          <Icon name="search" />
          <input
            id="eq"
            type="search"
            aria-label="Tadbir qidirish"
            placeholder="Tadbir nomi yoki joyi..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setLimit(12);
            }}
            autoComplete="off"
          />
        </label>

        <select
          id="et"
          className="in"
          style={{ width: '200px' }}
          value={type}
          onChange={e => {
            setType(e.target.value);
            setLimit(12);
          }}
          aria-label="Tur"
        >
          <option value="">Barcha turlar</option>
          {TYPES.map((t, i) => (
            <option key={t} value={i}>
              {t}
            </option>
          ))}
        </select>

        <button
          className={`bt ${filterByDate ? '' : 'g'}`}
          onClick={() => {
            setFilterByDate(!filterByDate);
            setLimit(12);
          }}
          style={{ height: '42px', padding: '0 16px', gap: '8px' }}
          title={filterByDate ? 'Barcha sanalarni ko‘rsatish' : `Faqat ${fd(selectedDate)} tadbirlarini ko‘rsatish`}
        >
          <Icon name="cal" />
          <span>{filterByDate ? fd(selectedDate) : 'Barcha sanalar'}</span>
        </button>

        <button
          className="bt"
          onClick={() => onNavigate('tadbir-qoshish')}
        >
          <Icon name="plus" /> Tadbir qo‘shish
        </button>
      </div>

      <div className="sm" style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>{events.length} ta tadbir topildi</span>
        {filterByDate && (
          <span style={{ color: 'var(--pri)', fontWeight: 600 }}>
            · {fd(selectedDate)} sanasi bo‘yicha
          </span>
        )}
      </div>

      {/* Tadbirlar Kartochkalari To'plami */}
      <div className="eg">
        {visibleEvents.map((e, i) => {
          const isReg = registered.includes(e.id);
          const totalGoing = e.going;
          return (
            <a
              key={e.id}
              className="card ev an"
              style={{ animationDelay: `${Math.min(i, 11) * 0.04}s` }}
              href={`#tadbir-${e.id}`}
              onClick={ev => {
                ev.preventDefault();
                onNavigate(`tadbir-${e.id}`);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span className="tag">
                  <i className="dot" style={{ background: COL[e.t] }} />
                  {TYPES[e.t]}
                </span>
                <span className="sm">{e.time}</span>
              </div>

              <h3 style={{ margin: '12px 0 8px', fontSize: '15px' }}>{e.title}</h3>

              <div className="ir sm">
                <Icon name="cal" />
                {fd(e.date, true)}
              </div>
              <div className="ir sm">
                <Icon name="pin" />
                {LOCS[e.loc]?.n}
              </div>
              <div className="ir sm">
                <Icon name="users" />
                {totalGoing} kishi yozilgan
              </div>
            </a>
          );
        })}

        {visibleEvents.length === 0 && (
          <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>
            Hech narsa topilmadi
          </Card>
        )}
      </div>

      {events.length > limit && (
        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <button className="bt g" onClick={() => setLimit(prev => prev + 12)}>
            Yana ko‘rsatish
          </button>
        </div>
      )}
    </div>
  );
};

