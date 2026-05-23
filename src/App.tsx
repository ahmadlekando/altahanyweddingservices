import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';

// Website Pages
import HomePage from './pages/website/HomePage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import BookingsPage from './pages/admin/BookingsPage';
import InvoicesPage from './pages/admin/InvoicesPage';
import NewInvoicePage from './pages/admin/NewInvoicePage';
import QuotationsPage from './pages/admin/QuotationsPage';
import CustomersPage from './pages/admin/CustomersPage';
import ReportsPage from './pages/admin/ReportsPage';
import AIToolsPage from './pages/admin/AIToolsPage';
import UsersPage from './pages/admin/UsersPage';
import SettingsPage from './pages/admin/SettingsPage';
import HallsPage from './pages/admin/HallsPage';
import SeoPage from './pages/admin/SeoPage';
import SlidersPage from './pages/admin/SlidersPage';
import MediaPage from './pages/admin/MediaPage';
import ServicesPage from './pages/admin/ServicesPage';
import GalleryPage from './pages/admin/GalleryPage';
import BlogPage from './pages/admin/BlogPage';
import FAQsPage from './pages/admin/FAQsPage';
import TestimonialsPage from './pages/admin/TestimonialsPage';

function AdminWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Website */}
            <Route path="/" element={<HomePage />} />

            {/* Auth */}
            <Route path="/admin/login" element={<LoginPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminWrapper><DashboardPage /></AdminWrapper>} />
            <Route path="/admin/bookings" element={<AdminWrapper><BookingsPage /></AdminWrapper>} />
            <Route path="/admin/invoices" element={<AdminWrapper><InvoicesPage /></AdminWrapper>} />
            <Route path="/admin/invoices/new" element={<AdminWrapper><NewInvoicePage /></AdminWrapper>} />
            <Route path="/admin/quotations" element={<AdminWrapper><QuotationsPage /></AdminWrapper>} />
            <Route path="/admin/quotations/new" element={<AdminWrapper><QuotationsPage /></AdminWrapper>} />
            <Route path="/admin/customers" element={<AdminWrapper><CustomersPage /></AdminWrapper>} />
            <Route path="/admin/reports" element={<AdminWrapper><ReportsPage /></AdminWrapper>} />
            <Route path="/admin/ai" element={<AdminWrapper><AIToolsPage /></AdminWrapper>} />
            <Route path="/admin/users" element={<AdminWrapper><UsersPage /></AdminWrapper>} />
            <Route path="/admin/settings" element={<AdminWrapper><SettingsPage /></AdminWrapper>} />
            <Route path="/admin/halls" element={<AdminWrapper><HallsPage /></AdminWrapper>} />
            <Route path="/admin/seo" element={<AdminWrapper><SeoPage /></AdminWrapper>} />
            <Route path="/admin/sliders" element={<AdminWrapper><SlidersPage /></AdminWrapper>} />
            <Route path="/admin/media" element={<AdminWrapper><MediaPage /></AdminWrapper>} />
            <Route path="/admin/services" element={<AdminWrapper><ServicesPage /></AdminWrapper>} />
            <Route path="/admin/gallery" element={<AdminWrapper><GalleryPage /></AdminWrapper>} />
            <Route path="/admin/blog" element={<AdminWrapper><BlogPage /></AdminWrapper>} />
            <Route path="/admin/faqs" element={<AdminWrapper><FAQsPage /></AdminWrapper>} />
            <Route path="/admin/testimonials" element={<AdminWrapper><TestimonialsPage /></AdminWrapper>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
