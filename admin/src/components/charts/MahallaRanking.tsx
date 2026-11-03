import React from 'react';
import { mahallasApi } from '../../api/mahallas';
import { nf } from '../../utils/format';
import { useDateFilter } from '../../store/dateFilterStore';

interface MahallaRankingProps {
  selectedPin?: number;
  onSelectMahalla?: (pinIndex: number) => void;
}

export const MahallaRanking: React.FC<MahallaRankingProps> = ({ selectedPin, onSelectMahalla }) => {
  const { selectedDate } = useDateFilter();
  const mahallas = mahallasApi.getStats('c', selectedDate);
  const maxC = Math.max(...mahallas.map(m => m.c), 1);

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget && onSelectMahalla) {
          onSelectMahalla(-1);
        }
      }}
    >
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {mahallas.map((x, i) => {
          const isSelected = selectedPin === x.i;
          return (
            <li
              key={x.n}
              style={{
                marginBottom: '10px',
                padding: '6px 10px',
                borderRadius: '10px',
                background: isSelected ? 'rgba(0, 188, 212, 0.12)' : 'transparent',
                border: isSelected ? '1px solid #00bcd4' : '1px solid transparent',
                cursor: onSelectMahalla ? 'pointer' : 'default',
                transition: 'all 0.2s ease'
              }}
              onClick={e => {
                e.stopPropagation();
                if (onSelectMahalla) {
                  onSelectMahalla(isSelected ? -1 : x.i);
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px', marginBottom: '4px' }}>
                <span>
                  <b style={{ color: isSelected ? '#00bcd4' : 'inherit' }}>{i + 1}.</b> {x.n} mahallasi
                </span>
                <span className="sm">
                  <b>{x.k} ta tadbir</b> · {nf(x.c)} kishi
                </span>
              </div>
              <div className="bar" role="img" aria-label={`${x.n}: ${x.c} kishi qatnashgan`}>
                <i
                  style={{
                    width: `${(x.c / maxC) * 100}%`,
                    background: isSelected ? '#00bcd4' : i < 2 ? '#22c9a0' : i >= mahallas.length - 2 ? '#f59e0b' : '#8b5cf6',
                    animationDelay: `${i * 0.08}s`
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <div className="sm" style={{ marginTop: '8px' }}>
        Yashil — eng faol, to‘q sariq — e’tibor talab qiladi. Yangi tadbir qo‘shilganda mahalla reytingi avtomatik oshadi.
      </div>
    </div>
  );
};

