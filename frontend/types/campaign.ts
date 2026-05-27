export type CampaignType = 'PERCENTAGE' | 'FLAT';

export type Campaign = {
  id: string;
  storeId: string;
  code: string;
  type: CampaignType;
  value: string;
  minOrderValue: string;
  globalUsageLimit?: number | null;
  perUserUsageLimit?: number | null;
  usedCount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  targetedItems?: { itemId: string }[];
};

export type CouponPreview = {
  campaign: Campaign;
  subtotalAmount: string;
  discountAmount: string;
  totalAmount: string;
};
