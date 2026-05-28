'use client';

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BadgePercent,
  Megaphone,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

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

import {
  createCampaign,
  deleteCampaign,
  getCampaigns,
  toggleCampaignActive,
  updateCampaign,
} from '@/services/campaigns';

import { getStoreItems } from '@/services/items';
import { getMyStores } from '@/services/stores';

import type { Campaign } from '@/types/campaign';
import type { Item } from '@/types/item';
import type { Store } from '@/types/store';

const toLocalInputValue = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

const initialFormValues = {
  code: '',
  type: 'PERCENTAGE',
  value: '',
  minOrderValue: '',
  globalUsageLimit: '',
  perUserUsageLimit: '',
  startsAt: toLocalInputValue(new Date()),
  endsAt: toLocalInputValue(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ),
};

export default function CampaignsPage() {
  const { isLoading: isAuthLoading, isAuthorized } =
    useRequireAuth(['STORE_OWNER', 'ADMIN']);

  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState('');
  const [storeItems, setStoreItems] = useState<Item[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editingCampaignId, setEditingCampaignId] =
    useState<string | null>(null);

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formValues, setFormValues] = useState(initialFormValues);

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === storeId),
    [storeId, stores],
  );

  const clearFormMode = () => {
    setEditingCampaignId(null);
    setSelectedItemIds([]);
    setFormValues(initialFormValues);
  };

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
          const [campaignData, itemData] = await Promise.all([
            getCampaigns(nextStoreId),
            getStoreItems(nextStoreId),
          ]);

          setCampaigns(campaignData.campaigns);
          setStoreItems(itemData.items);
        } else {
          setCampaigns([]);
          setStoreItems([]);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load campaigns.',
        );
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

    void Promise.all([
      getCampaigns(storeId),
      getStoreItems(storeId),
    ]).then(([campaignData, itemData]) => {
      setCampaigns(campaignData.campaigns);
      setStoreItems(itemData.items);
    });
  }, [isAuthLoading, isAuthorized, storeId]);

  useSyncedRefresh(
    ['campaigns', 'stores'],
    () => loadData({ silent: true }),
    { enabled: isAuthorized },
  );

  const handleToggleItem = (itemId: string, checked: boolean) => {
    setSelectedItemIds((current) => {
      if (checked) {
        return current.includes(itemId) ? current : [...current, itemId];
      }
      return current.filter((id) => id !== itemId);
    });
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!storeId || busyId) {
      return;
    }

    setBusyId('create');
    setMessage('');
    setError('');

    try {
      const payload = {
        storeId,
        code: formValues.code.trim() || undefined,
        type: formValues.type as 'PERCENTAGE' | 'FLAT',
        value: Number(formValues.value),
        minOrderValue: Number(formValues.minOrderValue || 0),
        globalUsageLimit: formValues.globalUsageLimit
          ? Number(formValues.globalUsageLimit)
          : null,
        perUserUsageLimit: formValues.perUserUsageLimit
          ? Number(formValues.perUserUsageLimit)
          : null,
        startsAt: new Date(formValues.startsAt).toISOString(),
        endsAt: new Date(formValues.endsAt).toISOString(),
        isActive: true,
        itemIds: [...new Set(selectedItemIds)],
      };

      if (editingCampaignId) {
        const data = await updateCampaign(editingCampaignId, payload);

        setCampaigns((current) =>
          current.map((campaign) =>
            campaign.id === editingCampaignId ? data.campaign : campaign,
          ),
        );

        setMessage(`Campaign ${data.campaign.code} updated.`);
      } else {
        const data = await createCampaign(payload);

        setCampaigns((current) => [data.campaign, ...current]);

        setMessage(`Campaign ${data.campaign.code} created.`);
      }

      clearFormMode();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Campaign save failed.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id);

    setSelectedItemIds(
      [...(campaign.targetedItems ?? [])].map((entry) => entry.itemId),
    );

    setFormValues({
      code: campaign.code ?? '',
      type: campaign.type,
      value: String(campaign.value),
      minOrderValue: String(campaign.minOrderValue ?? ''),
      globalUsageLimit: String(campaign.globalUsageLimit ?? ''),
      perUserUsageLimit: String(campaign.perUserUsageLimit ?? ''),
      startsAt: toLocalInputValue(new Date(campaign.startsAt)),
      endsAt: toLocalInputValue(new Date(campaign.endsAt)),
    });
  };

  const handleToggleCampaign = async (campaignId: string, nextActive: boolean) => {
    if (busyId) {
      return;
    }

    setBusyId(campaignId);
    setMessage('');
    setError('');

    try {
      const data = await toggleCampaignActive(campaignId, nextActive);

      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.id === campaignId
            ? { ...campaign, isActive: data.campaign.isActive }
            : campaign,
        ),
      );

      const action = data.campaign.isActive ? 'activated' : 'deactivated';
      setMessage(`${data.campaign.code} ${action}.`);
      
      await loadData({ silent: true });
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : 'Unable to update campaign status.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (busyId) {
      return;
    }

    setBusyId(campaignId);
    setMessage('');
    setError('');
    setDeleteConfirmId(null);

    try {
      const data = await deleteCampaign(campaignId);

      setCampaigns((current) =>
        current.filter((campaign) => campaign.id !== campaignId),
      );

      setMessage(`Campaign ${data.campaign.code} deleted.`);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete campaign.',
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
      <SectionHeader
        description="Create store coupons and monitor usage."
        title="Campaigns"
      />

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
              <input
                className={fieldClass}
                name="code"
                onChange={handleInputChange}
                placeholder="Auto-generate"
                value={formValues.code}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Type</span>
                <SelectShell>
                  <select
                    className={selectClass}
                    name="type"
                    onChange={handleInputChange}
                    value={formValues.type}
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FLAT">Flat</option>
                  </select>
                </SelectShell>
              </label>

              <label className="block">
                <span className={labelClass}>Value</span>
                <input
                  className={fieldClass}
                  min="1"
                  name="value"
                  onChange={handleInputChange}
                  required
                  type="number"
                  value={formValues.value}
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Minimum order</span>
                <input
                  className={fieldClass}
                  min="0"
                  name="minOrderValue"
                  onChange={handleInputChange}
                  type="number"
                  value={formValues.minOrderValue}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Global limit</span>
                <input
                  className={fieldClass}
                  min="1"
                  name="globalUsageLimit"
                  onChange={handleInputChange}
                  type="number"
                  value={formValues.globalUsageLimit}
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Per-user limit</span>
              <input
                className={fieldClass}
                min="1"
                name="perUserUsageLimit"
                onChange={handleInputChange}
                type="number"
                value={formValues.perUserUsageLimit}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Starts</span>
                <input
                  className={fieldClass}
                  name="startsAt"
                  onChange={handleInputChange}
                  required
                  type="datetime-local"
                  value={formValues.startsAt}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Ends</span>
                <input
                  className={fieldClass}
                  name="endsAt"
                  onChange={handleInputChange}
                  required
                  type="datetime-local"
                  value={formValues.endsAt}
                />
              </label>
            </div>

            <div>
              <span className={labelClass}>Target items (optional)</span>
              {storeItems.length === 0 ? (
                <p className="mt-1 text-xs text-foreground-muted">
                  No inventory items available for this store.
                </p>
              ) : (
                <div className="mt-2 max-h-36 space-y-2 overflow-auto rounded-xl border border-border p-2">
                  {storeItems.map((item) => (
                    <label
                      className="flex items-center gap-2 text-sm"
                      key={item.id}
                    >
                      <input
                        checked={selectedItemIds.includes(item.id)}
                        onChange={(event) =>
                          handleToggleItem(item.id, event.target.checked)
                        }
                        type="checkbox"
                      />
                      <span className="truncate">{item.name}</span>
                    </label>
                  ))}
                </div>
              )}

              <button
                className="mt-2 text-xs text-foreground-secondary underline"
                onClick={clearFormMode}
                type="button"
              >
                Clear selected items
              </button>
            </div>

            <div className="flex gap-2">
              <button
                className={`${primaryButtonClass} flex-1`}
                disabled={busyId === 'create'}
              >
                {busyId === 'create' ? (
                  <LoadingSpinner />
                ) : (
                  <BadgePercent className="h-4 w-4" />
                )}
                {editingCampaignId ? 'Save campaign' : 'Create campaign'}
              </button>

              {editingCampaignId ? (
                <button
                  className={secondaryButtonClass}
                  onClick={clearFormMode}
                  type="button"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              ) : null}
            </div>
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
                    <span>
                      Min Rs. {Number(campaign.minOrderValue).toFixed(2)}
                    </span>
                    <span>{campaign.usedCount} used</span>
                    <span>
                      {new Date(campaign.startsAt).toLocaleDateString()}
                    </span>
                    <span>
                      {new Date(campaign.endsAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-foreground-muted">
                    {campaign.targetedItems?.length
                      ? `${campaign.targetedItems.length} targeted item(s)`
                      : 'Store-wide coupon'}
                  </p>

                  {deleteConfirmId === campaign.id ? (
                    <div className="mt-4 rounded-lg border border-border-danger bg-surface-danger/5 p-3">
                      <p className="text-sm text-foreground-secondary">
                        Delete &quot;{campaign.code}&quot;? This cannot be undone.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          className={`${secondaryButtonClass} flex-1 text-xs`}
                          disabled={busyId === campaign.id}
                          onClick={() => void handleDelete(campaign.id)}
                          type="button"
                        >
                          {busyId === campaign.id ? (
                            <LoadingSpinner className="h-3 w-3" />
                          ) : (
                            'Confirm Delete'
                          )}
                        </button>
                        <button
                          className={`${secondaryButtonClass} flex-1 text-xs`}
                          disabled={busyId === campaign.id}
                          onClick={() => setDeleteConfirmId(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <button
                        className={secondaryButtonClass}
                        disabled={
                          busyId === campaign.id ||
                          editingCampaignId === campaign.id
                        }
                        onClick={() => handleEdit(campaign)}
                        type="button"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          className={secondaryButtonClass}
                          disabled={busyId === campaign.id}
                          onClick={() =>
                            void handleToggleCampaign(
                              campaign.id,
                              !campaign.isActive,
                            )
                          }
                          type="button"
                        >
                          {busyId === campaign.id ? (
                            <LoadingSpinner className="h-3 w-3" />
                          ) : null}
                          {campaign.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          aria-label="Delete campaign"
                          className={secondaryButtonClass}
                          disabled={busyId === campaign.id}
                          onClick={() => setDeleteConfirmId(campaign.id)}
                          title="Delete campaign"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}