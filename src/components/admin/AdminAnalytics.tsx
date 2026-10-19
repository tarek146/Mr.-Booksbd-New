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

  // Timestamps for boundaries & specific metric counts
  const metrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Status counts
    const pendingOrders = orders.filter(o => o.orderStatus === 'pending');
    const toShipOrders = orders.filter(o => o.orderStatus === 'confirmed' || o.orderStatus === 'processing');
    const paymentDueOrders = orders.filter(o => o.paymentStatus === 'pending_verification' || o.paymentStatus === 'unpaid');
    
    // Today metrics
    const todayOrders = orders.filter(o => o.createdAt >= startOfToday);
    const todayPending = todayOrders.filter(o => o.orderStatus === 'pending');
    const todayConfirmed = todayOrders.filter(o => o.orderStatus === 'confirmed' || o.orderStatus === 'processing' || o.orderStatus === 'delivered');
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const todayPendingRev = todayPending.reduce((sum, o) => sum + o.total, 0);
    const todayConfirmedRev = todayConfirmed.reduce((sum, o) => sum + o.total, 0);

    // Delivered & Returns
    const deliveredOrders = orders.filter(o => o.orderStatus === 'delivered');
    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);

    const returnsOrders = orders.filter(o => o.orderStatus === 'cancelled' || o.paymentStatus === 'refunded');
    const returnsRevenue = returnsOrders.reduce((sum, o) => sum + o.total, 0);

    // Total
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    // Monthly data for chart (Jan - Dec)
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

    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const mIdx = d.getMonth(); // 0 - 11
      if (mIdx >= 0 && mIdx < 12) {
        monthlyData[mIdx].orders += 1;
        monthlyData[mIdx].revenue += o.total;
      }
    });

    return {
      pending: pendingOrders.length,
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
      totalOrdersCount: orders.length,
      totalRevenue,
      monthlyData
    };
  }, [orders]);

  // Daily Trend Chart data
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

  return (
    <div className="space-y-6">

      {/* 1. TOP STATUS QUICK ACTION STRIP (Pending, To Ship, Payment Due) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => onSelectTab && onSelectTab('orders')}
          className="bg-white border border-[#E5E5E5] hover:border-[#D71920] rounded-2xl p-4 flex items-center justify-between text-left shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-neutral-500 tracking-wider block">Pending</span>
              <span className="text-lg font-black text-neutral-900">{metrics.pending} Orders</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-neutral-400 group-hover:text-[#D71920] transition-colors" />
        </button>

        <button 
          onClick={() => onSelectTab && onSelectTab('orders')}
          className="bg-white border border-[#E5E5E5] hover:border-[#D71920] rounded-2xl p-4 flex items-center justify-between text-left shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Package size={20} />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-neutral-500 tracking-wider block">To Ship</span>
              <span className="text-lg font-black text-neutral-900">{metrics.toShip} Orders</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-neutral-400 group-hover:text-[#D71920] transition-colors" />
        </button>

        <button 
          onClick={() => onSelectTab && onSelectTab('verifications')}
          className="bg-white border border-[#E5E5E5] hover:border-[#D71920] rounded-2xl p-4 flex items-center justify-between text-left shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-neutral-500 tracking-wider block">Payment Due</span>
              <span className="text-lg font-black text-neutral-900">{metrics.paymentDue} Orders</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-neutral-400 group-hover:text-[#D71920] transition-colors" />
        </button>
      </div>

      {/* 2. MAIN 6 METRIC CARDS & MONTHLY REPORT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left 8 Columns: 6 Breakdown Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Today's Pending */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 block">Today's Pending</span>
              <div className="text-xl font-black text-neutral-900 mt-1">{metrics.todayPendingCount}</div>
              <div className="text-[11px] font-bold text-amber-600 mt-0.5">BDT {metrics.todayPendingRev}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 self-end">
              <Clock size={18} />
            </div>
          </div>

          {/* Today's Confirm */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 block">Today's Confirm</span>
              <div className="text-xl font-black text-neutral-900 mt-1">{metrics.todayConfirmedCount}</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-0.5">BDT {metrics.todayConfirmedRev}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 self-end">
              <CheckCircle2 size={18} />
            </div>
          </div>

          {/* Today's Orders */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 block">Today's Orders</span>
              <div className="text-xl font-black text-neutral-900 mt-1">{metrics.todayOrdersCount}</div>
              <div className="text-[11px] font-bold text-[#D71920] mt-0.5">BDT {metrics.todayRevenue}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center border border-[#D71920]/25 self-end">
              <ShoppingBag size={18} />
            </div>
          </div>

          {/* Delivered */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 block">Delivered</span>
              <div className="text-xl font-black text-neutral-900 mt-1">{metrics.deliveredCount}</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-0.5">BDT {metrics.deliveredRevenue}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 self-end">
              <Truck size={18} />
            </div>
          </div>

          {/* Returns */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 block">Returns</span>
              <div className="text-xl font-black text-neutral-900 mt-1">{metrics.returnsCount}</div>
              <div className="text-[11px] font-bold text-red-600 mt-0.5">BDT {metrics.returnsRevenue}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 self-end">
              <RefreshCw size={18} />
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 block">Total Orders</span>
              <div className="text-xl font-black text-neutral-900 mt-1">{metrics.totalOrdersCount}</div>
              <div className="text-[11px] font-bold text-[#D71920] mt-0.5">BDT {metrics.totalRevenue}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center border border-[#D71920]/25 self-end">
              <Package size={18} />
            </div>
          </div>

        </div>

        {/* Right 4 Columns: Monthly Report Bar Chart Card */}
        <div className="lg:col-span-4 bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-neutral-900">Monthly Report</h3>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">
              This Year
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

      {/* 3. RECHART DAILY TREND & FILTER BAR */}
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
