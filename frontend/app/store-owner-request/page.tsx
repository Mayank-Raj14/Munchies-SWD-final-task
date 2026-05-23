'use client';

import { FormEvent, useEffect, useState } from 'react';

import { getHostels } from '@/services/hostels';
import { createStoreOwnershipRequest } from '@/services/store-ownership-requests';
import type { Hostel } from '@/types/hostel';

export default function StoreOwnerRequestPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadHostels = async () => {
      try {
        const data = await getHostels();
        setHostels(data.hostels);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load hostels.');
      }
    };

    void loadHostels();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await createStoreOwnershipRequest({
        hostelId: String(formData.get('hostelId')),
        storeName: String(formData.get('storeName')),
        roomNumber: String(formData.get('roomNumber')),
      });
      setMessage('Store ownership request submitted.');
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Request Store Ownership</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Hostel</span>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
              name="hostelId"
              required
            >
              <option value="">Select hostel</option>
              {hostels.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Store Name</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
              name="storeName"
              minLength={2}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Room Number</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
              name="roomNumber"
              required
            />
          </label>
          <button
            className="w-full rounded-md bg-slate-950 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
      </section>
    </main>
  );
}
