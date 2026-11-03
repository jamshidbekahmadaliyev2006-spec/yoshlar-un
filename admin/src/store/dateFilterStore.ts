import { useSyncExternalStore } from 'react';
import { TODAY, pad } from '../utils/format';

export interface DateFilterState {
  selectedDate: string; // "YYYY-MM-DD"
  selectedTime: string; // "HH:mm"
  selectedPreset: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
}

let state: DateFilterState = {
  selectedDate: TODAY,
  selectedTime: '00:00',
  selectedPreset: 'today'
};

const listeners = new Set<() => void>();

export const dateFilterStore = {
  getState: () => state,

  setDate: (date: string, time?: string, preset?: DateFilterState['selectedPreset']) => {
    state = {
      selectedDate: date,
      selectedTime: time !== undefined ? time : state.selectedTime,
      selectedPreset: preset || 'custom'
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

  setPreset: (preset: DateFilterState['selectedPreset']) => {
    const todayParts = TODAY.split('-').map(Number);
    const initialYear = todayParts[0] || 2026;
    const initialMonth = (todayParts[1] || 11) - 1;
    const initialDay = todayParts[2] || 2;

    let targetDate = TODAY;
    if (preset === 'today') {
      targetDate = TODAY;
    } else if (preset === 'yesterday') {
      const yest = new Date(initialYear, initialMonth, initialDay - 1);
      targetDate = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;
    } else if (preset === 'week') {
      const d = new Date(initialYear, initialMonth, initialDay);
      const dayOfWeek = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - dayOfWeek);
      targetDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    } else if (preset === 'month') {
      targetDate = `${initialYear}-${pad(initialMonth + 1)}-01`;
    } else if (preset === 'year') {
      targetDate = `${initialYear}-01-01`;
    }

    state = {
      selectedDate: targetDate,
      selectedTime: state.selectedTime,
      selectedPreset: preset
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
    setTime: dateFilterStore.setTime,
    setPreset: dateFilterStore.setPreset
  };
}

