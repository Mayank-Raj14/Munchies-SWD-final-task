export type Item = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  imageUrl?: string | null;
  price: string;
  stock: number;
  storeId: string;
  createdAt: string;
  updatedAt: string;
};
