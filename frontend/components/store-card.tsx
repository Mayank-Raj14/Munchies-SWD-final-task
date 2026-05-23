import Link from 'next/link';

import type { Store } from '@/types/store';

type StoreCardProps = {
  store: Store;
};

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Link
      className="block rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
      href={`/stores/${store.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">{store.name}</h2>
          <p className="mt-2 text-sm text-stone-600">Room {store.roomNumber}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          {store.hostel.name}
        </span>
      </div>
      <p className="mt-5 text-sm text-stone-500">Owner: {store.owner.name}</p>
    </Link>
  );
}
