'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { BadgePercent, Megaphone } from 'lucide-react';

import {
  EmptyState,
  LoadingSpinner,
  MarketSurface,
  Notice,
  PageContainer,
  SectionHeader,
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
  SelectShell,
} from '@/components/marketplace-ui';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useSyncedRefresh } from '@/lib/sync-events';
import { createCampaign, deactivateCampaign, getCampaigns } from '@/services/campaigns';
import { getMyStores } from '@/services/stores';
import type { Campaign } from '@/types/campaign';
import type { Store } from '@/types/store';

const toLocalInputValue = (date: Date) => date.toISOString().slice(0, 16);

export default function CampaignsPage() {
  const { isLoading: isAuthLoading, isAuthorized } = useRequireAuth(['STORE_OWNER', 'ADMIN']);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === storeId),
    [storeId, stores],
  );

  const loadData = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!isAuthorized) {
        return;
      }

      if (!options.silent) {
        setIsLoading(true);
      }

      setError('');

      try {
        const storeData = await getMyStores();
        setStores(storeData.stores);
        const nextStoreId = storeId || storeData.stores[0]?.id || '';
        setStoreId(nextStoreId);

        if (nextStoreId) {
          const campaignData = await getCampaigns(nextStoreId);
          setCampaigns(campaignData.campaigns);
        } else {
          setCampaigns([]);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load campaigns.');
      } finally {
        if (!options.silent) {
          setIsLoading(false);
        }
      }
    },
    [isAuthorized, storeId],
  );

  useEffect(() => {
    if (isAuthLoading || !isAuthorized) {
      return;
    }

    void loadData();
  }, [isAuthLoading, isAuthorized, loadData]);

  useEffect(() => {
    if (!storeId || isAuthLoading || !isAuthorized) {
      return;
    }

    void getCampaigns(storeId).then((data) => setCampaigns(data.campaigns));
  }, [isAuthLoading, isAuthorized, storeId]);

  useSyncedRefresh(['campaigns', 'stores'], () => loadData({ silent: true }), {
    enabled: isAuthorized,
  });

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!storeId || busyId) {
      return;
    }

    setBusyId('create');
    setMessage('');
    setError('');

    const formData = new FormData(event.currentTarget);

    try {
      const data = await createCampaign({
        storeId,
        code: String(formData.get('code') || '').trim() || undefined,
        type: String(formData.get('type')) as 'PERCENTAGE' | 'FLAT',
        value: Number(formData.get('value')),
        minOrderValue: Number(formData.get('minOrderValue') || 0),
        globalUsageLimit: formData.get('globalUsageLimit')
          ? Number(formData.get('globalUsageLimit'))
          : null,
        perUserUsageLimit: formData.get('perUserUsageLimit')
          ? Number(formData.get('perUserUsageLimit'))
          : null,
        startsAt: new Date(String(formData.get('startsAt'))).toISOString(),
        endsAt: new Date(String(formData.get('endsAt'))).toISOString(),
        isActive: true,
      });
      setCampaigns((current) => [data.campaign, ...current]);
      setMessage(`Campaign ${data.campaign.code} created.`);
      event.currentTarget.reset();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Campaign creation failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeactivate = async (campaignId: string) => {
    if (busyId) {
      return;
    }

    setBusyId(campaignId);
    setMessage('');
    setError('');

    try {
      const data = await deactivateCampaign(campaignId);
      setCampaigns((current) =>
        current.map((campaign) => (campaign.id === campaignId ? data.campaign : campaign)),
      );
      setMessage(`${data.campaign.code} deactivated.`);
    } catch (deactivateError) {
      setError(
        deactivateError instanceof Error
          ? deactivateError.message
          : 'Unable to deactivate campaign.',
      );
    } finally {
      setBusyId(null);
    }
  };

  if (isAuthLoading || !isAuthorized) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-16">
          <LoadingSpinner className="h-6 w-6" />
          <p className="text-sm text-foreground-muted">Checking access...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <SectionHeader description="Create store coupons and monitor usage." title="Campaigns" />

      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <MarketSurface className="p-5">
          <form className="space-y-4" onSubmit={handleCreate}>
            <label className="block">
              <span className={labelClass}>Store</span>
              <SelectShell>
                <select
                  className={selectClass}
                  onChange={(event) => setStoreId(event.target.value)}
                  value={storeId}
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </label>
            <label className="block">
              <span className={labelClass}>Code</span>
              <input className={fieldClass} name="code" placeholder="Auto-generate" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Type</span>
                <SelectShell>
                  <select className={selectClass} name="type">
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FLAT">Flat</option>
                  </select>
                </SelectShell>
              </label>
              <label className="block">
                <span className={labelClass}>Value</span>
                <input className={fieldClass} min="1" name="value" required type="number" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Minimum order</span>
                <input className={fieldClass} min="0" name="minOrderValue" type="number" />
              </label>
              <label className="block">
                <span className={labelClass}>Global limit</span>
                <input className={fieldClass} min="1" name="globalUsageLimit" type="number" />
              </label>
            </div>
            <label className="block">
              <span className={labelClass}>Per-user limit</span>
              <input className={fieldClass} min="1" name="perUserUsageLimit" type="number" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Starts</span>
                <input
                  className={fieldClass}
                  defaultValue={toLocalInputValue(new Date())}
                  name="startsAt"
                  required
                  type="datetime-local"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Ends</span>
                <input
                  className={fieldClass}
                  defaultValue={toLocalInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
                  name="endsAt"
                  required
                  type="datetime-local"
                />
              </label>
            </div>
            <button className={`${primaryButtonClass} w-full`} disabled={busyId === 'create'}>
              {busyId === 'create' ? <LoadingSpinner /> : <BadgePercent className="h-4 w-4" />}
              Create campaign
            </button>
          </form>
        </MarketSurface>

        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {selectedStore ? selectedStore.name : 'Campaigns'}
          </h2>
          {isLoading ? (
            <MarketSurface className="mt-4 h-64 animate-pulse" />
          ) : campaigns.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                description="Coupons for the selected store appear here."
                icon={Megaphone}
                title="No campaigns yet"
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {campaigns.map((campaign) => (
                <article
                  className="rounded-2xl border border-border bg-surface p-4"
                  key={campaign.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold tracking-wide text-foreground">
                        {campaign.code}
                      </p>
                      <p className="mt-1 text-sm text-foreground-secondary">
                        {campaign.type === 'PERCENTAGE'
                          ? `${Number(campaign.value).toFixed(0)}% off`
                          : `Rs. ${Number(campaign.value).toFixed(2)} off`}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium text-foreground-secondary">
                      {campaign.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-foreground-secondary">
                    <span>Min Rs. {Number(campaign.minOrderValue).toFixed(2)}</span>
                    <span>{campaign.usedCount} used</span>
                    <span>{new Date(campaign.startsAt).toLocaleDateString()}</span>
                    <span>{new Date(campaign.endsAt).toLocaleDateString()}</span>
                  </div>
                  {campaign.isActive ? (
                    <button
                      className={`${secondaryButtonClass} mt-4`}
                      disabled={busyId === campaign.id}
                      onClick={() => void handleDeactivate(campaign.id)}
                      type="button"
                    >
                      {busyId === campaign.id ? <LoadingSpinner /> : null}
                      Deactivate
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
