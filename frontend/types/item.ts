export type Item = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  imageUrl?: string | null;
  price: string;
  stock: number;
  isAvailable: boolean;
  storeId: string;
  createdAt: string;
  updatedAt: string;
};
