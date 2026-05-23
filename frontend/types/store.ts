import type { Item } from './item';

export type Store = {
  id: string;
  name: string;
  roomNumber: string;
  createdAt: string;
  hostel: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    name: string;
  };
  items?: Item[];
};

export type StoreListResponse = {
  stores: Store[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
