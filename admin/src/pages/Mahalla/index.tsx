import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { MapView } from '../../components/map/MapView';
import { MahallaRanking } from '../../components/charts/MahallaRanking';
import { mahallasApi } from '../../api/mahallas';
import { apiClient } from '../../api/client';
import { LOCS, MH, nf } from '../../utils/format';
import { useDateFilter } from '../../store/dateFilterStore';

interface MahallaPageProps {
  onNavigate?: (route: string) => void;
}

const SORT_OPTIONS: { value: 'r' | 'k' | 'avg'; label: string }[] = [
  { value: 'r', label: 'Ro‘yxatdan o‘tgan yoshlar soni bo‘yicha' },
  { value: 'k', label: 'Tadbirlar soni bo‘yicha' },
  { value: 'avg', label: 'O‘rtacha qamrov bo‘yicha' }
];

export const MahallaPage: React.FC<MahallaPageProps> = ({ onNavigate }) => {
  const { selectedDate, selectedPreset } = useDateFilter();
  const [selectedPin, setSelectedPin] = useState(-1);
  const [sortBy, setSortBy] = useState<'r' | 'k' | 'avg'>('r');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || SORT_OPTIONS[0].label;

  const mahallas = mahallasApi.getStats(sortBy, selectedDate, selectedPreset);
  const events = apiClient.getEvents();

  const isAll = selectedPin < 0 || selectedPin >= LOCS.length;
  const selectedMahalla = !isAll ? mahallas.find(m => m.i === selectedPin) : null;
  const totalEventsCount = events.length;
  const totalRegistered = mahallas.reduce((sum, m) => sum + m.r, 0);
  const avgPerEvent = totalEventsCount > 0 ? Math.round(totalRegistered / totalEventsCount) : 0;

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
            <div className="sm" style={{ marginTop: '2px' }}>Tadbirlar va ro‘yxatdan o‘tgan yoshlar qamrovi</div>
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
                <div className="sm">Ro‘yxatdan o‘tganlar</div>
                <b style={{ fontSize: '16px', color: 'var(--tx)' }}>
                  {nf(!isAll ? (selectedMahalla?.r || 0) : totalRegistered)} nafar
                </b>
              </div>
              <div>
                <div className="sm">O‘rtacha qamrov</div>
                <b style={{ fontSize: '16px', color: 'var(--pri)' }}>
                  {!isAll ? (selectedMahalla?.avg || 0) : avgPerEvent} nafar / tadbir
                </b>
              </div>
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
              Mahallalar kesimida tadbirlar soni va ro‘yxatdan o‘tgan yoshlar qamrovi
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--mut)', fontWeight: 500 }}>Saralash:</span>
            <div className="custom-select-wrap" ref={sortRef}>
              <button
                type="button"
                className="custom-select-btn"
                onClick={() => setIsSortOpen(prev => !prev)}
                aria-expanded={isSortOpen}
              >
                <span>{currentSortLabel}</span>
              </button>

              {isSortOpen && (
                <div className="custom-select-menu" role="listbox">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      type="button"
                      key={opt.value}
                      className={`custom-select-item ${sortBy === opt.value ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(opt.value);
                        setIsSortOpen(false);
                      }}
                      role="option"
                      aria-selected={sortBy === opt.value}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.value && <Icon name="check" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                <th>Ro‘yxatdan o‘tgan yoshlar</th>
                <th>O‘rtacha qamrov</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {mahallas.map((x, i) => {
                const isSelected = selectedPin === x.i;
                return (
                  <tr
                    key={x.n}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--soft)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                    onClick={() => setSelectedPin(isSelected ? -1 : x.i)}
                  >
                    <td>
                      <b style={{ color: isSelected ? 'var(--pri)' : 'inherit' }}>{i + 1}</b>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isSelected && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--pri)' }} />}
                        <b>{x.n} mahallasi</b>
                      </div>
                    </td>
                    <td>
                      <span className="sm">{LOCS[x.i].n}</span>
                    </td>
                    <td>
                      <b style={{ color: 'var(--pri)' }}>{x.k} ta tadbir</b>
                    </td>
                    <td>
                      <b>{nf(x.r)} nafar</b>
                    </td>
                    <td>
                      <span className="pill s0" style={{ cursor: 'default' }}>
                        ~{x.avg} nafar / tadbir
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
