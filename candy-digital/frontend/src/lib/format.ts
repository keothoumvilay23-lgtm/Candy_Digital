type CurrencyValue = number | string | null | undefined;

export const formatCurrency = (value: CurrencyValue) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) return '0đ';

  return `${amount.toLocaleString('vi-VN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}đ`;
};
