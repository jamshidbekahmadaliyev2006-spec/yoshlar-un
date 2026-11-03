import { LOCS } from '../utils/format';
import { PlaceItem } from '../types';

export const placesApi = {
  getAll: (): PlaceItem[] => LOCS,
  getById: (id: number) => LOCS.find(l => l.id === id)
};

