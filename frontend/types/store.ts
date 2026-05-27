import type { Item } from './item';

export type Store = {
  id: string;
  name: string;
  roomNumber: string;
  email?: string | null;
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
  _count?: {
    items: number;
    bookings: number;
  };
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
