'use client';

import { FormEvent, useEffect, useState } from 'react';

import { getHostels } from '@/services/hostels';
import { createStore, deleteStore, getMyStores, updateStore } from '@/services/stores';
import type { Hostel } from '@/types/hostel';
import type { Store } from '@/types/store';

type FormState = {
  id?: string;
  name: string;
  hostelId: string;
  roomNumber: string;
};

const emptyForm: FormState = {
  name: '',
  hostelId: '',
  roomNumber: '',
};

export default function StoreOwnerStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStores = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const data = await getMyStores();
      setStores(data.stores);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load stores.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const data = await getHostels();
        setHostels(data.hostels);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load hostels.');
      }

      await loadStores();
    };

    void loadPageData();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      if (form.id) {
        await updateStore(form.id, {
          name: form.name,
          hostelId: form.hostelId,
          roomNumber: form.roomNumber,
        });
        setMessage('Store updated.');
      } else {
        await createStore({
          name: form.name,
          hostelId: form.hostelId,
          roomNumber: form.roomNumber,
        });
        setMessage('Store created.');
      }

      setForm(emptyForm);
      await loadStores();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Store save failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (store: Store) => {
    setForm({
      id: store.id,
      name: store.name,
      hostelId: store.hostel.id,
      roomNumber: store.roomNumber,
    });
  };

  const removeStore = async (storeId: string) => {
    setMessage('');

    try {
      await deleteStore(storeId);
      setStores((currentStores) => currentStores.filter((store) => store.id !== storeId));
      setMessage('Store deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete store.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[380px_1fr]">
        <form
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <h1 className="text-2xl font-semibold text-slate-950">
            {form.id ? 'Edit Store' : 'Create Store'}
          </h1>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Store Name</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
                minLength={2}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                value={form.name}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Hostel</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
                onChange={(event) => setForm({ ...form, hostelId: event.target.value })}
                required
                value={form.hostelId}
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
              <span className="text-sm font-medium text-slate-700">Room Number</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
                onChange={(event) => setForm({ ...form, roomNumber: event.target.value })}
                required
                value={form.roomNumber}
              />
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              className="rounded-md bg-slate-950 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Saving...' : form.id ? 'Update Store' : 'Create Store'}
            </button>
            {form.id ? (
              <button
                className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-950"
                onClick={() => setForm(emptyForm)}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>
          {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">My Stores</h2>
          {isLoading ? (
            <p className="mt-6 text-sm text-slate-600">Loading stores...</p>
          ) : stores.length === 0 ? (
            <p className="mt-6 text-sm text-slate-600">No stores yet.</p>
          ) : (
            <div className="mt-6 divide-y divide-slate-200">
              {stores.map((store) => (
                <article
                  className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center"
                  key={store.id}
                >
                  <div>
                    <h3 className="font-medium text-slate-950">{store.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {store.hostel.name} - Room {store.roomNumber}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-950"
                      onClick={() => startEdit(store)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-950"
                      onClick={() => void removeStore(store.id)}
                      type="button"
                    >
                      Delete
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
