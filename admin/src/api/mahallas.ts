import { MH, LOCS } from '../utils/format';
import { apiClient } from './client';
import { MahallaStat } from '../types';

export const mahallasApi = {
  getStats: (
    sortBy: 'r' | 'k' | 'avg' = 'r',
    selectedDate?: string,
    selectedPreset?: string,
    forceAllTime: boolean = false
  ): (MahallaStat & { i: number; r: number; avg: number })[] => {
    const events = apiClient.getEvents();
    const monthPrefix = selectedDate ? selectedDate.slice(0, 7) : '';

    const data = MH.map((name, i) => {
      const mahallaEvents = events.filter(e => {
        if (e.loc !== i) return false;
        if (!forceAllTime && selectedDate && selectedPreset !== 'all') {
          if (selectedPreset === 'month') {
            return e.date.slice(0, 7) === monthPrefix;
          }
          if (selectedPreset === 'year') {
            return e.date.startsWith(selectedDate.slice(0, 4));
          }
          return e.date === selectedDate;
        }
        return true;
      });
      const r = mahallaEvents.reduce((acc, e) => acc + (e.going || 0), 0);
      const k = mahallaEvents.length;
      const avg = k > 0 ? Math.round(r / k) : 0;
      return {
        n: name,
        i,
        k,
        r,
        avg
      };
    });

    return data.sort((a, b) => b[sortBy] - a[sortBy]);
  }
};
