import { useMemo } from 'react';
import { statsApi } from '../api/stats';

export function useStats() {
  const overview = useMemo(() => statsApi.getOverview(), []);
  const weekly = useMemo(() => statsApi.getWeeklyBars(), []);
  const donut = useMemo(() => statsApi.getDonutData(), []);

  return { overview, weekly, donut };
}

