import type { BookingStatus } from '@/types/booking';

export const formatBookingStatus = (status: BookingStatus) => {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'CONFIRMED':
      return 'Accepted';
    case 'CANCELLED':
      return 'Rejected';
    case 'COMPLETED':
      return 'Completed';
    default:
      return status;
  }
};

export const bookingStatusBadgeClass = (status: BookingStatus) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-500/15 text-amber-200';
    case 'CONFIRMED':
      return 'bg-emerald-500/15 text-emerald-200';
    case 'CANCELLED':
      return 'bg-red-500/15 text-red-200';
    case 'COMPLETED':
      return 'bg-white/10 text-foreground-secondary';
    default:
      return 'bg-white/10 text-foreground-secondary';
  }
};

export const formatBookingDate = (value: string) => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};
