'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { formatOrderCode } from '@/lib/payment';

function VnpayReturnContent() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get('status');
  const orderId = params.get('orderId');

  const [amount, setAmount] = useState<number | null>(null);

  // Đơn đã được xác nhận ngay ở bước return (server-side) → hiển thị thành công tức thì.
  // Chỉ lấy thêm số tiền để hiển thị (không chặn UI, không cần chờ).
  useEffect(() => {
    if (status !== 'success' || !orderId) return;
    api.get(`/orders/my/${orderId}`)
      .then(({ data }) => setAmount(Number(data.data.total_price)))
      .catch(() => {});
  }, [status, orderId]);

  const orderCode = orderId ? formatOrderCode(Number(orderId)) : '';

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-1">Thanh toán thành công!</h2>
        <p className="text-gray-500 text-sm">Mã đơn: <span className="font-semibold text-gray-800">{orderCode}</span></p>
        {amount != null && (
          <p className="text-gray-500 text-sm mt-1">Số tiền: <span className="font-semibold text-primary">{formatCurrency(amount)}</span></p>
        )}
        <div className="flex gap-3 justify-center mt-8">
          <button type="button" onClick={() => router.push('/orders')} className="btn-primary px-6 py-3">Xem đơn hàng</button>
          <button type="button" onClick={() => router.push('/')} className="btn-outline px-6 py-3">Tiếp tục mua sắm</button>
        </div>
      </div>
    );
  }

  const isInvalid = status === 'invalid' || status === 'error';
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {isInvalid ? (
        <ShieldAlert size={56} className="text-amber-500 mx-auto mb-4" />
      ) : (
        <XCircle size={56} className="text-red-500 mx-auto mb-4" />
      )}
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">
        {isInvalid ? 'Không xác thực được giao dịch' : 'Thanh toán chưa hoàn tất'}
      </h2>
      <p className="text-gray-500 text-sm">
        {isInvalid
          ? 'Chữ ký giao dịch không hợp lệ hoặc đã xảy ra lỗi. Vui lòng thử lại.'
          : 'Giao dịch đã bị hủy hoặc không thành công. Đơn hàng vẫn đang chờ thanh toán.'}
      </p>
      {orderCode && <p className="text-gray-400 text-xs mt-2">Mã đơn: {orderCode}</p>}
      <div className="flex gap-3 justify-center mt-8">
        <button type="button" onClick={() => router.push('/orders')} className="btn-primary px-6 py-3">Xem đơn hàng</button>
        <button type="button" onClick={() => router.push('/')} className="btn-outline px-6 py-3">Về trang chủ</button>
      </div>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <UserLayout>
      <Suspense fallback={<div className="py-20 text-center text-gray-400">Đang tải...</div>}>
        <VnpayReturnContent />
      </Suspense>
    </UserLayout>
  );
}
