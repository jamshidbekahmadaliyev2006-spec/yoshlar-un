import { useState, useMemo } from 'react';
import { eventsApi } from '../api/events';
import { EventItem } from '../types';

export function useEvents(initialQuery = '', initialType = '') {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [limit, setLimit] = useState(12);
  const [, setRefresh] = useState(0);

  const events = useMemo(() => {
    return eventsApi.getAll(query, type);
  }, [query, type]);

  const loadMore = () => setLimit(prev => prev + 12);

  const toggleRegistration = (id: number) => {
    const status = eventsApi.toggleReg(id);
    setRefresh(prev => prev + 1);
    return status;
  };

  return {
    query,
    setQuery,
    type,
    setType,
    limit,
    loadMore,
    events,
    visibleEvents: events.slice(0, limit),
    totalCount: events.length,
    registeredIds: eventsApi.getRegistered(),
    toggleRegistration
  };
}

