import { MH, LOCS } from '../utils/format';
import { apiClient } from './client';
import { MahallaStat } from '../types';

export const mahallasApi = {
  getStats: (sortBy: 'r' | 'k' | 'avg' = 'r', _selectedDate?: string): (MahallaStat & { i: number; r: number; avg: number })[] => {
    const events = apiClient.getEvents();
    const data = MH.map((name, i) => {
      const mahallaEvents = events.filter(e => e.loc === i);
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
