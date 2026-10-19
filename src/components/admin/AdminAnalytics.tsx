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
  ShoppingBag
} from 'lucide-react';
import { Order, Product, PaymentSubmission } from '../../types';
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
  onSelectTab?: (tab: string) => void;
  onSelectOrder?: (orderId: string) => void;
}

type TimeRange = 'today' | 'yesterday' | '7days' | '30days' | 'all';

export function AdminAnalytics({
  orders,
  products,
  paymentSubmissions,
  onSelectTab,
  onSelectOrder
}: AdminAnalyticsProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7days');
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

    const todayOrders = orders.filter(o => o.createdAt >= startOfToday);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

    const yesterdayOrders = orders.filter(o => o.createdAt >= startOfYesterday && o.createdAt <= endOfYesterday);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);

    const sevenDaysOrders = orders.filter(o => o.createdAt >= startOf7Days);
    const sevenDaysRevenue = sevenDaysOrders.reduce((sum, o) => sum + o.total, 0);

    const thirtyDaysOrders = orders.filter(o => o.createdAt >= startOf30Days);
    const thirtyDaysRevenue = thirtyDaysOrders.reduce((sum, o) => sum + o.total, 0);

    const allRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(o => o.orderStatus === 'pending');
    const confirmedOrders = orders.filter(o => o.orderStatus === 'confirmed' || o.orderStatus === 'processing');
    const deliveredOrders = orders.filter(o => o.orderStatus === 'delivered');
    const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled');

    return {
      today: { orders: todayOrders, count: todayOrders.length, revenue: todayRevenue },
      yesterday: { orders: yesterdayOrders, count: yesterdayOrders.length, revenue: yesterdayRevenue },
      sevenDays: { orders: sevenDaysOrders, count: sevenDaysOrders.length, revenue: sevenDaysRevenue },
      thirtyDays: { orders: thirtyDaysOrders, count: thirtyDaysOrders.length, revenue: thirtyDaysRevenue },
      allTime: { orders: orders, count: orders.length, revenue: allRevenue },
      pending: pendingOrders.length,
      confirmed: confirmedOrders.length,
      delivered: deliveredOrders.length,
      cancelled: cancelledOrders.length
    };
  }, [orders]);

  // Chart data generation for Recharts based on selectedRange
  const chartData = useMemo(() => {
    const daysCount = selectedRange === 'today' ? 1 : selectedRange === '7days' ? 7 : selectedRange === '30days' ? 30 : 14;
    const now = Date.now();
    const result = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

      const dayOrders = orders.filter(o => o.createdAt >= dayStart.getTime() && o.createdAt <= dayEnd.getTime());
      const rev = dayOrders.reduce((sum, o) => sum + o.total, 0);
      const count = dayOrders.length;

      result.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: rev,
        orders: count
      });
    }
    return result;
  }, [orders, selectedRange]);

  const activeOrdersList = useMemo(() => {
    switch (selectedRange) {
      case 'today': return timeMetrics.today.orders;
      case 'yesterday': return timeMetrics.yesterday.orders;
      case '7days': return timeMetrics.sevenDays.orders;
      case '30days': return timeMetrics.thirtyDays.orders;
      default: return orders;
    }
  }, [orders, selectedRange, timeMetrics]);

  const activeRevenue = activeOrdersList.reduce((sum, o) => sum + o.total, 0);
  const activeOrderCount = activeOrdersList.length;
  const activeAov = activeOrderCount > 0 ? Math.round(activeRevenue / activeOrderCount) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Header Filter Bar */}
      <div className="bg-[#0A0E17] text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full mb-1 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Firebase Live Analytics
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Revenue, Orders & Traffic Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time performance metrics and Recharts visualization.
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          {(['today', '7days', '30days', 'all'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRange === range
                  ? 'bg-[#D71920] text-white shadow-lg shadow-[#D71920]/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {range === 'today' ? 'Today' : range === '7days' ? 'Last 7 Days' : range === '30days' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0A0E17] border border-slate-800 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Total Revenue</div>
            <div className="text-2xl font-black text-white mt-1">৳{activeRevenue.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight size={14} /> <span>Verified Sales ({selectedRange})</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#D71920]/20 border border-[#D71920]/30 text-[#D71920] flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Total Orders</div>
            <div className="text-2xl font-black text-white mt-1">{activeOrderCount} Orders</div>
            <div className="text-[11px] text-blue-400 font-semibold mt-1 flex items-center gap-1">
              <Package size={14} /> <span>{selectedRange} volume</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Average Order Value</div>
            <div className="text-2xl font-black text-white mt-1">৳{activeAov}</div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp size={14} /> <span>Per transaction</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <BarChart3 size={24} />
          </div>
        </div>

        <div className="bg-[#0A0E17] border border-slate-800 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Pending & Processing</div>
            <div className="text-2xl font-black text-white mt-1">{timeMetrics.pending + timeMetrics.confirmed} Orders</div>
            <div className="text-[11px] text-amber-400 font-semibold mt-1 flex items-center gap-1">
              <Clock size={14} /> <span>Requires fulfillment</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Recharts Analytics Chart Section */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-[#D71920]" /> Daily Performance Trend
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizing revenue and order volume over time using Recharts.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveChartMetric('revenue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartMetric === 'revenue' ? 'bg-[#D71920] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Revenue (৳)
            </button>
            <button
              onClick={() => setActiveChartMetric('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeChartMetric === 'orders' ? 'bg-[#D71920] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Order Count
            </button>
          </div>
        </div>

        {/* Responsive Area Chart */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D71920" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#D71920" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" stroke="#64748B" textAnchor="end" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '1rem', color: '#FFF' }}
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
