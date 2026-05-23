import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Calendar, FileText, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency, getStatusColor, getStatusLabel } from '../../lib/utils';

type MonthData = { month: string; revenue: number; expenses: number };
type ServiceData = { name: string; value: number; color: string };

const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const COLORS = ['#F59E0B','#3B82F6','#10B981','#EF4444','#6B7280','#F97316'];

export default function DashboardPage() {
  const { t } = useLang();
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, activeBookings: 0, pendingInvoices: 0, totalCustomers: 0 });
  const [prevStats, setPrevStats] = useState({ revenue: 0, activeBookings: 0, pendingInvoices: 0, totalCustomers: 0 });
  const [revenueData, setRevenueData] = useState<MonthData[]>([]);
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [
      { data: invoices },
      { data: bookings },
      { data: customers },
      { data: recentBk },
      { data: recentInv },
    ] = await Promise.all([
      supabase.from('invoices').select('total, status, created_at, issue_date'),
      supabase.from('bookings').select('total_amount, status, event_type, created_at'),
      supabase.from('customers').select('id, created_at'),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    if (recentBk) setRecentBookings(recentBk);
    if (recentInv) setRecentInvoices(recentInv);

    const allInvoices = invoices || [];
    const allBookings = bookings || [];
    const allCustomers = customers || [];

    // Current period stats
    const paidRevenue = allInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
    const activeBookingCount = allBookings.filter(b => ['pending','confirmed','in_progress'].includes(b.status)).length;
    const pendingInvCount = allInvoices.filter(i => ['draft','sent','partial','overdue'].includes(i.status)).length;

    // Last month stats for comparison
    const lastMonthRevenue = allInvoices
      .filter(i => i.status === 'paid' && i.created_at >= lastMonthStart && i.created_at < thisMonthStart)
      .reduce((s, i) => s + (i.total || 0), 0);
    const lastMonthBookings = allBookings.filter(b => ['pending','confirmed','in_progress'].includes(b.status) && b.created_at >= lastMonthStart && b.created_at < thisMonthStart).length;
    const lastMonthCustomers = allCustomers.filter(c => c.created_at >= lastMonthStart && c.created_at < thisMonthStart).length;

    setStats({ revenue: paidRevenue, activeBookings: activeBookingCount, pendingInvoices: pendingInvCount, totalCustomers: allCustomers.length });
    setPrevStats({ revenue: lastMonthRevenue, activeBookings: lastMonthBookings, pendingInvoices: 0, totalCustomers: lastMonthCustomers });

    // Build 6-month revenue chart
    const monthlyMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyMap[`${d.getFullYear()}-${d.getMonth()}`] = 0;
    }
    allInvoices.filter(i => i.status === 'paid').forEach(inv => {
      const d = new Date(inv.issue_date || inv.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in monthlyMap) monthlyMap[key] += inv.total || 0;
    });
    const chartData: MonthData[] = Object.entries(monthlyMap).map(([key, revenue]) => {
      const [yr, mo] = key.split('-').map(Number);
      return { month: MONTH_NAMES_AR[mo], revenue, expenses: Math.round(revenue * 0.35) };
    });
    setRevenueData(chartData);

    // Bookings by event type
    const typeMap: Record<string, number> = {};
    allBookings.forEach(b => {
      if (b.event_type) typeMap[b.event_type] = (typeMap[b.event_type] || 0) + 1;
    });
    const total = Object.values(typeMap).reduce((a, b) => a + b, 0) || 1;
    const svcData: ServiceData[] = Object.entries(typeMap).slice(0, 6).map(([name, count], i) => ({
      name,
      value: Math.round((count / total) * 100),
      color: COLORS[i] || '#6B7280',
    }));
    setServiceData(svcData.length > 0 ? svcData : [{ name: t('لا بيانات','No data'), value: 100, color: '#374151' }]);
  }

  function pctChange(curr: number, prev: number) {
    if (!prev) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  const kpis = [
    {
      title_ar: 'إجمالي الإيرادات', title_en: 'Total Revenue',
      value: formatCurrency(stats.revenue),
      change: pctChange(stats.revenue, prevStats.revenue),
      icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10',
    },
    {
      title_ar: 'الحجوزات النشطة', title_en: 'Active Bookings',
      value: String(stats.activeBookings),
      change: pctChange(stats.activeBookings, prevStats.activeBookings),
      icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10',
    },
    {
      title_ar: 'الفواتير المستحقة', title_en: 'Pending Invoices',
      value: String(stats.pendingInvoices),
      change: 0,
      icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10',
    },
    {
      title_ar: 'إجمالي العملاء', title_en: 'Total Customers',
      value: String(stats.totalCustomers),
      change: pctChange(stats.totalCustomers, prevStats.totalCustomers),
      icon: Users, color: 'text-rose-400', bg: 'bg-rose-400/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-arabic">{t('لوحة التحكم', 'Dashboard')}</h1>
          <p className="text-gray-400 text-sm font-arabic mt-1">{t('مرحباً بك في نظام إدارة التهاني', 'Welcome to Altahany Management System')}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm font-arabic">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString('ar-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title_en}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-gray-900 rounded-2xl p-5 border border-white/5 hover:border-amber-500/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              {kpi.change !== 0 && (
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {kpi.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {Math.abs(kpi.change)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
            <div className="text-xs text-gray-500 font-arabic">{t(kpi.title_ar, kpi.title_en)}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white font-arabic">{t('الإيرادات (6 أشهر)', 'Revenue (6 months)')}</h2>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-400"><span className="w-3 h-0.5 bg-amber-500 rounded" />{t('إيرادات', 'Revenue')}</span>
              <span className="flex items-center gap-1.5 text-gray-400"><span className="w-3 h-0.5 bg-blue-500 rounded" />{t('مصروفات', 'Expenses')}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#fff' }}
                formatter={(v: number) => [`AED ${v.toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} fill="url(#revenue)" />
              <Area type="monotone" dataKey="expenses" stroke="#3B82F6" strokeWidth={2} fill="url(#expenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <h2 className="text-base font-semibold text-white font-arabic mb-5">{t('الحجوزات حسب الخدمة', 'Bookings by Service')}</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={serviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {serviceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {serviceData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-400 font-arabic">{item.name}</span>
                </span>
                <span className="text-gray-300 font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Data */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm font-arabic">{t('آخر الحجوزات', 'Recent Bookings')}</h2>
            <a href="/admin/bookings" className="text-xs text-amber-400 hover:text-amber-300 font-arabic">{t('عرض الكل', 'View All')}</a>
          </div>
          <div className="divide-y divide-white/5">
            {recentBookings.length > 0 ? recentBookings.map(b => (
              <div key={b.id} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 font-arabic truncate">{b.customer_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{b.booking_number}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(b.status)}`}>
                  {getStatusLabel(b.status, 'ar')}
                </span>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-600 font-arabic text-sm">{t('لا توجد حجوزات بعد', 'No bookings yet')}</div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm font-arabic">{t('آخر الفواتير', 'Recent Invoices')}</h2>
            <a href="/admin/invoices" className="text-xs text-amber-400 hover:text-amber-300 font-arabic">{t('عرض الكل', 'View All')}</a>
          </div>
          <div className="divide-y divide-white/5">
            {recentInvoices.length > 0 ? recentInvoices.map(inv => (
              <div key={inv.id} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 font-arabic truncate">{inv.customer_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{inv.invoice_number}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-200 font-medium">{formatCurrency(inv.total || 0)}</div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(inv.status)}`}>
                    {getStatusLabel(inv.status, 'ar')}
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-600 font-arabic text-sm">{t('لا توجد فواتير بعد', 'No invoices yet')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/bookings', icon: Calendar, label_ar: 'حجز جديد', label_en: 'New Booking', color: 'from-blue-600 to-blue-700' },
          { href: '/admin/invoices/new', icon: FileText, label_ar: 'فاتورة جديدة', label_en: 'New Invoice', color: 'from-amber-500 to-amber-600' },
          { href: '/admin/quotations', icon: TrendingUp, label_ar: 'عرض سعر', label_en: 'New Quotation', color: 'from-emerald-600 to-emerald-700' },
          { href: '/admin/customers', icon: Users, label_ar: 'عميل جديد', label_en: 'New Customer', color: 'from-rose-600 to-rose-700' },
        ].map(action => (
          <a key={action.href} href={action.href}
            className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${action.color} text-white hover:opacity-90 transition-opacity`}
          >
            <action.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-semibold font-arabic">{t(action.label_ar, action.label_en)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
