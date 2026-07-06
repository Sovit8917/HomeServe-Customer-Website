// Loads the Razorpay Checkout.js SDK once and resolves when ready.
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
}

export interface OpenRazorpayCheckoutArgs {
  order: RazorpayOrderResponse;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  onDismiss?: () => void;
}

export async function openRazorpayCheckout({
  order,
  name,
  description,
  prefill,
  onSuccess,
  onDismiss,
}: OpenRazorpayCheckoutArgs) {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error('Failed to load Razorpay SDK. Check your internet connection.');

  const keyId = order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) throw new Error('Razorpay key is not configured (NEXT_PUBLIC_RAZORPAY_KEY_ID).');

  const options = {
    key: keyId,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'HomeServe',
    description,
    order_id: order.orderId,
    prefill,
    theme: { color: '#f97316' },
    modal: {
      ondismiss: () => onDismiss?.(),
    },
    handler: (response: any) => {
      onSuccess({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.on('payment.failed', () => onDismiss?.());
  rzp.open();
}
