export type AnalyticsItem = {
  item: { id: string; name: string };
  quantity: number;
} | null;

export type StoreAnalytics = {
  revenue: { total: number; weekly: number; monthly: number };
  mostSoldItem: AnalyticsItem;
  leastSoldItem: AnalyticsItem;
  bookingStatistics: Record<string, number>;
  lowStockThreshold: number;
  lowStockItems: { id: string; name: string; stock: number }[];
};

export type UserAnalytics = {
  totalSpending: number;
  totalBookings: number;
  favoriteStore: { id: string; name: string } | null;
  favoriteItem: { id: string; name: string } | null;
  monthlySpending: Record<string, number>;
};
