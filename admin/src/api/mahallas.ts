import { MH, LOCS, TODAY } from '../utils/format';
import { apiClient } from './client';
import { MahallaStat } from '../types';

export const mahallasApi = {
  getStats: (sortBy: 'c' | 'p' | 'k' = 'c', _selectedDate?: string): (MahallaStat & { i: number; r: number; p: number })[] => {
    const events = apiClient.getEvents();
    const data = MH.map((name, i) => {
      const mahallaEvents = events.filter(e => e.loc === i);
      const r = mahallaEvents.reduce((acc, e) => acc + (e.going || 35), 0);
      const c = mahallaEvents.reduce((acc, e) => acc + (e.came || Math.round((e.going || 35) * 0.75)), 0);
      const p = r ? Math.round((c / r) * 100) : 0;
      return {
        n: name,
        i,
        k: mahallaEvents.length,
        r,
        c,
        p
      };
    });

    return data.sort((a, b) => b[sortBy] - a[sortBy]);
  }
};

