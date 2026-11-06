import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { WeeklyBars } from '../../components/charts/WeeklyBars';
import { Donut } from '../../components/charts/Donut';
import { MapView } from '../../components/map/MapView';
import { statsApi } from '../../api/stats';
import { apiClient } from '../../api/client';
import { LOCS, TODAY, MN, nf, fd } from '../../utils/format';
import { useDateFilter } from '../../store/dateFilterStore';

interface DashboardProps {
  onNavigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { selectedDate, selectedPreset } = useDateFilter();
  const overview = statsApi.getOverview(selectedDate, selectedPreset);
  const [selectedPin, setSelectedPin] = useState(0);
  const [isDonutAllTime, setIsDonutAllTime] = useState(false);

  const [y, m] = selectedDate.split('-').map(Number);
  const monthNameUz = MN[m - 1] ? MN[m - 1][0].toUpperCase() + MN[m - 1].slice(1) : '';

  const events = apiClient.getEvents();
  const pinEvents = events
    .filter(e => {
      if (e.loc !== selectedPin) return false;
      if (selectedPreset === 'month') {
        return e.date.slice(0, 7) === selectedDate.slice(0, 7);
      }
      return e.date === selectedDate;
    })
    .sort((a, b) => (a.time < b.time ? -1 : 1));

  return (
    <div>
      {/* 4 Asosiy Statistik Kartochka */}
      <section className="sg">
        <Card lift className="sc">
          <div className="ico" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d3df0)' }}>
            <Icon name="users" />
          </div>
          <div>
            <div className="sm">Jami foydalanuvchilar</div>
            <div className="v">{nf(overview.totalUsers)}</div>
          </div>
        </Card>

        <Card lift className="sc">
          <div className="ico" style={{ background: 'linear-gradient(135deg,#22c9a0,#0e9f8f)' }}>
            <Icon name="cal" />
          </div>
          <div>
            <div className="sm">Jami tadbirlar</div>
            <div className="v">{nf(overview.totalEvents)}</div>
          </div>
        </Card>

        <Card lift className="sc">
          <div className="ico" style={{ background: 'linear-gradient(135deg,#c084fc,#a855f7)' }}>
            <Icon name="user" />
          </div>
          <div>
            <div className="sm">Faol foydalanuvchilar</div>
            <div className="v">{nf(overview.activeParticipants)}</div>
          </div>
        </Card>

        <Card lift className="sc">
          <div className="ico" style={{ background: 'linear-gradient(135deg,#38bdf8,#2563eb)' }}>
            <Icon name="check" />
          </div>
          <div>
            <div className="sm">
              {selectedPreset === 'month'
                ? `${monthNameUz} oyi tadbirlari`
                : selectedDate === TODAY
                ? 'Bugungi tadbirlar'
                : `${fd(selectedDate)} tadbirlari`}
            </div>
            <div className="v">{overview.todayEvents}</div>
          </div>
        </Card>
      </section>

      {/* 3 Ustunli Vidjetlar Bo'limi */}
      <section className="c3">
        {/* 1. Haftalik Ro'yxatdan O'tganlar Ustunlari */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <h2 className="h">Haftalar bo‘yicha ro‘yxatdan o‘tgan yoshlar</h2>
            <div className="sm lgd">
              <span>
                <i className="dot" style={{ background: 'var(--pri)' }} />
                Ro‘yxatdan o‘tganlar
              </span>
            </div>
          </div>
          <WeeklyBars />
        </Card>

        {/* 2. Tadbirlar Turlari Taqsimoti */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 className="h" style={{ margin: 0 }}>Tadbirlar turlari</h2>
              <div className="sm" style={{ color: 'var(--mut)', marginTop: '2px', fontSize: '12px' }}>
                {isDonutAllTime
                  ? 'Platforma ishga tushgandan beri'
                  : selectedPreset === 'all'
                  ? 'Platforma ishga tushgandan beri'
                  : selectedPreset === 'month'
                  ? `${monthNameUz} oyi bo‘yicha`
                  : selectedPreset === 'year'
                  ? `${y} yil bo‘yicha`
                  : `${fd(selectedDate)} kuni bo‘yicha`}
              </div>
            </div>

            {/* Rejim almashtirgich (Segmented switcher) */}
            <div style={{ display: 'inline-flex', background: 'var(--soft)', padding: '2px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <button
                type="button"
                onClick={() => setIsDonutAllTime(false)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 0,
                  fontSize: '11.5px',
                  fontWeight: !isDonutAllTime ? 600 : 500,
                  cursor: 'pointer',
                  background: !isDonutAllTime ? 'var(--card)' : 'transparent',
                  color: !isDonutAllTime ? 'var(--pri)' : 'var(--mut)',
                  boxShadow: !isDonutAllTime ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Sana bo‘yicha
              </button>
              <button
                type="button"
                onClick={() => setIsDonutAllTime(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 0,
                  fontSize: '11.5px',
                  fontWeight: isDonutAllTime ? 600 : 500,
                  cursor: 'pointer',
                  background: isDonutAllTime ? 'var(--card)' : 'transparent',
                  color: isDonutAllTime ? 'var(--pri)' : 'var(--mut)',
                  boxShadow: isDonutAllTime ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Barchasi
              </button>
            </div>
          </div>
          <Donut forceAllTime={isDonutAllTime} />
        </Card>

        {/* 3. Yunusobod Xaritasi va Lokatsiyalari */}
        <Card>
          <h2 className="h">Yunusobod tumani lokatsiyalari</h2>
          <MapView
            selectedPin={selectedPin}
            onSelectPin={idx => setSelectedPin(idx)}
          />
          <div className="sm mp">
            <b>{LOCS[selectedPin].n}</b>
            <br />
            {selectedPreset === 'month'
              ? `${monthNameUz} oyida ${pinEvents.length} ta tadbir`
              : `${selectedDate === TODAY ? 'Bugun' : fd(selectedDate)} ${pinEvents.length} ta tadbir`}
            {pinEvents.length === 0 ? (
              <div className="sm" style={{ marginTop: '6px', opacity: 0.7 }}>
                {selectedPreset === 'month'
                  ? 'Ushbu oyda bu hududda tadbirlar rejalashtirilmagan'
                  : 'Bu sanada ushbu hududda tadbirlar yo‘q'}
              </div>
            ) : (
              pinEvents.slice(0, 4).map(e => (
                <a
                  key={e.id}
                  className="ml"
                  href={`#tadbir-${e.id}`}
                  onClick={ev => {
                    ev.preventDefault();
                    onNavigate(`tadbir-${e.id}`);
                  }}
                >
                  {e.time} · {e.title}
                </a>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
};
