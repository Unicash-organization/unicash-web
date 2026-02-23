import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
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
  // Auth
  auth: {
    login: (email: string, password: string, deviceId?: string) => 
      apiClient.post('/auth/login', { email, password, deviceId }),
    register: (data: any) => 
      apiClient.post('/auth/register', data),
    me: () => 
      apiClient.get('/auth/me'),
    // Social Login
    getSocialLoginUrl: (provider: 'google' | 'facebook' | 'github' | 'apple', redirectTo?: string) => {
      const params = redirectTo ? { redirectTo } : {};
      return apiClient.get(`/auth/social/${provider}`, { params });
    },
    handleOAuthCallback: (code: string, provider?: string) =>
      apiClient.post('/auth/social/callback', { code, provider }),
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
  },

  // Draws
  draws: {
    getAll: (userId?: string) => {
      const params = userId ? { userId } : {};
      return apiClient.get('/draws', { params });
    },
    get: (id: string, userId?: string) => {
      const params = userId ? { userId } : {};
      return apiClient.get(`/draws/${id}`, { params });
    },
    enter: (drawId: string, idempotencyKey?: string) => {
      const headers: any = {};
      if (idempotencyKey) {
        headers['idempotency-key'] = idempotencyKey;
      }
      return apiClient.post(`/draws/${drawId}/enter`, {}, { headers });
    },
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
    cancelUpgrade: () => apiClient.post('/membership/me/cancel-upgrade'),
    upgrade: (newPlanId: string) => apiClient.post('/membership/me/upgrade', { newPlanId }),
  },

  // Users
  users: {
    getProfile: () => apiClient.get('/auth/me'),
    updateProfile: (data: any) => apiClient.put('/users/me/profile', data),
    getCredits: () => apiClient.get('/users/credits'),
    getCreditLedger: () => apiClient.get('/users/me/credit-ledger'),
          updatePassword: (data: { currentPassword?: string; newPassword: string; skipCurrentPasswordCheck?: boolean }) => 
            apiClient.put('/users/me/password', data),
  },

  // Entries
  entries: {
    getUserEntries: () => apiClient.get('/entries/me'),
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
};

export default api;

