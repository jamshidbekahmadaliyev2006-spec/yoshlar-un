import { apiClient } from './client';
import { EventItem } from '../types';

export const eventsApi = {
  getAll: (query = '', type = '') => {
    const events = apiClient.getEvents();
    const q = query.toLowerCase();
    return events
      .filter(e => (!type || String(e.t) === type) && (!q || (e.title + ' ' + e.desc).toLowerCase().includes(q)))
      .sort((a, b) => (a.date === b.date ? (a.time < b.time ? 1 : -1) : (a.date < b.date ? 1 : -1)));
  },
  getById: (id: number) => apiClient.getEventById(id),
  create: (data: Omit<EventItem, 'id' | 'going' | 'came'>) => apiClient.addEvent(data),
  toggleReg: (id: number) => apiClient.toggleRegistration(id),
  getRegistered: () => apiClient.getRegistrations()
};

