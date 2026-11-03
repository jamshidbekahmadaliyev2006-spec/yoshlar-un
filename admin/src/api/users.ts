import { apiClient } from './client';
import { UserItem } from '../types';

export const usersApi = {
  getAll: (query = '') => {
    const users = apiClient.getUsers();
    const q = query.toLowerCase().replace(/\s+/g, '');
    return users.filter(u => {
      const matchQuery = !q || u.n.toLowerCase().includes(q) || u.p.replace(/\s+/g, '').includes(q);
      return matchQuery;
    });
  },
  toggleStatus: (id: number) => apiClient.toggleUserStatus(id),
  update: (id: number, data: Partial<UserItem>) => apiClient.updateUser(id, data),
  exportCsv: (filteredUsers: UserItem[]) => {
    const header = 'Ism,Telefon,Sana,Status\n';
    const statusNames = ['Faol', 'Nofaol', 'Bloklangan'];
    const rows = filteredUsers.slice(0, 500).map(u => [u.n, u.p, u.d, statusNames[u.s]].join(','));
    return header + rows.join('\n');
  }
};

