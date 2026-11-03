import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { MapView } from '../../components/map/MapView';
import { MahallaRanking } from '../../components/charts/MahallaRanking';
import { mahallasApi } from '../../api/mahallas';
import { apiClient } from '../../api/client';
import { LOCS, MH, nf, fd } from '../../utils/format';
import { useDateFilter } from '../../store/dateFilterStore';

interface MahallaPageProps {
  onNavigate?: (route: string) => void;
}

export const MahallaPage: React.FC<MahallaPageProps> = ({ onNavigate }) => {
  const { selectedDate } = useDateFilter();
  const [selectedPin, setSelectedPin] = useState(-1);
  const [sortBy, setSortBy] = useState<'c' | 'p' | 'k'>('c');

  const mahallas = mahallasApi.getStats(sortBy, selectedDate);
  const events = apiClient.getEvents();

  const isAll = selectedPin < 0 || selectedPin >= LOCS.length;
  const selectedMahalla = !isAll ? mahallas.find(m => m.i === selectedPin) : null;
  const totalEventsCount = events.length;
  const totalParticipants = mahallas.reduce((sum, m) => sum + m.c, 0);
  const avgAttendance = Math.round(
    mahallas.reduce((sum, m) => sum + m.p, 0) / (mahallas.length || 1)
  );

  const displayEvents = !isAll
    ? events.filter(e => e.loc === selectedPin).sort((a, b) => b.date.localeCompare(a.date))
    : events.slice().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      onClick={e => {
        // Bo'sh joyga bosilganda umumiy holatga qaytish
        if (e.target === e.currentTarget) {
          setSelectedPin(-1);
        }
      }}
    >
      {/* Yuqori 2 ta Asosiy Blok: Faollik Reytingi va Yunusobod Xaritasi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
        {/* 1. Mahallalar Bo'yicha Faollik Reytingi (Chap tomonda) */}
        <Card
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedPin(-1);
          }}
        >
          <div style={{ marginBottom: '14px' }}>
            <h2 className="h" style={{ margin: 0 }}>Mahallalar bo‘yicha faollik</h2>
            <div className="sm" style={{ marginTop: '2px' }}>Tadbirlar va ishtirokchilar qamrovi</div>
          </div>

          <MahallaRanking
            selectedPin={selectedPin}
            onSelectMahalla={idx => setSelectedPin(idx)}
          />
        </Card>

        {/* 2. Yunusobod Tumani Xaritasi (O'ng tomonda) */}
        <Card
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedPin(-1);
          }}
        >
          <div style={{ marginBottom: '14px' }}>
            <h2 className="h" style={{ margin: 0 }}>Yunusobod tumani xaritasi</h2>
            <div className="sm" style={{ marginTop: '2px' }}>Mahallani tanlash uchun nuqtani bosing</div>
          </div>

          <MapView
            selectedPin={selectedPin}
            onSelectPin={idx => setSelectedPin(idx)}
          />

          {/* Tanlangan Mahalla yoki Umumiy Yunusobod Ko'rsatkichi */}
          <div className="sm mp" style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <b style={{ fontSize: '15px', color: 'var(--tx)' }}>
                  {!isAll ? `${MH[selectedPin]} mahallasi` : 'Yunusobod tumani'}
                </b>
                <div style={{ color: 'var(--mut)', marginTop: '2px' }}>
                  {!isAll ? LOCS[selectedPin].n : 'Barcha 64 ta mahalla bo‘yicha umumiy ma’lumot'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isAll && (
                  <button
                    type="button"
                    className="cbt"
                    style={{ fontSize: '12px', color: 'var(--mut)', cursor: 'pointer', padding: '2px 6px' }}
                    onClick={() => setSelectedPin(-1)}
                    title="Barcha mahallalarga qaytish"
                  >
                    ✕ Umumiy holat
                  </button>
                )}
                <span className="pill s0" style={{ cursor: 'default' }}>
                  {!isAll
                    ? `${selectedMahalla ? selectedMahalla.k : 0} ta tadbir`
                    : `${totalEventsCount} ta umumiy tadbir`}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
              <div>
                <div className="sm">Jami tadbirlar</div>
                <b style={{ fontSize: '16px', color: 'var(--tx)' }}>
                  {!isAll ? (selectedMahalla?.k || 0) : totalEventsCount} ta
                </b>
              </div>
              <div>
                <div className="sm">Qatnashganlar</div>
                <b style={{ fontSize: '16px', color: 'var(--tx)' }}>
                  {nf(!isAll ? (selectedMahalla?.c || 0) : totalParticipants)}
                </b>
              </div>
              <div>
                <div className="sm">{!isAll ? 'Davomat' : 'O‘rtacha davomat'}</div>
                <b style={{ fontSize: '16px', color: '#00bcd4' }}>
                  {!isAll ? (selectedMahalla?.p || 0) : avgAttendance}%
                </b>
              </div>
            </div>

            {/* Mahalladagi Tadbirlar Ro'yxati */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
              <div className="sm" style={{ fontWeight: 600, marginBottom: '6px' }}>
                {!isAll
                  ? `Ushbu mahallaga biriktirilgan tadbirlar (${displayEvents.length}):`
                  : `Yunusobod tumanidagi so‘nggi tadbirlar (${displayEvents.length}):`}
              </div>
              {displayEvents.length === 0 ? (
                <div className="sm" style={{ opacity: 0.7 }}>Hozircha tadbirlar yo‘q</div>
              ) : (
                displayEvents.slice(0, 3).map(e => (
                  <a
                    key={e.id}
                    className="ml"
                    href={`#tadbir-${e.id}`}
                    onClick={ev => {
                      ev.preventDefault();
                      if (onNavigate) onNavigate(`tadbir-${e.id}`);
                    }}
                  >
                    {fd(e.date)} · {e.time} — {e.title} {isAll && <span className="sm" style={{ opacity: 0.75 }}>({MH[e.loc] || 'Yunusobod'})</span>}
                  </a>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Pastki Katta Blok: Batafsil Ko'rsatkichlar Jadvali */}
      <Card>
        <div className="tool" style={{ margin: '0 0 16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 className="h" style={{ margin: 0 }}>Batafsil ko‘rsatkichlar jadvali</h2>
            <div className="sm" style={{ marginTop: '2px' }}>
              Mahallalar kesimida tadbirlar soni, aholi qamrovi va ishtirok darajasi
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--mut)', fontWeight: 500 }}>Saralash:</span>
            <select
              className="tb-filter-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'c' | 'p' | 'k')}
              aria-label="Saralash"
            >
              <option value="c">Qatnashganlar soni bo‘yicha</option>
              <option value="k">Tadbirlar soni bo‘yicha</option>
              <option value="p">Kelish foizi bo‘yicha</option>
            </select>
          </div>
        </div>

        <div className="ov">
          <table className="tb">
            <thead>
              <tr>
                <th>№</th>
                <th>Mahalla nomi</th>
                <th>Lokatsiya manzili</th>
                <th>Tadbirlar soni</th>
                <th>Ro‘yxatdan o‘tgan</th>
                <th>Kelganlar</th>
                <th>Kelish darajasi</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {mahallas.map((x, i) => {
                const isSelected = selectedPin === x.i;
                const pillCls = x.p >= 75 ? 's0' : x.p >= 65 ? 's1' : 's2';
                return (
                  <tr
                    key={x.n}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(0, 188, 212, 0.08)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                    onClick={() => setSelectedPin(isSelected ? -1 : x.i)}
                  >
                    <td>
                      <b style={{ color: isSelected ? '#00bcd4' : 'inherit' }}>{i + 1}</b>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isSelected && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00bcd4' }} />}
                        <b>{x.n} mahallasi</b>
                      </div>
                    </td>
                    <td>
                      <span className="sm">{LOCS[x.i].n}</span>
                    </td>
                    <td>
                      <b style={{ color: '#00bcd4' }}>{x.k} ta tadbir</b>
                    </td>
                    <td>{nf(x.r)} kishi</td>
                    <td>
                      <b>{nf(x.c)} kishi</b>
                    </td>
                    <td>
                      <span className={`pill ${pillCls}`} style={{ cursor: 'default' }}>
                        {x.p}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {onNavigate && (
                        <button
                          type="button"
                          className="bt g"
                          style={{ height: '30px', padding: '0 10px', fontSize: '11.5px' }}
                          onClick={e => {
                            e.stopPropagation();
                            onNavigate(`tadbir-qoshish?loc=${x.i}`);
                          }}
                        >
                          + Tadbir qo‘shish
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
