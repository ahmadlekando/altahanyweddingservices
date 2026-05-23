import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Calendar, FileText, FileCheck, Settings,
  Menu, X, LogOut, Bell, Search, ChevronDown, Package, Image,
  BarChart2, MessageSquare, Globe, Database, Sparkles, TrendingUp, Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

type NavItem = {
  icon: React.ElementType;
  label_ar: string;
  label_en: string;
  href: string;
  badge?: number;
  children?: { label_ar: string; label_en: string; href: string }[];
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label_ar: 'لوحة التحكم', label_en: 'Dashboard', href: '/admin' },
  { icon: Calendar, label_ar: 'الحجوزات', label_en: 'Bookings', href: '/admin/bookings', badge: 3 },
  {
    icon: FileText, label_ar: 'الفواتير', label_en: 'Invoices', href: '/admin/invoices',
    children: [
      { label_ar: 'كل الفواتير', label_en: 'All Invoices', href: '/admin/invoices' },
      { label_ar: 'فاتورة جديدة', label_en: 'New Invoice', href: '/admin/invoices/new' },
    ]
  },
  {
    icon: FileCheck, label_ar: 'عروض الأسعار', label_en: 'Quotations', href: '/admin/quotations',
    children: [
      { label_ar: 'كل العروض', label_en: 'All Quotations', href: '/admin/quotations' },
      { label_ar: 'عرض سعر جديد', label_en: 'New Quotation', href: '/admin/quotations/new' },
    ]
  },
  { icon: Users, label_ar: 'العملاء', label_en: 'Customers', href: '/admin/customers' },
  { icon: Building2, label_ar: 'قاعات الأفراح', label_en: 'Wedding Halls', href: '/admin/halls' },
  { icon: Package, label_ar: 'الخدمات', label_en: 'Services', href: '/admin/services' },
  { icon: Image, label_ar: 'المعرض', label_en: 'Gallery', href: '/admin/gallery' },
  { icon: Database, label_ar: 'مكتبة الميديا', label_en: 'Media Library', href: '/admin/media' },
  { icon: TrendingUp, label_ar: 'التقارير', label_en: 'Reports', href: '/admin/reports' },
  { icon: Sparkles, label_ar: 'أدوات AI', label_en: 'AI Tools', href: '/admin/ai' },
  {
    icon: Globe, label_ar: 'الموقع', label_en: 'Website', href: '/admin/website',
    children: [
      { label_ar: 'سلايدر الرئيسية', label_en: 'Hero Sliders', href: '/admin/sliders' },
      { label_ar: 'الأسئلة الشائعة', label_en: 'FAQs', href: '/admin/faqs' },
      { label_ar: 'آراء العملاء', label_en: 'Testimonials', href: '/admin/testimonials' },
      { label_ar: 'محرك SEO', label_en: 'SEO Engine', href: '/admin/seo' },
    ]
  },
  { icon: MessageSquare, label_ar: 'المدونة', label_en: 'Blog', href: '/admin/blog' },
  { icon: Users, label_ar: 'المستخدمون', label_en: 'Users', href: '/admin/users' },
  { icon: Settings, label_ar: 'الإعدادات', label_en: 'Settings', href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const toggleExpand = (href: string) => {
    setExpandedItems(prev => prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]);
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (item: NavItem) =>
    isActive(item.href) || item.children?.some(c => isActive(c.href));

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : ''}`}>
      {/* Logo */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base">ت</span>
          </div>
          <AnimatePresence>
            {(sidebarOpen || mobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <div className="text-white font-bold text-sm">ALTAHANY</div>
                <div className="text-amber-400/70 text-xs font-arabic">لوحة التحكم</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <div key={item.href}>
            <button
              onClick={() => {
                if (item.children) {
                  toggleExpand(item.href);
                } else {
                  navigate(item.href);
                  setMobileSidebarOpen(false);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-arabic transition-all duration-200 group',
                isParentActive(item)
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              )}
            >
              <item.icon className={cn('w-4 h-4 flex-shrink-0', isParentActive(item) ? 'text-amber-400' : 'text-gray-500 group-hover:text-gray-300')} />
              <AnimatePresence>
                {(sidebarOpen || mobile) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-between overflow-hidden"
                  >
                    <span className="truncate">{t(item.label_ar, item.label_en)}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.badge && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                          {item.badge}
                        </span>
                      )}
                      {item.children && (
                        <motion.div
                          animate={{ rotate: expandedItems.includes(item.href) ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            <AnimatePresence>
              {item.children && expandedItems.includes(item.href) && (sidebarOpen || mobile) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden ms-6 mt-0.5 space-y-0.5"
                >
                  {item.children.map(child => (
                    <Link
                      key={child.href}
                      to={child.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={cn(
                        'block px-3 py-2 rounded-xl text-xs font-arabic transition-all',
                        isActive(child.href) ? 'bg-amber-500/15 text-amber-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      )}
                    >
                      {t(child.label_ar, child.label_en)}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        <div className={cn('flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors', sidebarOpen || mobile ? '' : 'justify-center')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {profile?.full_name?.charAt(0) || 'A'}
          </div>
          <AnimatePresence>
            {(sidebarOpen || mobile) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <div className="text-white text-xs font-medium truncate">{profile?.full_name || 'Admin'}</div>
                <div className="text-gray-500 text-xs capitalize">{profile?.role || 'admin'}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {(sidebarOpen || mobile) && (
            <button onClick={handleSignOut} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:flex flex-col bg-gray-900 border-r border-white/5 overflow-hidden flex-shrink-0"
      >
        <Sidebar />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-gray-900 border-l border-white/5 z-50 lg:hidden"
            >
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-gray-900/50 backdrop-blur-sm border-b border-white/5 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors text-gray-400"
          >
            <Menu className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors text-gray-400"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder={t('بحث...', 'Search...')}
                className="w-full pl-4 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors font-arabic"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ms-auto">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
              >
                <Bell className="w-4 h-4 text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
              </button>
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-10 right-0 w-80 bg-gray-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5">
                      <h3 className="text-sm font-semibold text-white font-arabic">{t('الإشعارات', 'Notifications')}</h3>
                    </div>
                    <div className="p-2 space-y-1">
                      {[
                        { title_ar: 'حجز جديد من أحمد محمد', title_en: 'New booking from Ahmed Mohamed', time: '5m' },
                        { title_ar: 'فاتورة INV-001 مستحقة الدفع', title_en: 'Invoice INV-001 payment due', time: '1h' },
                        { title_ar: 'تقييم جديد من عميل', title_en: 'New review from a customer', time: '3h' },
                      ].map((notif, i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                          <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-200 font-arabic truncate">{t(notif.title_ar, notif.title_en)}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{notif.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/" target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-xs text-gray-400 font-arabic">
              <Globe className="w-3.5 h-3.5" />
              {t('الموقع', 'Website')}
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
