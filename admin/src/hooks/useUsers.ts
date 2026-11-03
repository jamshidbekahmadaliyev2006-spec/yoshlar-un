import { useState, useMemo } from 'react';
import { usersApi } from '../api/users';
import { UserItem } from '../types';

export function useUsers(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [, setRefresh] = useState(0);

  const filteredUsers = useMemo(() => {
    return usersApi.getAll(query);
  }, [query]);

  const total = filteredUsers.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const rows = filteredUsers.slice(startIndex, startIndex + pageSize);

  const toggleStatus = (id: number) => {
    const newStatus = usersApi.toggleStatus(id);
    setRefresh(prev => prev + 1);
    return newStatus;
  };

  return {
    query,
    setQuery,
    page: currentPage,
    setPage,
    pageSize,
    setPageSize,
    total,
    pageCount,
    rows,
    filteredUsers,
    toggleStatus
  };
}

