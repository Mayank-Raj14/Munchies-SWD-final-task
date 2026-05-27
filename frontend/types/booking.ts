export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'EXPIRED';

export type BookingItem = {
  id: string;
  bookingId: string;
  itemId: string;
  quantity: number;
  price: string;
  item: {
    id: string;
    name: string;
    category: string;
    imageUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  userId: string;
  storeId: string;
  status: BookingStatus;
  subtotalAmount: string;
  discountAmount: string;
  totalAmount: string;
  collectedAt?: string | null;
  expiresAt?: string | null;
  cancellationRequestedAt?: string | null;
  cancellationReviewedAt?: string | null;
  cancellationRejectedAt?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  store: {
    id: string;
    name: string;
    roomNumber: string;
    hostel: {
      id: string;
      name: string;
    };
  };
  items: BookingItem[];
  createdAt: string;
  updatedAt: string;
};
