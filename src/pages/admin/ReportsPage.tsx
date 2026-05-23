import React, { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Download, Users, Calendar, FileText, DollarSign, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

type MonthlyStats = { month: string; revenue: number; bookings: number; invoices: number };
type ServiceStats = { name: string; value: number; color: string };

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F97316'];

const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTH_NAMES_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ReportsPage() {
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [serviceData, setServiceData] = useState<ServiceStats[]>([]);
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    avgDealValue: 0,
    revenueGrowth: 0,
  });

  const load = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const year = now.getFullYear();

      // Invoices for current year
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total, status, issue_date, invoice_type')
        .gte('issue_date', `${year}-01-01`)
        .lte('issue_date', `${year}-12-31`);

      // Bookings for current year
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, status, event_type, created_at')
        .gte('created_at', `${year}-01-01T00:00:00`);

      // Total customers
      const { count: customerCount } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

      // Build monthly stats (last 6 months)
      const monthly: MonthlyStats[] = [];
      for (let m = 5; m >= 0; m--) {
        const d = new Date(year, now.getMonth() - m, 1);
        const monthIdx = d.getMonth();
        const monthYear = `${d.getFullYear()}-${String(monthIdx + 1).padStart(2, '0')}`;

        const monthInvoices = (invoices || []).filter(i => i.issue_date?.startsWith(monthYear));
        const monthBookings = (bookings || []).filter(b => b.created_at?.startsWith(monthYear));

        monthly.push({
          month: t(MONTH_NAMES_AR[monthIdx], MONTH_NAMES_EN[monthIdx]),
          revenue: monthInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0),
          bookings: monthBookings.length,
          invoices: monthInvoices.length,
        });
      }

      // Service breakdown from bookings
      const eventTypeCounts: Record<string, number> = {};
      (bookings || []).forEach(b => {
        const type = b.event_type || 'wedding';
        eventTypeCounts[type] = (eventTypeCounts[type] || 0) + 1;
      });
      const serviceStats: ServiceStats[] = Object.entries(eventTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value], i) => ({ name, value, color: COLORS[i] }));

      if (serviceStats.length === 0) {
        serviceStats.push(
          { name: t('أفراح', 'Weddings'), value: 65, color: COLORS[0] },
          { name: t('خطوبة', 'Engagements'), value: 20, color: COLORS[1] },
          { name: t('حفلات', 'Events'), value: 15, color: COLORS[2] },
        );
      }

      // KPIs
      const paidRevenue = (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
      const pendingRevenue = (invoices || []).filter(i => ['draft', 'sent', 'partial'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0);
      const totalBookings = (bookings || []).length;

      // Prev 6 months vs current 6 months revenue for growth calc
      const prevRevenue = monthly.slice(0, 3).reduce((s, m) => s + m.revenue, 0);
      const currRevenue = monthly.slice(3).reduce((s, m) => s + m.revenue, 0);
      const growth = prevRevenue > 0 ? ((currRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      setKpis({
        totalRevenue: paidRevenue,
        totalBookings,
        totalInvoices: (invoices || []).length,
        totalCustomers: customerCount || 0,
        paidRevenue,
        pendingRevenue,
        avgDealValue: totalBookings > 0 ? paidRevenue / Math.max(totalBookings, 1) : 0,
        revenueGrowth: growth,
      });
      setMonthlyData(monthly);
      setServiceData(serviceStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = [
    { label_ar: 'إجمالي الإيرادات', label_en: 'Total Revenue', value: formatCurrency(kpis.totalRevenue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label_ar: 'الحجوزات الكلية', label_en: 'Total Bookings', value: kpis.totalBookings.toString(), icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label_ar: 'إجمالي الفواتير', label_en: 'Total Invoices', value: kpis.totalInvoices.toString(), icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label_ar: 'إجمالي العملاء', label_en: 'Total Customers', value: kpis.totalCustomers.toString(), icon: Users, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label_ar: 'المحصّل', label_en: 'Collected', value: formatCurrency(kpis.paidRevenue), icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label_ar: 'مستحق السداد', label_en: 'Pending', value: formatCurrency(kpis.pendingRevenue), icon: BarChart2, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label_ar: 'متوسط الصفقة', label_en: 'Avg Deal', value: formatCurrency(kpis.avgDealValue), icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-400/10' },
    {
      label_ar: 'نمو الإيرادات', label_en: 'Revenue Growth',
      value: `${kpis.revenueGrowth >= 0 ? '+' : ''}${kpis.revenueGrowth.toFixed(1)}%`,
      icon: TrendingUp,
      color: kpis.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400',
      bg: kpis.revenueGrowth >= 0 ? 'bg-emerald-400/10' : 'bg-red-400/10',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white font-arabic">{t('التقارير والإحصائيات', 'Reports & Analytics')}</h1>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-white/10 text-gray-300 rounded-xl text-sm font-arabic hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('تحديث', 'Refresh')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-white/10 text-gray-300 rounded-xl text-sm font-arabic hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />
            {t('تصدير', 'Export')}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-gray-900 rounded-2xl p-4 border border-white/5 ${loading ? 'animate-pulse' : ''}`}>
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className={`text-lg font-bold ${stat.color} mb-1`}>{loading ? '—' : stat.value}</div>
            <div className="text-xs text-gray-500 font-arabic">{t(stat.label_ar, stat.label_en)}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
        <h2 className="text-sm font-semibold text-white font-arabic mb-5">{t('الإيرادات الشهرية (آخر 6 أشهر)', 'Monthly Revenue (Last 6 Months)')}</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `${(v / 1000).toFixed(0)}K` : '0'} />
            <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#fff' }} formatter={(v: number) => [`AED ${v.toLocaleString()}`, t('الإيرادات', 'Revenue')]} />
            <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2.5} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Bookings Chart */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <h2 className="text-sm font-semibold text-white font-arabic mb-5">{t('الحجوزات والفواتير', 'Bookings & Invoices')}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="bookings" fill="#3B82F6" radius={[6, 6, 0, 0]} name={t('الحجوزات', 'Bookings')} />
              <Bar dataKey="invoices" fill="#F59E0B" radius={[6, 6, 0, 0]} name={t('الفواتير', 'Invoices')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Breakdown */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
          <h2 className="text-sm font-semibold text-white font-arabic mb-5">{t('توزيع أنواع الفعاليات', 'Event Type Breakdown')}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={serviceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {serviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#fff' }} />
              <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: 11 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
