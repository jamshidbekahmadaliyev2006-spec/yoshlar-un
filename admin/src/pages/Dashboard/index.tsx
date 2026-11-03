import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { WeeklyBars } from '../../components/charts/WeeklyBars';
import { Donut } from '../../components/charts/Donut';
import { MapView } from '../../components/map/MapView';
import { statsApi } from '../../api/stats';
import { apiClient } from '../../api/client';
import { LOCS, TODAY, nf, fd } from '../../utils/format';
import { useDateFilter } from '../../store/dateFilterStore';

interface DashboardProps {
  onNavigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { selectedDate } = useDateFilter();
  const overview = statsApi.getOverview(selectedDate);
  const [selectedPin, setSelectedPin] = useState(0);

  const events = apiClient.getEvents();
  const pinEvents = events
    .filter(e => e.loc === selectedPin && e.date === selectedDate)
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
            <div className="up">
              ↑ {overview.usersGrowthPct}% <span className="sm" style={{ fontWeight: 400 }}>o‘tgan oyga nisbatan</span>
            </div>
          </div>
        </Card>

        <Card lift className="sc">
          <div className="ico" style={{ background: 'linear-gradient(135deg,#22c9a0,#0e9f8f)' }}>
            <Icon name="cal" />
          </div>
          <div>
            <div className="sm">Jami tadbirlar</div>
            <div className="v">{nf(overview.totalEvents)}</div>
            <div className="up">
              ↑ 14% <span className="sm" style={{ fontWeight: 400 }}>o‘tgan oyga nisbatan</span>
            </div>
          </div>
        </Card>

        <Card lift className="sc">
          <div className="ico" style={{ background: 'linear-gradient(135deg,#c084fc,#a855f7)' }}>
            <Icon name="user" />
          </div>
          <div>
            <div className="sm">Faol foydalanuvchilar</div>
            <div className="v">{nf(overview.activeParticipants)}</div>
            <div className="up">
              Faollik darajasi: {overview.activePct}%
            </div>
          </div>
        </Card>

        <Card lift className="sc">
          <div className="ico" style={{ background: 'linear-gradient(135deg,#38bdf8,#2563eb)' }}>
            <Icon name="check" />
          </div>
          <div>
            <div className="sm">
              {selectedDate === TODAY ? 'Bugungi tadbirlar' : `${fd(selectedDate)} tadbirlari`}
            </div>
            <div className="v">{overview.todayEvents}</div>
            <div className="up" style={{ color: overview.diffPct >= 0 ? '#10b981' : '#ef4444' }}>
              {overview.diffPct >= 0 ? `↑ ${overview.diffPct}%` : `↓ ${Math.abs(overview.diffPct)}%`}{' '}
              <span className="sm" style={{ fontWeight: 400 }}>kechagi kunga nisbatan</span>
            </div>
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
          <h2 className="h">Tadbirlar turlari</h2>
          <Donut />
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
            {selectedDate === TODAY ? 'Bugun' : fd(selectedDate)} {pinEvents.length} ta tadbir
            {pinEvents.length === 0 ? (
              <div className="sm" style={{ marginTop: '6px', opacity: 0.7 }}>Bu sanada ushbu hududda tadbirlar yo‘q</div>
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

