'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';
import UpdateCardModal from '@/components/UpdateCardModal';

export type PaymentMethodRow = {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  isDefault: boolean;
};

type PaymentMethodsPanelProps = {
  title?: string;
  wrapperClassName?: string;
  /** Runs after payment methods reload and refreshUser (e.g. retry failed invoice). */
  onCardsChanged?: () => void | Promise<void>;
  /** Forwarded to UpdateCardModal when nested inside another modal. */
  updateCardOverlayClassName?: string;
  /** Increment to force reloading the list from the API (e.g. after Stripe billing portal return). */
  refreshSignal?: number;
};

export default function PaymentMethodsPanel({
  title = 'Billing',
  wrapperClassName = 'space-y-4',
  onCardsChanged,
  updateCardOverlayClassName,
  refreshSignal = 0,
}: PaymentMethodsPanelProps) {
  const { refreshUser } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateCardModal, setShowUpdateCardModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const loadPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.payments.listPaymentMethods();
      setPaymentMethods(Array.isArray(res.data) ? res.data : []);
    } catch (error: unknown) {
      console.error('Error loading payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPaymentMethods();
  }, [loadPaymentMethods, refreshSignal]);

  const runAfterChange = async () => {
    await loadPaymentMethods();
    await refreshUser();
    if (onCardsChanged) await onCardsChanged();
  };

  const handleUpdateCard = () => {
    setShowUpdateCardModal(true);
  };

  const handleUpdateCardSuccess = async () => {
    await runAfterChange();
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    setOpenMenuId(null);
    try {
      await api.payments.setDefaultPaymentMethod(paymentMethodId);
      await runAfterChange();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to set default', 'error');
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    setOpenMenuId(null);
    if (!confirm('Remove this card? It will no longer be available for payments.')) return;
    try {
      await api.payments.detachPaymentMethod(paymentMethodId);
      await runAfterChange();
      showToast('Card removed successfully.', 'success');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to remove card', 'error');
    }
  };

  const getCardBrandColor = (brand?: string) => {
    const brandMap: Record<string, string> = {
      visa: 'bg-blue-600',
      mastercard: 'bg-red-600',
      amex: 'bg-blue-500',
      discover: 'bg-orange-600',
    };
    return brandMap[brand?.toLowerCase() || ''] || 'bg-gray-600';
  };

  const getCardBrandName = (brand?: string) => {
    if (!brand) return 'CARD';
    return brand.toUpperCase();
  };

  const formatExpiryLabel = (month: number, year: number) => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const m = month >= 1 && month <= 12 ? months[month - 1] : 'N/A';
    return `Expires ${m} ${year}`;
  };

  return (
    <>
      <div className={wrapperClassName}>
        {title ? <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2> : null}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Payment methods</label>
              <button
                type="button"
                onClick={handleUpdateCard}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-500 hover:text-purple-600 transition"
                title="Add card"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {paymentMethods.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-600">No payment methods on file.</p>
                <p className="text-sm text-gray-500 mt-1">Add a card to pay for membership or boost packs.</p>
                <button
                  type="button"
                  onClick={handleUpdateCard}
                  className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition"
                >
                  Add card
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {paymentMethods.map((pm) => (
                  <li key={pm.id} className="py-4 first:pt-0 flex items-center gap-3 group">
                    <div
                      className={`w-10 h-7 ${getCardBrandColor(pm.brand)} rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                    >
                      {getCardBrandName(pm.brand)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-800 font-medium">
                        {getCardBrandName(pm.brand)} •••• {pm.last4}
                      </span>
                      {pm.isDefault && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Default
                        </span>
                      )}
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatExpiryLabel(pm.exp_month, pm.exp_year)}
                      </p>
                    </div>
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === pm.id ? null : pm.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        aria-label="Options"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {openMenuId === pm.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                            aria-hidden="true"
                          />
                          <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                            {!pm.isDefault && (
                              <button
                                type="button"
                                onClick={() => void handleSetDefault(pm.id)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Set as default
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleRemove(pm.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-gray-500 mt-4">
              Card details are managed by Stripe (PCI Level 1). We only show brand, last 4 digits and expiry from
              Stripe.
            </p>
          </div>
        )}
      </div>

      <UpdateCardModal
        open={showUpdateCardModal}
        onClose={() => setShowUpdateCardModal(false)}
        onSuccess={handleUpdateCardSuccess}
        overlayClassName={updateCardOverlayClassName}
      />
    </>
  );
}
