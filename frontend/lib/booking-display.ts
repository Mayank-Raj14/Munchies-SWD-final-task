import type { BookingStatus } from '@/types/booking';

export const formatBookingStatus = (status: BookingStatus) => {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'CONFIRMED':
      return 'Accepted';
    case 'READY':
      return 'Ready';
    case 'CANCEL_REQUESTED':
      return 'Cancellation requested';
    case 'CANCELLED':
      return 'Cancelled';
    case 'COMPLETED':
      return 'Completed';
    case 'EXPIRED':
      return 'Expired';
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
    case 'READY':
      return 'bg-sky-500/15 text-sky-200';
    case 'CANCEL_REQUESTED':
      return 'bg-amber-500/15 text-amber-200';
    case 'CANCELLED':
      return 'bg-red-500/15 text-red-200';
    case 'COMPLETED':
      return 'bg-white/10 text-foreground-secondary';
    case 'EXPIRED':
      return 'bg-zinc-500/15 text-zinc-200';
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
