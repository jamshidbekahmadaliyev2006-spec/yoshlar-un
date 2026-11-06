import { useSyncExternalStore } from 'react';
import { TODAY, pad } from '../utils/format';

export interface DateFilterState {
  selectedDate: string; // "YYYY-MM-DD"
  selectedTime: string; // "HH:mm"
  selectedPreset: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
  startDate: string;    // "YYYY-MM-DD"
  endDate: string;      // "YYYY-MM-DD"
}

let state: DateFilterState = {
  selectedDate: TODAY,
  selectedTime: '00:00',
  selectedPreset: 'today',
  startDate: TODAY,
  endDate: TODAY
};

const listeners = new Set<() => void>();

export const dateFilterStore = {
  getState: () => state,

  setDate: (date: string, time?: string, preset?: DateFilterState['selectedPreset']) => {
    state = {
      selectedDate: date,
      selectedTime: time !== undefined ? time : state.selectedTime,
      selectedPreset: preset || 'custom',
      startDate: date,
      endDate: date
    };
    listeners.forEach(l => l());
  },

  setDateRange: (
    startDate: string,
    endDate: string,
    selectedDate?: string,
    preset?: DateFilterState['selectedPreset']
  ) => {
    state = {
      selectedDate: selectedDate || startDate,
      selectedTime: state.selectedTime,
      selectedPreset: preset || 'custom',
      startDate,
      endDate
    };
    listeners.forEach(l => l());
  },

  setTime: (time: string) => {
    state = {
      ...state,
      selectedTime: time
    };
    listeners.forEach(l => l());
  },

  setPreset: (preset: DateFilterState['selectedPreset'], customYear?: number, customMonth?: number) => {
    const todayParts = TODAY.split('-').map(Number);
    const initialYear = customYear ?? (todayParts[0] || 2026);
    const initialMonth = customMonth !== undefined ? customMonth : ((todayParts[1] || 11) - 1);
    const initialDay = todayParts[2] || 2;

    let targetDate = TODAY;
    let sDate = TODAY;
    let eDate = TODAY;

    if (preset === 'all') {
      targetDate = TODAY;
      sDate = '2026-01-01';
      eDate = TODAY;
    } else if (preset === 'today') {
      targetDate = TODAY;
      sDate = TODAY;
      eDate = TODAY;
    } else if (preset === 'yesterday') {
      const yest = new Date(initialYear, initialMonth, initialDay - 1);
      targetDate = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;
      sDate = targetDate;
      eDate = targetDate;
    } else if (preset === 'week') {
      const d = new Date(initialYear, initialMonth, initialDay);
      const dayOfWeek = (d.getDay() + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - dayOfWeek);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      sDate = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
      eDate = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
      targetDate = sDate;
    } else if (preset === 'month') {
      const lastDay = new Date(initialYear, initialMonth + 1, 0).getDate();
      sDate = `${initialYear}-${pad(initialMonth + 1)}-01`;
      eDate = `${initialYear}-${pad(initialMonth + 1)}-${pad(lastDay)}`;
      targetDate = sDate;
    } else if (preset === 'year') {
      sDate = `${initialYear}-01-01`;
      eDate = `${initialYear}-12-31`;
      targetDate = sDate;
    }

    state = {
      selectedDate: targetDate,
      selectedTime: state.selectedTime,
      selectedPreset: preset,
      startDate: sDate,
      endDate: eDate
    };
    listeners.forEach(l => l());
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

export function useDateFilter() {
  const current = useSyncExternalStore(
    dateFilterStore.subscribe,
    dateFilterStore.getState
  );

  return {
    ...current,
    setDate: dateFilterStore.setDate,
    setDateRange: dateFilterStore.setDateRange,
    setTime: dateFilterStore.setTime,
    setPreset: dateFilterStore.setPreset
  };
}
