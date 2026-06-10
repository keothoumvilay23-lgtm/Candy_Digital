export interface PaymentSetting {
  id: number;
  method: string;
  label: string;
  is_active: number;
  account_name: string | null;
  account_number: string | null;
  bank_code: string | null;
  bank_name: string | null;
  qr_image_url: string | null;
  instruction: string | null;
}

export function formatOrderCode(orderId: number): string {
  return `DH${String(orderId).padStart(6, '0')}`;
}

export function buildVietQR(
  bankCode: string,
  account: string,
  opts?: { accountName?: string | null; amount?: number; addInfo?: string }
): string {
  if (!bankCode || !account) return '';
  const params = new URLSearchParams();
  if (opts?.accountName) params.set('accountName', opts.accountName);
  if (opts?.amount != null && opts.amount > 0) params.set('amount', String(Math.round(opts.amount)));
  if (opts?.addInfo) params.set('addInfo', opts.addInfo);
  return `https://img.vietqr.io/image/${bankCode}-${account}-compact2.png?${params.toString()}`;
}

export function resolveQrImageUrl(
  setting: PaymentSetting | undefined,
  imgBase: string,
  orderCode: string,
  amount: number
): string {
  if (!setting) return '';
  if (setting.qr_image_url) {
    return setting.qr_image_url.startsWith('http')
      ? setting.qr_image_url
      : `${imgBase}${setting.qr_image_url}`;
  }
  if (setting.method === 'bank_transfer' && setting.bank_code && setting.account_number) {
    return buildVietQR(setting.bank_code, setting.account_number, {
      accountName: setting.account_name,
      amount,
      addInfo: orderCode,
    });
  }
  return '';
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  momo: 'Ví MoMo',
  zalopay: 'ZaloPay',
  vnpay: 'VNPay (ATM/QR/Thẻ quốc tế)',
};
