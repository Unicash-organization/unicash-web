import api from '@/lib/api';
import { showToast } from '@/lib/toast';

type NotifyOptions = {
  /** When true, no toast if membership is already not past_due / payment_failed (e.g. after removing a card while subscribed). */
  quietIfMembershipHealthy?: boolean;
};

/**
 * Check membership status and retry a failed invoice when still past_due / payment_failed.
 * Call after payment method changes (Stripe return URL or in-app card update).
 */
export async function notifyAndRetryMembershipAfterPaymentUpdate(
  options?: NotifyOptions,
): Promise<void> {
  const updatedMembership = await api.membership.getUserMembership().catch(() => ({ data: null }));

  const healthy =
    updatedMembership.data?.status !== 'payment_failed' &&
    updatedMembership.data?.status !== 'past_due';

  if (healthy) {
    if (!options?.quietIfMembershipHealthy) {
      showToast('Payment method updated successfully! Your membership is now active.', 'success');
    }
    return;
  }

  try {
    const retryResult = await api.payments.retryFailedInvoice();
    if (retryResult.data?.success) {
      const finalMembership = await api.membership.getUserMembership().catch(() => ({ data: null }));
      if (
        finalMembership.data?.status !== 'payment_failed' &&
        finalMembership.data?.status !== 'past_due'
      ) {
        showToast(
          'Payment method updated and invoice paid successfully! Your membership is now active.',
          'success',
        );
      } else {
        showToast(
          'Payment method updated. We attempted to retry your payment. Please check back in a moment.',
          'info',
        );
      }
    } else {
      showToast(
        'Payment method updated. We attempted to retry your payment, but it may still be processing. Please check back in a few minutes.',
        'info',
      );
    }
  } catch (retryError: unknown) {
    console.error('Error retrying invoice:', retryError);
    showToast(
      'Payment method updated. Stripe will automatically retry your payment. Please check back in a few minutes.',
      'info',
    );
  }
}
