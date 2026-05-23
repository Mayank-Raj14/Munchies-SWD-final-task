import type { Item } from './item';

export type CartItem = {
  id: string;
  cartId: string;
  itemId: string;
  quantity: number;
  item: Item;
  createdAt: string;
  updatedAt: string;
};

export type Cart = {
  id: string;
  userId: string;
  storeId: string;
  store: {
    id: string;
    name: string;
    roomNumber: string;
    hostel: {
      id: string;
      name: string;
    };
  };
  items: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
};
