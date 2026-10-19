import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  ChevronRight,
  Filter,
  BarChart3,
  Percent,
  RefreshCw
} from 'lucide-react';
import { Order, Product, PaymentSubmission } from '../../types';

interface AdminAnalyticsProps {
  orders: Order[];
  products: Product[];
  paymentSubmissions: PaymentSubmission[];
  onSelectTab?: (tab: string) => void;
  onSelectOrder?: (orderId: string) => void;
}

type TimeRange = 'today' | 'yesterday' | '7days' | '30days' | 'all';

export function AdminAnalytics({
  orders,
  products,
  paymentSubmissions,
  onSelectTab
}: AdminAnalyticsProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('today');
  const [activeChartMetric, setActiveChartMetric] = useState<'revenue' | 'orders'>('revenue');

  // Timestamps for boundaries
  const timeMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const endOfYesterday = startOfToday - 1;
    const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const startOf30Days = startOfToday - 30 * 24 * 60 * 60 * 1000;
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Today's orders
    const todayOrders = orders.filter(o => o.createdAt >= startOfToday);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const todayVerifiedRevenue = todayOrders
      .filter(o => o.paymentStatus === 'approved')
      .reduce((sum, o) => sum + o.total, 0);

    // Yesterday's orders
    const yesterdayOrders = orders.filter(o => o.createdAt >= startOfYesterday && o.createdAt <= endOfYesterday);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);
    const yesterdayVerifiedRevenue = yesterdayOrders
      .filter(o => o.paymentStatus === 'approved')
      .reduce((sum, o) => sum + o.total, 0);

    // 7 days orders
    const sevenDaysOrders = orders.filter(o => o.createdAt >= startOf7Days);
    const sevenDaysRevenue = sevenDaysOrders.reduce((sum, o) => sum + o.total, 0);

    // 30 days orders (1 month)
    const thirtyDaysOrders = orders.filter(o => o.createdAt >= startOf30Days);
    const thirtyDaysRevenue = thirtyDaysOrders.reduce((sum, o) => sum + o.total, 0);
    const thirtyDaysVerifiedRevenue = thirtyDaysOrders
      .filter(o => o.paymentStatus === 'approved')
      .reduce((sum, o) => sum + o.total, 0);

    // This month (calendar month)
    const monthOrders = orders.filter(o => o.createdAt >= startOfThisMonth);
    const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0);

    // All time
    const allRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const allVerifiedRevenue = orders
      .filter(o => o.paymentStatus === 'approved')
      .reduce((sum, o) => sum + o.total, 0);

    // Growth comparisons: Today vs Yesterday
    const orderCountGrowth = yesterdayOrders.length > 0 
      ? Math.round(((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100)
      : todayOrders.length > 0 ? 100 : 0;

    const revenueGrowth = yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : todayRevenue > 0 ? 100 : 0;

    return {
      today: {
        orders: todayOrders,
        count: todayOrders.length,
        revenue: todayRevenue,
        verifiedRevenue: todayVerifiedRevenue,
        aov: todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0,
        growth: orderCountGrowth,
        revGrowth: revenueGrowth
      },
      yesterday: {
        orders: yesterdayOrders,
        count: yesterdayOrders.length,
        revenue: yesterdayRevenue,
        verifiedRevenue: yesterdayVerifiedRevenue,
        aov: yesterdayOrders.length > 0 ? Math.round(yesterdayRevenue / yesterdayOrders.length) : 0
      },
      sevenDays: {
        orders: sevenDaysOrders,
        count: sevenDaysOrders.length,
        revenue: sevenDaysRevenue,
        aov: sevenDaysOrders.length > 0 ? Math.round(sevenDaysRevenue / sevenDaysOrders.length) : 0
      },
      thirtyDays: {
        orders: thirtyDaysOrders,
        count: thirtyDaysOrders.length,
        revenue: thirtyDaysRevenue,
        verifiedRevenue: thirtyDaysVerifiedRevenue,
        aov: thirtyDaysOrders.length > 0 ? Math.round(thirtyDaysRevenue / thirtyDaysOrders.length) : 0,
        dailyAverageOrders: Math.round((thirtyDaysOrders.length / 30) * 10) / 10,
        dailyAverageRevenue: Math.round(thirtyDaysRevenue / 30)
      },
      thisMonth: {
        orders: monthOrders,
        count: monthOrders.length,
        revenue: monthRevenue
      },
      allTime: {
        orders: orders,
        count: orders.length,
        revenue: allRevenue,
        verifiedRevenue: allVerifiedRevenue,
        aov: orders.length > 0 ? Math.round(allRevenue / orders.length) : 0
      }
    };
  }, [orders]);

  // Current selected active filtered orders
  const currentOrders = useMemo(() => {
    switch (selectedRange) {
      case 'today':
        return timeMetrics.today.orders;
      case 'yesterday':
        return timeMetrics.yesterday.orders;
      case '7days':
        return timeMetrics.sevenDays.orders;
      case '30days':
        return timeMetrics.thirtyDays.orders;
      case 'all':
      default:
        return orders;
    }
  }, [selectedRange, timeMetrics, orders]);

  // Aggregate stats for currently selected range
  const currentStats = useMemo(() => {
    const count = currentOrders.length;
    const totalRev = currentOrders.reduce((sum, o) => sum + o.total, 0);
    const verifiedRev = currentOrders
      .filter(o => o.paymentStatus === 'approved')
      .reduce((sum, o) => sum + o.total, 0);
    const pendingVerifCount = currentOrders.filter(o => o.orderStatus === 'awaiting_payment_verification').length;
    const confirmedCount = currentOrders.filter(o => o.orderStatus === 'confirmed').length;
    const processingCount = currentOrders.filter(o => o.orderStatus === 'processing').length;
    const deliveredCount = currentOrders.filter(o => o.orderStatus === 'delivered').length;
    const cancelledCount = currentOrders.filter(o => o.orderStatus === 'cancelled').length;
    const aov = count > 0 ? Math.round(totalRev / count) : 0;

    return {
      count,
      totalRev,
      verifiedRev,
      pendingVerifCount,
      confirmedCount,
      processingCount,
      deliveredCount,
      cancelledCount,
      aov
    };
  }, [currentOrders]);

  // Payment methods breakdown for current orders
  const paymentBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; total: number; name: string }> = {};

    currentOrders.forEach(o => {
      const methodKey = o.paymentMethodId || 'other';
      const methodName = o.paymentMethodName || methodKey.toUpperCase();
      if (!breakdown[methodKey]) {
        breakdown[methodKey] = { count: 0, total: 0, name: methodName };
      }
      breakdown[methodKey].count += 1;
      breakdown[methodKey].total += o.total;
    });

    return Object.entries(breakdown).map(([key, val]) => ({
      key,
      ...val,
      percentage: currentStats.totalRev > 0 ? Math.round((val.total / currentStats.totalRev) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [currentOrders, currentStats.totalRev]);

  // Daily Chart for last 14 days
  const dailyChartData = useMemo(() => {
    const days = 14;
    const now = new Date();
    const data: Array<{
      dateLabel: string;
      fullDate: string;
      orderCount: number;
      revenue: number;
      timestamp: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const startOfDay = d.getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

      const dayOrders = orders.filter(o => o.createdAt >= startOfDay && o.createdAt <= endOfDay);
      const dayRev = dayOrders.reduce((sum, o) => sum + o.total, 0);

      data.push({
        dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: d.toLocaleDateString('en-GB'),
        orderCount: dayOrders.length,
        revenue: dayRev,
        timestamp: startOfDay
      });
    }

    const maxRev = Math.max(...data.map(d => d.revenue), 1000);
    const maxOrders = Math.max(...data.map(d => d.orderCount), 5);

    return { data, maxRev, maxOrders };
  }, [orders]);

  // Inventory Health: low stock & out of stock
  const inventoryAlerts = useMemo(() => {
    const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 15);
    const outOfStockItems = products.filter(p => p.stock <= 0);
    return { lowStockItems, outOfStockItems };
  }, [products]);

  // Range label mapping
  const rangeLabels: Record<TimeRange, { label: string; bnLabel: string }> = {
    today: { label: 'Today', bnLabel: 'আজকের অর্ডার' },
    yesterday: { label: 'Yesterday', bnLabel: 'কালকের অর্ডার' },
    '7days': { label: 'Last 7 Days', bnLabel: 'গত ৭ দিনের অর্ডার' },
    '30days': { label: 'This Month (30 Days)', bnLabel: 'এক মাসের অর্ডার' },
    all: { label: 'All Time', bnLabel: 'সর্বমোট অর্ডার' }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      
      {/* 1. Header Filter Bar & Time Switcher */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Live Business Analytics & Order Breakdown
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <BarChart3 className="text-[#D71920]" size={24} />
            <span>অ্যানালিটিক্স ড্যাশবোর্ড • {rangeLabels[selectedRange].bnLabel}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial metrics, sales timeline, and comparative orders breakdown.
          </p>
        </div>

        {/* Time Window Selector Pills */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center flex-wrap gap-1 border border-slate-200 w-full md:w-auto">
          {(['today', 'yesterday', '7days', '30days', 'all'] as TimeRange[]).map((range) => {
            const isSelected = selectedRange === range;
            return (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 md:flex-none text-center ${
                  isSelected
                    ? 'bg-[#D71920] text-white shadow-md shadow-[#D71920]/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <span>{rangeLabels[range].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top-Level Comparative Summary: Today vs Yesterday vs 1 Month (Direct User Requirement) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Card A: আজকের অর্ডার (Today's Orders) */}
        <div className={`p-6 rounded-3xl border transition-all ${
          selectedRange === 'today' 
            ? 'bg-gradient-to-br from-red-50/80 via-white to-red-50/30 border-[#D71920] shadow-md ring-2 ring-[#D71920]/20' 
            : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#D71920] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                আজ
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">আজকের অর্ডার</h3>
                <span className="text-[11px] text-slate-500">Today's Live Orders</span>
              </div>
            </div>
            {timeMetrics.today.growth >= 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <ArrowUpRight size={13} /> +{timeMetrics.today.growth}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                <ArrowDownRight size={13} /> {timeMetrics.today.growth}%
              </span>
            )}
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {timeMetrics.today.count}
              </span>
              <span className="text-xs font-bold text-slate-500 ml-1.5">orders</span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black text-[#D71920]">
                ৳{timeMetrics.today.revenue.toLocaleString()}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">gross volume</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Verified Paid: <strong>৳{timeMetrics.today.verifiedRevenue}</strong></span>
            <span>AOV: <strong>৳{timeMetrics.today.aov}</strong></span>
          </div>
        </div>

        {/* Card B: কালকের অর্ডার (Yesterday's Orders) */}
        <div className={`p-6 rounded-3xl border transition-all ${
          selectedRange === 'yesterday' 
            ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border-amber-500 shadow-md ring-2 ring-amber-500/20' 
            : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                কাল
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">কালকের অর্ডার</h3>
                <span className="text-[11px] text-slate-500">Yesterday's Total</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Past 24h
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {timeMetrics.yesterday.count}
              </span>
              <span className="text-xs font-bold text-slate-500 ml-1.5">orders</span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black text-amber-700">
                ৳{timeMetrics.yesterday.revenue.toLocaleString()}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">total sales</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Verified: <strong>৳{timeMetrics.yesterday.verifiedRevenue}</strong></span>
            <span>Average: <strong>৳{timeMetrics.yesterday.aov}</strong></span>
          </div>
        </div>

        {/* Card C: এক মাসের অর্ডার (This Month / 30 Days) */}
        <div className={`p-6 rounded-3xl border transition-all ${
          selectedRange === '30days' 
            ? 'bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 border-blue-600 shadow-md ring-2 ring-blue-600/20' 
            : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                মাস
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">এক মাসের অর্ডার</h3>
                <span className="text-[11px] text-slate-500">Last 30 Days Cumulative</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              30 Days
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {timeMetrics.thirtyDays.count}
              </span>
              <span className="text-xs font-bold text-slate-500 ml-1.5">orders</span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black text-blue-700">
                ৳{timeMetrics.thirtyDays.revenue.toLocaleString()}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">monthly revenue</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Daily Avg: <strong>{timeMetrics.thirtyDays.dailyAverageOrders} orders</strong></span>
            <span>Daily Rev: <strong>৳{timeMetrics.thirtyDays.dailyAverageRevenue}</strong></span>
          </div>
        </div>

      </div>

      {/* 3. Detailed KPI Grid for the Selected Window */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Total Orders</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Package size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {currentStats.count}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">In selected timeframe</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Gross Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
            ৳{currentStats.totalRev.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Verified: ৳{currentStats.verifiedRev.toLocaleString()}
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Average Order Value</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Percent size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-2">
            ৳{currentStats.aov.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Basket size average</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            {currentStats.pendingVerifCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Needs verification match</p>
        </div>

      </div>

      {/* 4. Interactive 14-Day Sales & Order Volume Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#D71920]" />
              <span>14-Day Sales Trend & Order Velocity (দৈনিক বিক্রয় গ্রাফ)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily revenue and order count over the last 14 days across all payment channels.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setActiveChartMetric('revenue')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartMetric === 'revenue' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue (৳)
            </button>
            <button
              onClick={() => setActiveChartMetric('orders')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartMetric === 'orders' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Orders Count
            </button>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="pt-4">
          <div className="h-48 sm:h-56 flex items-end gap-2 sm:gap-3.5 border-b border-slate-200 pb-2">
            {dailyChartData.data.map((day, idx) => {
              const value = activeChartMetric === 'revenue' ? day.revenue : day.orderCount;
              const maxValue = activeChartMetric === 'revenue' ? dailyChartData.maxRev : dailyChartData.maxOrders;
              const heightPercent = maxValue > 0 ? Math.max(Math.round((value / maxValue) * 100), 4) : 4;
              const isToday = idx === dailyChartData.data.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-lg">
                    {day.fullDate}: {day.orderCount} orders (৳{day.revenue.toLocaleString()})
                  </div>

                  {/* Value bubble atop bar */}
                  <span className="text-[10px] font-bold text-slate-500 mb-1 group-hover:text-slate-900 transition-colors">
                    {activeChartMetric === 'revenue' ? `৳${day.revenue}` : day.orderCount}
                  </span>

                  {/* Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 group-hover:brightness-95 cursor-pointer ${
                      isToday 
                        ? 'bg-gradient-to-t from-[#D71920] to-[#FF4D4D]' 
                        : value > 0 
                        ? 'bg-gradient-to-t from-slate-700 to-slate-500' 
                        : 'bg-slate-200'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex items-center gap-2 sm:gap-3.5 pt-2">
            {dailyChartData.data.map((day, idx) => {
              const isToday = idx === dailyChartData.data.length - 1;
              return (
                <div key={idx} className="flex-1 text-center">
                  <span className={`text-[10px] truncate block ${
                    isToday ? 'font-black text-[#D71920]' : 'text-slate-400 font-medium'
                  }`}>
                    {isToday ? 'Today' : day.dateLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Two-Column Breakdown: Order Status & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Breakdown Box */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-sm text-slate-900">অর্ডার স্ট্যাটাস ব্রেকডাউন</h3>
              <p className="text-xs text-slate-500">Order lifecycle distribution for {rangeLabels[selectedRange].label}</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
              {currentStats.count} Total
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Confirmed (নিশ্চিত)', count: currentStats.confirmedCount, color: 'bg-emerald-500', text: 'text-emerald-700' },
              { label: 'Awaiting Verification (ভেরিফিকেশন অপেক্ষায়)', count: currentStats.pendingVerifCount, color: 'bg-amber-500', text: 'text-amber-700' },
              { label: 'Processing (প্রক্রিয়াকরণ)', count: currentStats.processingCount, color: 'bg-blue-500', text: 'text-blue-700' },
              { label: 'Delivered (ডেলিভার্ড)', count: currentStats.deliveredCount, color: 'bg-purple-500', text: 'text-purple-700' },
              { label: 'Cancelled (বাতিল)', count: currentStats.cancelledCount, color: 'bg-red-500', text: 'text-red-700' },
            ].map((status, i) => {
              const pct = currentStats.count > 0 ? Math.round((status.count / currentStats.count) * 100) : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{status.label}</span>
                    <span className="font-bold text-slate-900">
                      {status.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${status.color} rounded-full transition-all duration-500`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown Box */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-sm text-slate-900">পেমেন্ট মেথড ডিস্ট্রিবিউশন</h3>
              <p className="text-xs text-slate-500">Revenue split across channels for {rangeLabels[selectedRange].label}</p>
            </div>
            <CreditCard size={18} className="text-[#D71920]" />
          </div>

          {paymentBreakdown.length > 0 ? (
            <div className="space-y-3.5">
              {paymentBreakdown.map((pm, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800 shadow-2xs">
                      {pm.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{pm.name}</h4>
                      <span className="text-[11px] text-slate-500">{pm.count} orders received</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs sm:text-sm text-slate-900">৳{pm.total.toLocaleString()}</span>
                    <span className="block text-[10px] font-bold text-[#D71920]">{pm.percentage}% of sales</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No payment transactions recorded for this period.
            </div>
          )}
        </div>

      </div>

      {/* 6. Filtered Orders Table for Selected Time Window */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Package size={18} className="text-[#D71920]" />
              <span>{rangeLabels[selectedRange].bnLabel} তালিকা ({currentOrders.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing all registered customer orders in the {rangeLabels[selectedRange].label} window.
            </p>
          </div>

          {onSelectTab && (
            <button
              onClick={() => onSelectTab('orders')}
              className="text-xs font-bold text-[#D71920] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Orders Management</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {currentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">District</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentOrders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#D71920]">
                      #{order.id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500">{order.phone}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{order.district}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{order.paymentMethodName || 'COD'}</span>
                      <span className={`block text-[10px] font-bold uppercase ${
                        order.paymentStatus === 'approved' 
                          ? 'text-emerald-600' 
                          : order.paymentStatus === 'pending_verification' 
                          ? 'text-amber-600' 
                          : 'text-slate-500'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900">
                      ৳{order.total}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        order.orderStatus === 'confirmed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : order.orderStatus === 'awaiting_payment_verification' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : order.orderStatus === 'delivered'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            No orders found for this selected date filter.
          </div>
        )}
      </div>

      {/* 7. Catalog & Inventory Alerts */}
      {(inventoryAlerts.lowStockItems.length > 0 || inventoryAlerts.outOfStockItems.length > 0) && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-5 sm:p-6 text-xs text-amber-900 space-y-3">
          <div className="flex items-center gap-2 font-black text-sm text-amber-950">
            <AlertCircle size={18} className="text-amber-600" />
            <span>ইনভেন্টরি অ্যালার্ট (Low Stock & Out of Stock Items)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {inventoryAlerts.outOfStockItems.map(p => (
              <div key={p.id} className="p-3 rounded-2xl bg-white border border-red-200 shadow-2xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 truncate max-w-[180px]">{p.title}</h4>
                  <span className="text-[10px] font-black text-red-600">OUT OF STOCK (0 left)</span>
                </div>
                {onSelectTab && (
                  <button onClick={() => onSelectTab('products')} className="text-[11px] font-bold text-[#D71920] underline">
                    Restock
                  </button>
                )}
              </div>
            ))}
            {inventoryAlerts.lowStockItems.map(p => (
              <div key={p.id} className="p-3 rounded-2xl bg-white border border-amber-200 shadow-2xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 truncate max-w-[180px]">{p.title}</h4>
                  <span className="text-[10px] font-bold text-amber-700">Only {p.stock} units remaining</span>
                </div>
                {onSelectTab && (
                  <button onClick={() => onSelectTab('products')} className="text-[11px] font-bold text-[#D71920] underline">
                    Update
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
