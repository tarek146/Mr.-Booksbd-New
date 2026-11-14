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
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Order, Product, PaymentSubmission, PaymentMethodConfig } from '../../types';
import { useStore } from '../../context/StoreContext';
import {
  computePaymentChannelDistribution,
  computeTopSellingProducts,
  filterActiveNonTrashedOrders,
  TopProductsTimeRange,
} from '../../utils/adminOrderAndPaymentHelpers';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';

interface AdminAnalyticsProps {
  orders: Order[];
  products: Product[];
  paymentSubmissions: PaymentSubmission[];
  paymentMethods?: PaymentMethodConfig[];
  onSelectTab?: (tab: string) => void;
  onSelectOrder?: (orderId: string) => void;
}

type TimeRange = 'today' | 'yesterday' | '7days' | '30days' | 'all';

export function AdminAnalytics({
  orders,
  products,
  paymentSubmissions,
  paymentMethods: paymentMethodsProp,
  onSelectTab,
  onSelectOrder
}: AdminAnalyticsProps) {
  const { paymentMethods: storePaymentMethods, settings } = useStore();
  const effectivePaymentMethods = paymentMethodsProp || storePaymentMethods;
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7days');
  const [activeChartMetric, setActiveChartMetric] = useState<'revenue' | 'orders'>('revenue');
  
  // Recent Orders Sub-Tab
  const [recentOrdersTab, setRecentOrdersTab] = useState<'recent' | 'pending' | 'toship' | 'paymentdue'>('recent');

  // Daily Reports Filters
  const [dailyReportFilter, setDailyReportFilter] = useState<'all' | 'delivered' | 'pending'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('October');

  // Top Products filter & image fallback state
  const [topProductsRange, setTopProductsRange] = useState<'all' | '30days' | '7days'>('all');
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>({});

  // Hourly Report AM/PM
  const [hourlyAmPm, setHourlyAmPm] = useState<'AM' | 'PM'>('AM');

  // Exclude trashed orders across all analytics calculations
  const activeOrders = useMemo(() => filterActiveNonTrashedOrders(orders), [orders]);

  // Real Top Selling Products ranked strictly from live catalog + non-cancelled/non-trashed orders
  const topProducts = useMemo(
    () =>
      computeTopSellingProducts(activeOrders, products, {
        range: topProductsRange as TopProductsTimeRange,
        limit: 5,
      }),
    [activeOrders, products, topProductsRange]
  );

  const totalTopUnits = useMemo(
    () => topProducts.reduce((sum, item) => sum + item.unitsSold, 0),
    [topProducts]
  );

  // Metrics calculation
  const metrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const pendingOrders = activeOrders.filter(o => o.orderStatus === 'pending');
    const confirmedOrders = activeOrders.filter(o => o.orderStatus === 'confirmed');
    const processingOrders = activeOrders.filter(o => o.orderStatus === 'processing');
    const shippedOrders = activeOrders.filter(o => o.orderStatus === 'shipped');
    const deliveredOrders = activeOrders.filter(o => o.orderStatus === 'delivered');
    const cancelledOrders = activeOrders.filter(o => o.orderStatus === 'cancelled');

    const toShipOrders = activeOrders.filter(o => o.orderStatus === 'confirmed' || o.orderStatus === 'processing');
    const paymentDueOrders = activeOrders.filter(o => o.paymentStatus === 'pending_verification' || o.paymentStatus === 'unpaid');
    
    const todayOrders = activeOrders.filter(o => o.createdAt >= startOfToday);
    const todayPending = todayOrders.filter(o => o.orderStatus === 'pending');
    const todayConfirmed = todayOrders.filter(o => o.orderStatus === 'confirmed' || o.orderStatus === 'processing' || o.orderStatus === 'delivered');
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const todayPendingRev = todayPending.reduce((sum, o) => sum + o.total, 0);
    const todayConfirmedRev = todayConfirmed.reduce((sum, o) => sum + o.total, 0);

    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const returnsOrders = activeOrders.filter(o => o.orderStatus === 'cancelled' || o.paymentStatus === 'refunded');
    const returnsRevenue = returnsOrders.reduce((sum, o) => sum + o.total, 0);

    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
    const cancellationRate = activeOrders.length > 0 ? ((cancelledOrders.length / activeOrders.length) * 100).toFixed(0) : '0';

    // Dynamic Payment Method distribution across all active payment methods in Admin Panel
    const paymentDistribution = computePaymentChannelDistribution(
      activeOrders,
      effectivePaymentMethods,
      settings.enableBanglaQr !== false,
      paymentSubmissions
    );

    // Monthly data for chart
    const monthlyData = [
      { month: 'Jan', orders: 0, revenue: 0 },
      { month: 'Feb', orders: 0, revenue: 0 },
      { month: 'Mar', orders: 0, revenue: 0 },
      { month: 'Apr', orders: 0, revenue: 0 },
      { month: 'May', orders: 0, revenue: 0 },
      { month: 'Jun', orders: 0, revenue: 0 },
      { month: 'Jul', orders: 0, revenue: 0 },
      { month: 'Aug', orders: 0, revenue: 0 },
      { month: 'Sep', orders: 0, revenue: 0 },
      { month: 'Oct', orders: 0, revenue: 0 },
      { month: 'Nov', orders: 0, revenue: 0 },
      { month: 'Dec', orders: 0, revenue: 0 },
    ];

    activeOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        monthlyData[mIdx].orders += 1;
        monthlyData[mIdx].revenue += o.total;
      }
    });

    return {
      pending: pendingOrders.length,
      confirmed: confirmedOrders.length,
      processing: processingOrders.length,
      shipped: shippedOrders.length,
      delivered: deliveredOrders.length,
      cancelled: cancelledOrders.length,
      toShip: toShipOrders.length,
      paymentDue: paymentDueOrders.length,
      todayPendingCount: todayPending.length,
      todayPendingRev,
      todayConfirmedCount: todayConfirmed.length,
      todayConfirmedRev,
      todayOrdersCount: todayOrders.length,
      todayRevenue,
      deliveredCount: deliveredOrders.length,
      deliveredRevenue,
      returnsCount: returnsOrders.length,
      returnsRevenue,
      totalOrdersCount: activeOrders.length,
      totalRevenue,
      cancellationRate,
      paymentDistribution,
      monthlyData
    };
  }, [activeOrders, effectivePaymentMethods, settings.enableBanglaQr, paymentSubmissions]);

  // Weekly Revenue (Last 7 days)
  const weeklyRevenueData = useMemo(() => {
    const now = Date.now();
    const result = [];
    let totalWeekRev = 0;

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

      const dayOrders = activeOrders.filter(o => o.createdAt >= dayStart.getTime() && o.createdAt <= dayEnd.getTime());
      const rev = dayOrders.reduce((sum, o) => sum + o.total, 0);
      totalWeekRev += rev;

      result.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: rev
      });
    }
    return { data: result, totalWeekRev };
  }, [activeOrders]);

  // Daily Report (Days 1-31 of current month)
  const dailyReportDays = useMemo(() => {
    const result = [];
    for (let day = 1; day <= 31; day++) {
      const dayOrders = activeOrders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getDate() === day;
      });
      result.push({
        dayNumber: day,
        count: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0)
      });
    }
    return result;
  }, [activeOrders]);

  // Hourly Report (AM/PM)
  const hourlyReportData = useMemo(() => {
    const hours = hourlyAmPm === 'AM' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    return hours.map(h => {
      const hourOrders = activeOrders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getHours() === h;
      });
      const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      return {
        hour: label,
        count: hourOrders.length
      };
    });
  }, [activeOrders, hourlyAmPm]);

  // Filtered Recent Orders for table tab
  const filteredRecentOrders = useMemo(() => {
    if (recentOrdersTab === 'pending') return activeOrders.filter(o => o.orderStatus === 'pending');
    if (recentOrdersTab === 'toship') return activeOrders.filter(o => o.orderStatus === 'confirmed' || o.orderStatus === 'processing');
    if (recentOrdersTab === 'paymentdue') return activeOrders.filter(o => o.paymentStatus === 'pending_verification' || o.paymentStatus === 'unpaid');
    return activeOrders.slice(0, 10);
  }, [activeOrders, recentOrdersTab]);

  // Daily Trend Chart data
  const chartData = useMemo(() => {
    const daysCount = selectedRange === 'today' ? 1 : selectedRange === '7days' ? 7 : selectedRange === '30days' ? 30 : 14;
    const now = Date.now();
    const result = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

      const dayOrders = activeOrders.filter(o => o.createdAt >= dayStart.getTime() && o.createdAt <= dayEnd.getTime());
      const rev = dayOrders.reduce((sum, o) => sum + o.total, 0);
      const count = dayOrders.length;

      result.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: rev,
        orders: count
      });
    }
    return result;
  }, [activeOrders, selectedRange]);

  return (
    <div className="space-y-6">

      {/* ========================================================================= */}
      {/* EXACT TOP SECTION MATCHING USER'S REFERENCE IMAGE (WHITE & RED BRANDING) */}
      {/* ========================================================================= */}
      
      {/* 1. TOP 3 WIDE STATUS CARDS (Pending, To Ship, Payment Due) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Pending Card */}
        <div 
          onClick={() => onSelectTab && onSelectTab('orders')}
          className="bg-white border border-[#E5E5E5] hover:border-[#D71920] rounded-2xl p-5 flex items-center justify-between text-neutral-900 shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Clock size={22} />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-neutral-500 tracking-wider block">Pending</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-[#D71920]">{metrics.pending}</span>
            <ChevronRight size={18} className="text-neutral-400 group-hover:text-[#D71920] transition-colors" />
          </div>
        </div>

        {/* To Ship Card */}
        <div 
          onClick={() => onSelectTab && onSelectTab('orders')}
          className="bg-white border border-[#E5E5E5] hover:border-[#D71920] rounded-2xl p-5 flex items-center justify-between text-neutral-900 shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Package size={22} />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-neutral-500 tracking-wider block">To Ship</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-blue-600">{metrics.toShip}</span>
            <ChevronRight size={18} className="text-neutral-400 group-hover:text-[#D71920] transition-colors" />
          </div>
        </div>

        {/* Payment Due Card */}
        <div 
          onClick={() => onSelectTab && onSelectTab('verifications')}
          className="bg-white border border-[#E5E5E5] hover:border-[#D71920] rounded-2xl p-5 flex items-center justify-between text-neutral-900 shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-neutral-500 tracking-wider block">Payment Due</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-emerald-600">{metrics.paymentDue}</span>
            <ChevronRight size={18} className="text-neutral-400 group-hover:text-[#D71920] transition-colors" />
          </div>
        </div>

      </div>

      {/* 2. 6 METRIC CARDS & MONTHLY REPORT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left 8 Columns: 6 Breakdown Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Today's Pending */}
          <div className="bg-white border border-[#D71920]/40 rounded-2xl p-5 text-neutral-900 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-black text-neutral-500 block">Today's Pending</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{metrics.todayPendingCount}</div>
                <div className="text-xs font-bold text-neutral-600 mt-1">BDT {metrics.todayPendingRev}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Clock size={20} />
              </div>
            </div>
          </div>

          {/* Today's Confirm */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 text-neutral-900 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-black text-neutral-500 block">Today's Confirm</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.todayConfirmedCount}</div>
                <div className="text-xs font-bold text-neutral-600 mt-1">BDT {metrics.todayConfirmedRev}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>

          {/* Today's Orders */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 text-neutral-900 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-black text-neutral-500 block">Today's Orders</span>
                <div className="text-2xl font-black text-[#D71920] mt-1">{metrics.todayOrdersCount}</div>
                <div className="text-xs font-bold text-neutral-600 mt-1">BDT {metrics.todayRevenue}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center border border-[#D71920]/25">
                <ShoppingBag size={20} />
              </div>
            </div>
          </div>

          {/* Delivered */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 text-neutral-900 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-black text-neutral-500 block">Delivered</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.deliveredCount}</div>
                <div className="text-xs font-bold text-neutral-600 mt-1">BDT {metrics.deliveredRevenue}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <Truck size={20} />
              </div>
            </div>
          </div>

          {/* Returns */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 text-neutral-900 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-black text-neutral-500 block">Returns</span>
                <div className="text-2xl font-black text-red-600 mt-1">{metrics.returnsCount}</div>
                <div className="text-xs font-bold text-neutral-600 mt-1">BDT {metrics.returnsRevenue}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                <RefreshCw size={20} />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 text-neutral-900 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-black text-neutral-500 block">Total Orders</span>
                <div className="text-2xl font-black text-neutral-900 mt-1">{metrics.totalOrdersCount}</div>
                <div className="text-xs font-bold text-[#D71920] mt-1">BDT {metrics.totalRevenue}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center border border-[#D71920]/25">
                <Package size={20} />
              </div>
            </div>
          </div>

        </div>

        {/* Right 4 Columns: Monthly Report Bar Chart Card */}
        <div className="lg:col-span-4 bg-white border border-[#E5E5E5] rounded-3xl p-5 text-neutral-900 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-neutral-900">Monthly Report</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">
              This Year
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="month" stroke="#888888" fontSize={10} />
                <YAxis stroke="#888888" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5', borderRadius: '0.75rem', color: '#171717', fontSize: '11px' }}
                  formatter={(val: any) => [`${val} orders`, 'Orders']}
                />
                <Bar dataKey="orders" fill="#D71920" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ADDITIONAL ADMIN ANALYTICS & WIDGETS BELOW */}
      {/* ========================================================================= */}

      {/* 3. WEEKLY REVENUE, ORDER PIPELINE & PAYMENT METHODS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Weekly Revenue Card */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-neutral-900">Weekly Revenue</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">Last 7 days revenue</p>
            </div>
            <div className="text-base font-black text-[#D71920]">৳{weeklyRevenueData.totalWeekRev}</div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRevenueData.data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="date" stroke="#888888" fontSize={10} />
                <YAxis stroke="#888888" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5', borderRadius: '0.75rem', color: '#171717', fontSize: '11px' }}
                  formatter={(val: any) => [`৳${val}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#D71920" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <button 
            onClick={() => setSelectedRange('7days')}
            className="text-xs font-bold text-[#D71920] hover:underline flex items-center gap-1 cursor-pointer pt-1"
          >
            <span>View Daily Sales Monitor</span> <ChevronRight size={14} />
          </button>
        </div>

        {/* Order Pipeline Card */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-black text-sm text-neutral-900">Order Pipeline</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">Order processing status funnel</p>
          </div>

          <div className="space-y-3 py-1">
            {[
              { label: 'Pending', count: metrics.pending, color: 'bg-amber-500' },
              { label: 'Confirmed', count: metrics.confirmed, color: 'bg-blue-500' },
              { label: 'Processing', count: metrics.processing, color: 'bg-indigo-500' },
              { label: 'Shipped', count: metrics.shipped, color: 'bg-sky-500' },
              { label: 'Delivered', count: metrics.delivered, color: 'bg-emerald-500' },
              { label: 'Cancelled', count: metrics.cancelled, color: 'bg-[#D71920]' },
            ].map((step, idx) => {
              const maxCount = Math.max(metrics.totalOrdersCount, 1);
              const pct = Math.min(100, Math.round((step.count / maxCount) * 100));
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-700 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${step.color}`}></span>
                      {step.label}
                    </span>
                    <span className="font-black text-neutral-900">{step.count}</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${step.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100">
            <span className="font-bold text-neutral-500">Cancellation Rate</span>
            <span className="font-black text-[#D71920]">{metrics.cancellationRate}%</span>
          </div>
        </div>

        {/* Payment Methods Distribution Card */}
        <div
          data-testid="admin-payment-methods-distribution-card"
          className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4"
        >
          <div>
            <h3 className="font-black text-sm text-neutral-900">Payment Methods</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">Payment channel distribution</p>
          </div>

          <div className="space-y-3.5 py-2">
            {metrics.paymentDistribution.channels.length === 0 ? (
              <div className="text-xs text-neutral-400 py-4 text-center">
                No active payment methods enabled.
              </div>
            ) : (
              metrics.paymentDistribution.channels.map(pm => (
                <div
                  key={pm.id}
                  data-testid={`payment-dist-row-${pm.type}`}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-800">{pm.label}</span>
                    <span className="font-black text-neutral-900 tabular-nums">
                      {pm.count} orders · ৳{pm.revenue}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${pm.barColor} rounded-full transition-all duration-300`}
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-100">
            <span className="font-bold text-neutral-500">Primary Channel</span>
            <span
              data-testid="payment-dist-primary-channel"
              className={`font-black ${metrics.paymentDistribution.primaryChannel.textColor}`}
            >
              {metrics.paymentDistribution.primaryChannel.label} ({metrics.paymentDistribution.primaryChannel.percentage}%)
            </span>
          </div>
        </div>

      </div>

      {/* 4. DAILY REPORTS & HOURLY REPORT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Daily Reports (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-neutral-900">Daily Reports</h3>
              <p className="text-xs text-neutral-500">Latest customer purchases</p>
            </div>

            <div className="flex items-center gap-2">
              <select 
                value={dailyReportFilter}
                onChange={(e) => setDailyReportFilter(e.target.value as any)}
                className="bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#D71920]"
              >
                <option value="all">All</option>
                <option value="delivered">Delivered</option>
                <option value="pending">Pending</option>
              </select>

              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#D71920]"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>

              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#D71920]"
              >
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyReportDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="dayNumber" stroke="#888888" fontSize={10} />
                <YAxis stroke="#888888" fontSize={10} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5', borderRadius: '0.75rem', color: '#171717', fontSize: '11px' }}
                  formatter={(val: any, name: any, item: any) => [`${val} orders (৳${item.payload.revenue})`, 'Daily Volume']}
                />
                <Bar dataKey="count" fill="#D71920" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Report (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-neutral-900">Hourly Report</h3>
            <div className="flex items-center bg-neutral-100 p-1 rounded-xl">
              <button
                onClick={() => setHourlyAmPm('AM')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  hourlyAmPm === 'AM' ? 'bg-[#D71920] text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                AM
              </button>
              <button
                onClick={() => setHourlyAmPm('PM')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  hourlyAmPm === 'PM' ? 'bg-[#D71920] text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyReportData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="hour" stroke="#888888" fontSize={9} />
                <YAxis stroke="#888888" fontSize={10} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5', borderRadius: '0.75rem', color: '#171717', fontSize: '11px' }}
                  formatter={(val: any) => [`${val} orders`, 'Volume']}
                />
                <Bar dataKey="count" fill="#171717" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-neutral-400 text-center">
            Showing hourly distribution for {hourlyAmPm} hours
          </div>
        </div>

      </div>

      {/* 5. RECENT ORDERS, TOP PRODUCTS & TRAFFIC SOURCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Recent Orders Table (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-black text-neutral-900">Recent Orders</h3>
              <p className="text-xs text-neutral-500">Latest customer purchases</p>
            </div>

            <button
              onClick={() => onSelectTab && onSelectTab('orders')}
              className="px-4 py-1.5 bg-[#D71920] text-white hover:bg-[#b5141a] rounded-xl text-xs font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer transition-colors"
            >
              <span>View All</span> <ChevronRight size={14} />
            </button>
          </div>

          {/* Sub tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
            {[
              { id: 'recent', label: 'Recent' },
              { id: 'pending', label: `Pending (${metrics.pending})` },
              { id: 'toship', label: `To Ship (${metrics.toShip})` },
              { id: 'paymentdue', label: `Payment Due (${metrics.paymentDue})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRecentOrdersTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  recentOrdersTab === tab.id ? 'bg-[#171717] text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="pb-2.5">Order ID</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredRecentOrders.length > 0 ? (
                  filteredRecentOrders.map(o => (
                    <tr 
                      key={o.id} 
                      onClick={() => onSelectOrder && onSelectOrder(o.id)}
                      className="hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 font-black text-[#D71920]">{o.id.substring(0, 10)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold text-[11px] flex items-center justify-center">
                            {(o.customerName || 'C').charAt(0)}
                          </div>
                          <span className="font-bold text-neutral-800">{o.customerName || 'Customer'}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          o.orderStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                          o.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-neutral-900">৳{o.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-neutral-400 font-bold">
                      No recent orders found in this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Products & Traffic Source (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Top Products */}
          <div
            data-testid="admin-top-products-card"
            className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Top Products</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5 tabular-nums">
                  Best selling by units · {topProductsRange === '7days' ? 'Last 7 days' : topProductsRange === '30days' ? 'Last 30 days' : 'All time'}
                </p>
              </div>
              <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-lg shrink-0">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: '30days', label: '30d' },
                    { id: '7days', label: '7d' },
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTopProductsRange(opt.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      topProductsRange === opt.id
                        ? 'bg-white text-neutral-900 shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {topProducts.length === 0 ? (
              <div
                data-testid="admin-top-products-empty"
                className="py-7 px-3 text-center space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
                  <ShoppingBag size={18} />
                </div>
                <div className="text-xs font-bold text-neutral-800">
                  No product sales recorded
                </div>
                <p className="text-[11px] text-neutral-500 max-w-[240px] mx-auto leading-relaxed">
                  {topProductsRange === 'all'
                    ? 'Active orders for products in your live catalog will rank here automatically.'
                    : 'No valid orders matched this period.'}
                </p>
                <div className="pt-1 flex items-center justify-center gap-3">
                  {topProductsRange !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setTopProductsRange('all')}
                      className="text-xs font-semibold text-[#D71920] hover:underline cursor-pointer whitespace-nowrap"
                    >
                      Show All Time
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectTab?.('products')}
                    className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Manage Catalog
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="divide-y divide-neutral-100">
                  {topProducts.map((item, idx) => {
                    const showThumb = Boolean(item.thumbnail && !failedThumbIds[item.productId]);
                    return (
                      <button
                        key={item.productId}
                        type="button"
                        data-testid={`top-product-row-${item.productId}`}
                        onClick={() => onSelectTab?.('products')}
                        className="w-full py-2.5 first:pt-0.5 last:pb-0.5 flex items-center justify-between gap-3 text-left hover:bg-neutral-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={`w-5 text-center text-[11px] font-bold tabular-nums shrink-0 ${
                              idx === 0 ? 'text-[#D71920]' : 'text-neutral-400'
                            }`}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="w-9 h-11 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 shrink-0 flex items-center justify-center">
                            {showThumb ? (
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                onError={() =>
                                  setFailedThumbIds(prev => ({ ...prev, [item.productId]: true }))
                                }
                                className="w-full h-full object-cover"
                              />
                            ) : item.isBook ? (
                              <BookOpen size={15} className="text-neutral-400" />
                            ) : (
                              <Package size={15} className="text-neutral-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className="font-semibold text-xs text-neutral-900 group-hover:text-[#D71920] transition-colors truncate"
                              title={item.title}
                            >
                              {item.title}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5 truncate tabular-nums">
                              {item.unitsSold} sold · {item.ordersCount}{' '}
                              {item.ordersCount === 1 ? 'order' : 'orders'}
                              {item.variantsSummary ? ` · ${item.variantsSummary}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 tabular-nums">
                          <div className="font-bold text-xs text-neutral-900">
                            ৳{item.revenue.toLocaleString()}
                          </div>
                          <div
                            className={`text-[10px] font-medium mt-0.5 ${
                              item.currentStock > 0 ? 'text-neutral-500' : 'text-[#D71920]'
                            }`}
                          >
                            ৳{item.currentPrice.toLocaleString()} ·{' '}
                            {item.currentStock > 0 ? `${item.currentStock} left` : 'Out of stock'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-[11px]">
                  <span className="text-neutral-500 font-medium tabular-nums">
                    {totalTopUnits} units across top {topProducts.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectTab?.('products')}
                    className="font-semibold text-[#D71920] hover:underline flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>View Inventory</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Traffic Source */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900">Traffic Source</h3>
              <span className="text-[11px] font-medium text-neutral-400">Channel share</span>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Social Media', color: 'bg-indigo-600', count: 0 },
                { label: 'Organic', color: 'bg-emerald-600', count: 0 },
                { label: 'Manual', color: 'bg-neutral-500', count: 0 }
              ].map((src, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${src.color}`}></span>
                    <span className="font-bold text-neutral-800">{src.label}</span>
                  </div>
                  <div className="text-neutral-500 font-bold">Orders - {src.count} <span className="text-[10px] text-neutral-400 ml-1">0% of total</span></div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 6. RECHART DAILY TREND & FILTER BAR */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 text-[#171717] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE]">
          <div>
            <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-[#D71920]" /> Daily Performance Trend
            </h3>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Visualizing revenue and order volume over time using Recharts.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#F7F7F8] p-1 rounded-xl border border-[#E5E5E5]">
              {(['today', '7days', '30days', 'all'] as TimeRange[]).map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedRange === range
                      ? 'bg-[#D71920] text-white shadow-xs'
                      : 'text-[#5F6368] hover:text-neutral-900'
                  }`}
                >
                  {range === 'today' ? 'Today' : range === '7days' ? 'Last 7 Days' : range === '30days' ? 'Last 30 Days' : 'All Time'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[#F7F7F8] p-1 rounded-xl border border-[#E5E5E5]">
              <button
                onClick={() => setActiveChartMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartMetric === 'revenue' ? 'bg-[#D71920] text-white shadow-xs' : 'text-[#5F6368] hover:text-neutral-900'
                }`}
              >
                Revenue (৳)
              </button>
              <button
                onClick={() => setActiveChartMetric('orders')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartMetric === 'orders' ? 'bg-[#D71920] text-white shadow-xs' : 'text-[#5F6368] hover:text-neutral-900'
                }`}
              >
                Order Count
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Area Chart */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D71920" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D71920" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="date" stroke="#888888" fontSize={11} />
              <YAxis stroke="#888888" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5', borderRadius: '1rem', color: '#171717', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: any) => [activeChartMetric === 'revenue' ? `৳${value}` : `${value} orders`, activeChartMetric === 'revenue' ? 'Revenue' : 'Orders']}
              />
              <Area 
                type="monotone" 
                dataKey={activeChartMetric} 
                stroke="#D71920" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorMetric)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
