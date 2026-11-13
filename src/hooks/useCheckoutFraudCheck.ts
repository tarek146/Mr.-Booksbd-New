import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDocsFromCache } from 'firebase/firestore';
import { db, getQueryDocsCacheFirst } from '../firebase';
import { Order, StoreSettings } from '../types';
import { normalizeBdPhone11, isValidBdPhone11 } from '../utils/steadfastCourierService';

export interface CheckoutFraudCheckResult {
  isFlagged: boolean;
  cancellationRate: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  riskLevel: 'trusted' | 'moderate' | 'high_risk' | 'unknown';
  riskMessage: string;
  isLoading: boolean;
}

/**
 * Custom hook for the checkout flow that fetches order history from Firestore
 * based on the user's input phone number, calculates the total cancellation rate,
 * and flags the user in the UI if the rate exceeds the configured threshold.
 */
export function useCheckoutFraudCheck(
  phone: string,
  contextOrders: Order[] = [],
  settings?: Partial<StoreSettings> | null
): CheckoutFraudCheckResult {
  const [result, setResult] = useState<CheckoutFraudCheckResult>({
    isFlagged: false,
    cancellationRate: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    riskLevel: 'unknown',
    riskMessage: '',
    isLoading: false,
  });

  const threshold = typeof settings?.cancellationFraudThreshold === 'number' && !isNaN(settings.cancellationFraudThreshold)
    ? settings.cancellationFraudThreshold
    : 30; // default 30% cancellation threshold

  useEffect(() => {
    const digits = normalizeBdPhone11(phone);
    if (!isValidBdPhone11(digits)) {
      setResult({
        isFlagged: false,
        cancellationRate: 0,
        totalOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        riskLevel: 'unknown',
        riskMessage: '',
        isLoading: false,
      });
      return;
    }

    let isMounted = true;
    setTimerAndFetch(digits);

    async function setTimerAndFetch(normPhone: string) {
      setResult(prev => ({ ...prev, isLoading: true }));

      // 1. Filter local context orders first
      const localMatched = (contextOrders || []).filter(
        o => !o.isTrashed && normalizeBdPhone11(o.phone) === normPhone
      );

      let fetchedOrders: Order[] = [...localMatched];

      // 2. Fetch directly from Firestore collection 'orders' by phone
      try {
        const q = query(collection(db, 'orders'), where('phone', '==', normPhone));
        const { items } = await getQueryDocsCacheFirst<Order>(q, 'cache-first');
        if (items && items.length > 0) {
          const combinedMap = new Map<string, Order>();
          [...localMatched, ...items].forEach(ord => {
            if (ord && ord.id) combinedMap.set(ord.id, ord);
          });
          fetchedOrders = Array.from(combinedMap.values()).filter(o => !o.isTrashed);
        }
      } catch (err) {
        console.warn('Firestore order history fetch for fraud check notice:', err);
      }

      if (!isMounted) return;

      const totalOrders = fetchedOrders.length;
      const deliveredOrders = fetchedOrders.filter(o => o.orderStatus === 'delivered').length;
      const cancelledOrders = fetchedOrders.filter(o => o.orderStatus === 'cancelled').length;
      const finishedOrders = deliveredOrders + cancelledOrders;

      let cancellationRate = 0;
      if (finishedOrders > 0) {
        cancellationRate = Math.round((cancelledOrders / finishedOrders) * 100);
      } else if (totalOrders > 0) {
        cancellationRate = Math.round((cancelledOrders / totalOrders) * 100);
      }

      const isFlagged = totalOrders >= 2 && cancellationRate >= threshold;

      let riskLevel: CheckoutFraudCheckResult['riskLevel'] = 'trusted';
      let riskMessage = 'Trusted customer history with reliable delivery record.';

      if (totalOrders === 0) {
        riskLevel = 'unknown';
        riskMessage = 'New customer with no prior order history.';
      } else if (isFlagged || cancellationRate >= threshold) {
        riskLevel = 'high_risk';
        riskMessage = `High cancellation rate detected (${cancellationRate}% cancelled out of ${totalOrders} orders, exceeding ${threshold}% threshold).`;
      } else if (cancelledOrders > 0 || cancellationRate > 15) {
        riskLevel = 'moderate';
        riskMessage = `Moderate order history (${deliveredOrders} delivered, ${cancelledOrders} cancelled).`;
      }

      setResult({
        isFlagged,
        cancellationRate,
        totalOrders,
        deliveredOrders,
        cancelledOrders,
        riskLevel,
        riskMessage,
        isLoading: false,
      });
    }

    return () => {
      isMounted = false;
    };
  }, [phone, contextOrders, threshold]);

  return result;
}
