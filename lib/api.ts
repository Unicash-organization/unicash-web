import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // BE-08 — required so the OAuth CSRF state cookie (HttpOnly, set during
  // /auth/social/:provider) rides along on the subsequent
  // /auth/social/callback POST. Without this axios drops cookies on
  // cross-origin requests and the backend would 401 every OAuth flow.
  withCredentials: true,
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request with token:', config.url, 'Token:', token.substring(0, 20) + '...');
    } else {
      console.warn('API Request without token:', config.url);
      // If trying to access protected endpoint without token, log error
      if (config.url?.includes('/users/me/') || config.url?.includes('/auth/me')) {
        console.error('Missing token for protected endpoint:', config.url);
      }
    }
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized:', error.config?.url);
      console.error('Error details:', error.response?.data);
      // Clear token on 401 - it's invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      // Don't redirect automatically for web frontend - let the app handle it
    } else if (error.code === 'ERR_NETWORK' || error.code === 'ERR_INSUFFICIENT_RESOURCES') {
      // Network errors - don't clear token, might be temporary
      console.warn('Network error (might be temporary):', error.config?.url, error.message);
    }
    return Promise.reject(error);
  }
);

export const api = {
  /**
   * Loyalty Entries (Sprint 2A). Member-side read-only endpoints powered by
   * LoyaltyService. All return shapes mirror /unicash-web/components/loyalty/types.ts.
   * Always succeed with `eligible: false` for non-eligible users — the frontend
   * decides whether to render the loyalty card or an upgrade nudge.
   */
  loyalty: {
    summary: () => apiClient.get('/me/loyalty/summary'),
    history: (params?: { page?: number; limit?: number }) =>
      apiClient.get('/me/loyalty/history', { params }),
    forDraw: (drawId: string) =>
      apiClient.get(`/me/loyalty/draws/${encodeURIComponent(drawId)}`),
    // Sprint 3 wave 1 — celebration modal feed
    listNotifications: () => apiClient.get('/me/loyalty/notifications'),
    dismissNotification: (id: string) =>
      apiClient.post(`/me/loyalty/notifications/${encodeURIComponent(id)}/dismiss`),
    dismissAllNotifications: () =>
      apiClient.post('/me/loyalty/notifications/dismiss-all'),
  },
  // Auth
  auth: {
    login: (email: string, password: string, deviceId?: string) => 
      apiClient.post('/auth/login', { email, password, deviceId }),
    register: (data: any) => 
      apiClient.post('/auth/register', data),
    // RESUME-1 — response now distinguishes "new email", "exists but no
     // active membership (can resume signup)", and "exists with active
     // membership (already a member)". Older callers that only read
     // .exists still work.
    checkEmail: (email: string) =>
      apiClient.post<{
        exists: boolean;
        hasActiveMembership: boolean;
        canResumeCheckout: boolean;
      }>('/auth/check-email', { email }),
    me: () => 
      apiClient.get('/auth/me'),
    // Social Login
    getSocialLoginUrl: (provider: 'google' | 'facebook' | 'github' | 'apple', redirectTo?: string) => {
      const params = redirectTo ? { redirectTo } : {};
      return apiClient.get(`/auth/social/${provider}`, { params });
    },
    /**
     * BE-08 — OAuth callback now requires the `state` value echoed back by
     * the provider. The CSRF state cookie set during initiate is sent
     * automatically by axios (apiClient is configured withCredentials);
     * the backend matches state ↔ cookie before exchanging the code.
     * Missing or mismatched state → 401 "OAuth state mismatch".
     */
    handleOAuthCallback: (code: string, state: string, provider?: string) =>
      apiClient.post('/auth/social/callback', { code, state, provider }),
    // Magic Link
    sendMagicLink: (email: string, redirectTo?: string) =>
      apiClient.post('/auth/magic-link', { email, redirectTo }),
    verifyMagicLink: (token: string, type?: 'email' | 'recovery') =>
      apiClient.post('/auth/magic-link/verify', { token, type }),
    // OTP
    sendOTP: (phone: string) =>
      apiClient.post('/auth/otp/send', { phone }),
    verifyOTP: (phone: string, token: string) =>
      apiClient.post('/auth/otp/verify', { phone, token }),
    // Password Reset
    requestPasswordReset: (email: string, redirectTo?: string) =>
      apiClient.post('/auth/password/reset-request', { email, redirectTo }),
    resetPassword: (token: string, newPassword: string) =>
      apiClient.post('/auth/password/reset', { token, newPassword }),
    // Email Verification
    sendEmailVerification: (email: string, redirectTo?: string) =>
      apiClient.post('/auth/verify-email', { email, redirectTo }),
    // AUTH-01 — confirm verify token (from email link)
    confirmEmailVerification: (token: string) =>
      apiClient.post('/auth/verify-email/confirm', { token }),
    // AUTH-01 — request a fresh verify email (logged-in user)
    resendEmailVerification: () =>
      apiClient.post('/auth/verify-email/resend', {}),
  },

  // Draws
  draws: {
    getAll: (arg?: string | { userId?: string; includeMajor?: boolean; includeFuture?: boolean }) => {
      let params: any = {};
      if (typeof arg === 'string') {
        if (arg) params.userId = arg;
      } else if (arg) {
        if (arg.userId) params.userId = arg.userId;
        if (arg.includeMajor) params.excludeMajorDraws = 'false';
        if (arg.includeFuture) params.skipDateFilter = 'true';
      }
      return apiClient.get('/draws', { params });
    },
    get: (id: string, userId?: string) => {
      const params = userId ? { userId } : {};
      return apiClient.get(`/draws/${id}`, { params });
    },
    /**
     * Public major-draw landing (enabled + slug); no auth.
     * Optional `preview` + `token` (Phase PB1) — admin iframe preview
     * mode that bypasses DRAFT / disabled filters when the token is a
     * valid admin JWT.
     */
    getByWinSlug: (
      slug: string,
      opts?: { preview?: 'admin'; token?: string },
    ) =>
      apiClient.get(`/draws/win/${encodeURIComponent(slug)}`, {
        params:
          opts?.preview && opts?.token
            ? { preview: opts.preview, token: opts.token }
            : undefined,
      }),
    /**
     * Phase U5 — Bonus Draw closing-soon reminders. Member opts in;
     * scheduler emails ~1 hour before the draw closes. Idempotent both
     * directions.
     */
    remindMe: (drawId: string) =>
      apiClient.post(`/draws/${drawId}/remind-me`),
    unremindMe: (drawId: string) =>
      apiClient.delete(`/draws/${drawId}/remind-me`),
    reminderStatus: (drawId: string) =>
      apiClient.get<{ subscribed: boolean }>(`/draws/${drawId}/remind-me`),
    myReminders: () => apiClient.get('/draws/me/reminders'),
    enter: (drawId: string, idempotencyKey?: string, quantity?: number) => {
      const headers: any = {};
      if (idempotencyKey) {
        headers['idempotency-key'] = idempotencyKey;
      }
      const body: any = {};
      if (quantity && quantity > 1) body.quantity = quantity;
      return apiClient.post(`/draws/${drawId}/enter`, body, { headers });
    },
    /** Public live entry counter + per-member entry mode for the draw detail page. */
    getEntryStats: (drawId: string) =>
      apiClient.get<{
        drawId: string;
        soldEntries: number;
        cap: number;
        remaining: number | null;
        entryLimitMode: 'single' | 'multi';
        maxEntriesPerMember: number | null;
      }>(`/draws/${drawId}/entry-stats`),
  },

  // Membership Plans
  membership: {
    getPlans: () => apiClient.get('/membership/plans'),
    getBoostPacks: () => apiClient.get('/membership/boost-packs'),
    subscribe: (planId: string) => apiClient.post('/membership/subscribe', { planId }),
    getUserMembership: () => apiClient.get('/membership/me'),
    getRenewalHistory: (page?: number, limit?: number) => 
      apiClient.get('/membership/me/renewals', { params: { page, limit } }),
    pause: () => apiClient.post('/membership/me/pause'),
    resume: () => apiClient.post('/membership/me/resume'),
    cancel: () => apiClient.post('/membership/me/cancel'),
    // Loyalty V2 PR1 — flip PENDING_CANCEL back to ACTIVE.
    reactivate: () => apiClient.post('/membership/me/reactivate'),
    cancelUpgrade: () => apiClient.post('/membership/me/cancel-upgrade'),
    cancelDowngrade: () => apiClient.post('/membership/me/cancel-downgrade'),
    upgrade: (newPlanId: string) => apiClient.post('/membership/me/upgrade', { newPlanId }),
  },

  // Users
  users: {
    getProfile: () => apiClient.get('/auth/me'),
    updateProfile: (data: any) => apiClient.put('/users/me/profile', data),
    getCredits: () => apiClient.get('/users/credits'),
    getCreditLedger: () => apiClient.get('/users/me/credit-ledger'),
    /**
     * Points expiry PR3 — batches whose `expiresAt` falls within the
     * window (default 30 days). Drives the dashboard "Points expiring
     * soon" banner. Returns {membership[], boost[], totalExpiringPoints,
     * windowDays}.
     */
    getExpiringSoonPoints: (windowDays = 30) =>
      apiClient.get<{
        membership: Array<{
          grantId: string;
          remaining: number;
          expiresAt: string | null;
          source: string | null;
        }>;
        boost: Array<{
          grantId: string;
          remaining: number;
          expiresAt: string | null;
          source: string | null;
        }>;
        totalExpiringPoints: number;
        windowDays: number;
      }>(`/users/me/credits/expiring-soon?windowDays=${windowDays}`),
    /** Full per-batch view across both credit types. Used by account drilldown. */
    getCreditBatches: () =>
      apiClient.get<{
        membership: Array<{
          grantId: string;
          amount: number;
          remaining: number;
          createdAt: string;
          expiresAt: string | null;
          source: string | null;
          description: string | null;
        }>;
        boost: Array<{
          grantId: string;
          amount: number;
          remaining: number;
          createdAt: string;
          expiresAt: string | null;
          source: string | null;
          description: string | null;
        }>;
      }>('/users/me/credits/batches'),
          updatePassword: (data: { currentPassword?: string; newPassword: string; skipCurrentPasswordCheck?: boolean }) =>
            apiClient.put('/users/me/password', data),
    /** Phase U1 — stamp onboardingCompletedAt server-side. Idempotent. */
    completeOnboarding: () =>
      apiClient.post<{ onboardingCompletedAt: string }>('/users/me/onboarding/complete'),
  },

  // Entries
  entries: {
    getUserEntries: () => apiClient.get('/entries/me'),
    getMyEntryCountsByDraw: () => apiClient.get('/entries/me/counts-by-draw'),
    getMyEntriesGrouped: (params?: {
      page?: number;
      limit?: number;
      drawType?: 'mini' | 'major';
      search?: string;
      sort?: 'newest' | 'oldest';
    }) => apiClient.get('/entries/me/grouped', { params }),
    hasEntryForDraw: (drawId: string) =>
      apiClient.get<{ hasEntry: boolean }>(`/entries/me/has-entry/${drawId}`),
    /** My Entries — expand one order to its entry (ticket) numbers. Scoped to the caller. */
    getMyOrderEntries: (orderNo: string) =>
      apiClient.get<{
        orderNo: string;
        drawId: string | null;
        count: number;
        entries: { id: string; ticketNumber: number | null; createdAt: string }[];
      }>(`/entries/me/order/${encodeURIComponent(orderNo)}`),
    /** My Entries — all of the caller's entry numbers in one draw, grouped by order. */
    getMyDrawEntryNumbers: (drawId: string) =>
      apiClient.get<{
        drawId: string;
        count: number;
        orders: { orderNo: string; entryNumbers: number[] }[];
      }>(`/entries/me/draw/${drawId}/numbers`),
    get: (id: string) => apiClient.get(`/entries/${id}`),
    getPublicDrawEntries: (
      drawId: string,
      orderNo?: string,
      page?: number,
      limit?: number,
    ) => apiClient.get(`/entries/public/draw/${drawId}`, {
      params: {
        orderNo,
        page,
        limit,
      },
    }),
  },

  // Stripe
  stripe: {
    createCheckoutSession: (data: any) => 
      apiClient.post('/stripe/create-checkout-session', data),
  },

  // FAQs
  faqs: {
    getAll: (category?: string) => apiClient.get('/faqs', { params: { category } }),
    get: (id: string) => apiClient.get(`/faqs/${id}`),
  },

  // Settings
  settings: {
    getAll: () => apiClient.get('/settings'),
    getByKey: (key: string) => apiClient.get(`/settings/${key}`),
    /** Public membership marketing landing config (must match admin `urlSlug`). */
    getPublicMembershipLanding: (slug: string) =>
      apiClient.get(`/settings/public/membership-landing/${slug}`),
  },

  // Banners
  banners: {
    getAll: () => apiClient.get('/banners'),
    getByPage: (page: string) => apiClient.get('/banners', { params: { page } }),
  },

  // Winners
  winners: {
    getAll: () => apiClient.get('/winners'),
    getPaginated: (page: number = 1, limit: number = 10) => 
      apiClient.get('/winners/paginated', { params: { page, limit } }),
    getRecent: (limit?: number) => apiClient.get('/winners/recent', { params: { limit } }),
    getFeatured: () => apiClient.get('/winners/featured'),
    get: (id: string) => apiClient.get(`/winners/${id}`),
  },

  // Contacts
  contacts: {
    create: (data: {
      name: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
    }) => apiClient.post('/contacts', data),
    getAll: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    }) => apiClient.get('/contacts', { params }),
    get: (id: string) => apiClient.get(`/contacts/${id}`),
    update: (id: string, data: any) => apiClient.put(`/contacts/${id}`, data),
    updateStatus: (id: string, status: string) => apiClient.put(`/contacts/${id}/status`, { status }),
    delete: (id: string) => apiClient.delete(`/contacts/${id}`),
  },

  // Newsletter
  newsletter: {
    subscribe: (email: string) => apiClient.post('/newsletter/subscribe', { email }),
    checkSubscription: () => apiClient.get('/newsletter/check/me'),
    unsubscribe: () => apiClient.post('/newsletter/unsubscribe/me'),
    getAll: (params?: {
      page?: number;
      limit?: number;
      search?: string;
    }) => apiClient.get('/newsletter', { params }),
    get: (id: string) => apiClient.get(`/newsletter/${id}`),
    delete: (id: string) => apiClient.delete(`/newsletter/${id}`),
  },

  // Waitlist
  waitlist: {
    add: (drawId: string) => apiClient.post(`/waitlist/${drawId}`),
    remove: (drawId: string) => apiClient.delete(`/waitlist/${drawId}`),
    check: (drawId: string) => apiClient.get(`/waitlist/check/${drawId}`),
    getMyWaitlist: () => apiClient.get('/waitlist/my-waitlist'),
  },

  // Promo Codes
  promoCodes: {
    validate: (code: string, orderAmount: number) => 
      apiClient.post('/promo-codes/validate', { code, orderAmount }),
  },

  // Payments
  payments: {
    createBoostPackCheckout: (data: {
      boostPackId: string;
      customerEmail: string;
      customerName: string;
      customerPhone?: string;
      promoCode?: string;
    }) => apiClient.post('/payments/checkout/boost-pack', data),
    createMembershipCheckout: (data: {
      planId: string;
      boostPackId?: string;
      customerEmail: string;
      customerName: string;
      customerPhone?: string;
      promoCode?: string;
    }) => apiClient.post('/payments/checkout/membership', data),
    createBoostPackPaymentIntent: (data: {
      boostPackId: string;
      customerEmail: string;
      customerName: string;
      customerPhone?: string;
      promoCode?: string;
    }) => apiClient.post('/payments/payment-intent/boost-pack', data),
    createMembershipPaymentIntent: (data: {
      planId: string;
      boostPackId?: string;
      customerEmail: string;
      customerName: string;
      customerPhone?: string;
      promoCode?: string;
    }) => apiClient.post('/payments/payment-intent/membership', data),
    /** Major draw landing: amount derived server-side from packageSnapshot.price */
    createMajorDrawLandingPaymentIntent: (data: {
      drawId: string;
      packageSnapshot: Record<string, unknown>;
      customerEmail: string;
      customerName: string;
      customerPhone: string;
    }) => apiClient.post('/payments/payment-intent/major-draw-landing', data),
    confirmPayment: (paymentId: string) => apiClient.post(`/payments/confirm/${paymentId}`),
    getPaymentBySession: (sessionId: string) => apiClient.get(`/payments/session/${sessionId}`),
    getPaymentById: (paymentId: string) => apiClient.get(`/payments/${paymentId}`),
    getPaymentsByUserId: (userId: string) => apiClient.get(`/payments/user/${userId}`),
    getPaymentMethod: () => apiClient.get('/payments/payment-method/me'),
    createBillingPortalSession: (returnUrl: string) => apiClient.post('/payments/billing-portal', { returnUrl }),
    createSetupIntentForUpdateCard: () => apiClient.post<{ clientSecret: string }>('/payments/setup-intent/update-card'),
    setDefaultPaymentMethod: (paymentMethodId: string) => apiClient.post('/payments/set-default-payment-method', { paymentMethodId }),
    detachPaymentMethod: (paymentMethodId: string) => apiClient.post('/payments/detach-payment-method', { paymentMethodId }),
    listPaymentMethods: () => apiClient.get<{ id: string; brand: string; last4: string; exp_month: number; exp_year: number; isDefault: boolean }[]>('/payments/payment-methods/me'),
    retryFailedInvoice: () => apiClient.post('/payments/retry-failed-invoice'),
  },

  // Receipts (Scan Receipts feature — Phase 2 skeleton)
  // Backend endpoints are member-only via JwtAuthGuard + ActiveMemberGuard.
  // 401 → handled by global response interceptor (clears token).
  // 403 with `code: 'MEMBERSHIP_REQUIRED'` propagates as a normal axios error;
  //   callers detect via `error.response?.data?.code === 'MEMBERSHIP_REQUIRED'`.
  receipts: {
    upload: (file: File, idempotencyKey?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
      if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
      return apiClient.post<{ id: string; status: string; message: string }>('/receipts/upload', formData, { headers });
    },
    getMyReceipts: (params?: { status?: string; page?: number; limit?: number }) =>
      apiClient.get<{ items: any[]; page: number; limit: number; total: number }>('/receipts/me', { params }),
    getById: (id: string) =>
      apiClient.get<any>(`/receipts/${id}`),
  },

  // Phase GP4 — Gift card catalog + Redemptions
  giftCards: {
    list: () => apiClient.get<any[]>('/gift-cards'),
    getById: (brandId: string) => apiClient.get<any>(`/gift-cards/${encodeURIComponent(brandId)}`),
  },
  redemptions: {
    /* 2026-05-20 — Prezzee-delivers mode: recipient fields required by backend. */
    create: (body: {
      brandId: string;
      brandName: string;
      denominationId: string;
      providerSku: string;
      valueAud: number;
      pointsRequired: number;
      providerCostAud: number;
      quantity?: number;
      idempotencyKey: string;
      channel?: 'web' | 'ios' | 'android';
      /** Defaults to member's own email on backend if omitted. */
      recipientEmail?: string;
      recipientName?: string;
      giftMessage?: string;
      giftStyleCode?: string;
    }) => apiClient.post<any>('/redemptions', body),
    /** Cohort gate — UI checks this on page load to decide CTA state. */
    eligibility: () =>
      apiClient.get<{ eligible: boolean; reason: string | null }>(
        '/redemptions/eligibility',
      ),
    /** Bounce recovery — asks Prezzee to re-send the gift email. */
    resendEmail: (id: string) =>
      apiClient.post<{ id: string; status: string; emailDeliveryStatus: string | null }>(
        `/redemptions/${encodeURIComponent(id)}/resend-email`,
        {},
      ),
    getMyHistory: () => apiClient.get<any[]>('/redemptions'),
    getById: (id: string) => apiClient.get<any>(`/redemptions/${encodeURIComponent(id)}`),
  },
};

export default api;

