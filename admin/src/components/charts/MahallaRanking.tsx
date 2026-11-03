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
  const mahallas = mahallasApi.getStats('r', selectedDate);
  const maxR = Math.max(...mahallas.map(m => m.r), 1);

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
                background: isSelected ? 'var(--soft)' : 'transparent',
                border: isSelected ? '1px solid var(--pri)' : '1px solid transparent',
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
                  <b style={{ color: isSelected ? 'var(--pri)' : 'inherit' }}>{i + 1}.</b> {x.n} mahallasi
                </span>
                <span className="sm">
                  <b>{x.k} ta tadbir</b> · {nf(x.r)} nafar yozilgan
                </span>
              </div>
              <div className="bar" role="img" aria-label={`${x.n}: ${x.r} nafar yoshlar ro‘yxatdan o‘tgan`}>
                <i
                  style={{
                    width: `${(x.r / maxR) * 100}%`,
                    background: isSelected ? 'var(--pri)' : i < 2 ? '#22c9a0' : i >= mahallas.length - 2 ? '#f59e0b' : '#8b5cf6',
                    animationDelay: `${i * 0.08}s`
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <div className="sm" style={{ marginTop: '8px' }}>
        Mahallalar reytingi: Yangi tadbirlar va ro‘yxatdan o‘tgan yoshlar soni real vaqt rejimida hisoblab boriladi.
      </div>
    </div>
  );
};
