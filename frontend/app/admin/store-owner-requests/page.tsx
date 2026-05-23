'use client';

import { useEffect, useState } from 'react';

import {
  approveStoreOwnershipRequest,
  getPendingStoreOwnershipRequests,
  rejectStoreOwnershipRequest,
} from '@/services/store-ownership-requests';

type StoreOwnershipRequest = {
  id: string;
  storeName: string;
  roomNumber: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  hostel: {
    name: string;
  };
};

export default function AdminStoreOwnerRequestsPage() {
  const [requests, setRequests] = useState<StoreOwnershipRequest[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const data = await getPendingStoreOwnershipRequests();
      setRequests(data.requests);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const reviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setMessage('');

    try {
      if (action === 'approve') {
        await approveStoreOwnershipRequest(requestId);
      } else {
        await rejectStoreOwnershipRequest(requestId);
      }

      setRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== requestId),
      );
      setMessage(`Request ${action}d.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Review failed.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-semibold text-slate-950">Store Owner Requests</h1>

        {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <p className="p-6 text-sm text-slate-600">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="p-6 text-sm text-slate-600">No pending requests.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {requests.map((request) => (
                <article
                  className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center"
                  key={request.id}
                >
                  <div>
                    <h2 className="font-medium text-slate-950">{request.storeName}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {request.hostel.name} - Room {request.roomNumber}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {request.user.name} - {request.user.email}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                      onClick={() => void reviewRequest(request.id, 'approve')}
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-950"
                      onClick={() => void reviewRequest(request.id, 'reject')}
                      type="button"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
