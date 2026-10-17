export function calculateDiscount(price: number, previousPrice?: number): number {
  if (!previousPrice || previousPrice <= price) return 0;
  return Math.round(((previousPrice - price) / previousPrice) * 100);
}

export function calculateCartTotal(
  items: Array<{ price: number; quantity: number }>,
  deliveryCharge: number,
  discount: number = 0
): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount + deliveryCharge);
  return { subtotal, total };
}

export function getDeliveryFee(district: string, insideFee: number = 60, outsideFee: number = 120): number {
  return district.trim().toLowerCase() === 'dhaka' ? insideFee : outsideFee;
}
