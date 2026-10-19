export function calculateDiscount(price: number, previousPrice?: number): number {
  if (!previousPrice || previousPrice <= price || price < 0) return 0;
  return Math.round(((previousPrice - price) / previousPrice) * 100);
}

export function calculateCartTotal(
  items: Array<{ price: number; quantity: number }>,
  deliveryCharge: number,
  discount: number = 0
): { subtotal: number; total: number } {
  const safeItems = items.filter(i => i.price >= 0 && i.quantity > 0);
  const subtotal = safeItems.reduce((sum, item) => sum + (Math.max(0, item.price) * Math.max(1, Math.floor(item.quantity))), 0);
  
  // Safe delivery fee: cannot be negative
  const safeDelivery = Math.max(0, deliveryCharge);
  
  // Safe discount: cannot be negative, cannot exceed subtotal, hard capped at max 300
  const safeDiscount = Math.min(300, Math.min(Math.max(0, discount), subtotal));
  
  const total = Math.max(0, subtotal - safeDiscount + safeDelivery);
  return { subtotal, total };
}

export function getDeliveryFee(district: string, insideFee: number = 60, outsideFee: number = 120, freeThreshold?: number, subtotal?: number): number {
  if (freeThreshold !== undefined && subtotal !== undefined && subtotal >= freeThreshold) {
    return 0;
  }
  const cleanDistrict = (district || '').trim().toLowerCase();
  return cleanDistrict === 'dhaka' ? Math.max(0, insideFee) : Math.max(0, outsideFee);
}

export function sanitizeText(input: string, maxLength: number = 250): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Strip HTML tags to prevent XSS injection
    .trim()
    .slice(0, maxLength);
}
