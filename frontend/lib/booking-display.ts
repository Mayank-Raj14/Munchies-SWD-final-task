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
      return 'bg-amber-50 text-amber-800';
    case 'CONFIRMED':
      return 'bg-emerald-50 text-emerald-800';
    case 'CANCELLED':
      return 'bg-red-50 text-red-800';
    case 'COMPLETED':
      return 'bg-slate-100 text-slate-800';
    default:
      return 'bg-stone-100 text-stone-800';
  }
};

export const formatBookingDate = (value: string) => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};
