/**
 * Relative API path segments (appended to API_BASE_URL, which includes `/api`).
 * Keep paths free of whitespace; use buildApiUrl() for joining.
 */
export const API_ROUTES = {
  health: '/health',
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    me: '/auth/me',
    emailPreferences: '/auth/me/email-preferences',
  },
  hostels: '/hostels',
  stores: {
    list: '/stores',
    myStores: '/stores/my-stores',
    byId: (storeId: string) => `/stores/${storeId}`,
    items: (storeId: string) => `/stores/${storeId}/items`,
    itemById: (storeId: string, itemId: string) => `/stores/${storeId}/items/${itemId}`,
  },
  carts: {
    list: '/carts',
    byId: (cartId: string) => `/carts/${cartId}`,
    items: '/carts/items',
    itemById: (cartItemId: string) => `/carts/items/${cartItemId}`,
  },
  bookings: {
    checkout: '/bookings/checkout',
    list: '/bookings',
    byId: (bookingId: string) => `/bookings/${bookingId}`,
    status: (bookingId: string) => `/bookings/${bookingId}/status`,
    cancellationRequest: (bookingId: string) => `/bookings/${bookingId}/cancellation-request`,
    cancellationApprove: (bookingId: string) => `/bookings/${bookingId}/cancellation/approve`,
    cancellationReject: (bookingId: string) => `/bookings/${bookingId}/cancellation/reject`,
  },
  campaigns: {
    active: '/campaigns/active',
    list: '/campaigns',
    validate: '/campaigns/validate',
    byId: (campaignId: string) => `/campaigns/${campaignId}`,
    deactivate: (campaignId: string) => `/campaigns/${campaignId}/deactivate`,
    delete: (campaignId: string) => `/campaigns/${campaignId}`,
  },
  analytics: {
    me: '/analytics/users/me',
    store: (storeId: string) => `/analytics/stores/${storeId}`,
  },
  storeOwnershipRequests: {
    list: '/store-ownership-requests',
    adminList: '/admin/store-ownership-requests',
    adminApprove: (requestId: string) => `/admin/store-ownership-requests/${requestId}/approve`,
    adminReject: (requestId: string) => `/admin/store-ownership-requests/${requestId}/reject`,
  },
  governance: {
    warnings: (userId: string) => `/admin/governance/users/${userId}/warnings`,
    globalBlock: (userId: string) => `/admin/governance/users/${userId}/block`,
    storeBlock: (storeId: string, userId: string) =>
      `/governance/stores/${storeId}/users/${userId}/block`,
  },

  // Admin-only convenience endpoints for moderation UI
  admin: {
    users: {
      // GET /admin/users?query=...
      search: (query: string) => `/admin/users?query=${encodeURIComponent(query)}`,
    },
    stores: {
      // GET /admin/stores
      list: '/admin/stores',
      // POST /admin/stores/:storeId/block-everyone
      blockEveryone: (storeId: string) => `/admin/stores/${storeId}/block-everyone`,
      // DELETE /admin/stores/:storeId
      remove: (storeId: string) => `/admin/stores/${storeId}`,
      // POST /admin/stores/:storeId/suspend
      suspend: (storeId: string) => `/admin/stores/${storeId}/suspend`,
      // POST /admin/stores/:storeId/reactivate
      reactivate: (storeId: string) => `/admin/stores/${storeId}/reactivate`,
    },
  },
} as const;

