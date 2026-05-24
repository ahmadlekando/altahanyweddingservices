import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'accountant' | 'employee' | 'customer';

export type Profile = {
  id: string;
  full_name: string;
  full_name_ar: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar_url: string;
  is_active: boolean;
  language: 'ar' | 'en';
  created_at: string;
};

export type Customer = {
  id: string;
  full_name: string;
  full_name_ar: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  country: string;
  vat_number: string;
  category: 'individual' | 'corporate' | 'vip';
  tags: string[];
  notes: string;
  is_active: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_date: string;
  event_type: string;
  venue: string;
  total_amount: number;
  deposit_amount: number;
  deposit_paid: boolean;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  invoice_type: 'tax' | 'proforma' | 'receipt';
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_vat: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  vat_percent: number;
  vat_amount: number;
  total: number;
  amount_paid: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  notes: string;
  terms: string;
  language: 'ar' | 'en' | 'both';
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  description_ar: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
  sort_order: number;
};

export type Quotation = {
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_date: string;
  event_type: string;
  issue_date: string;
  valid_until: string;
  subtotal: number;
  discount_percent: number;
  vat_percent: number;
  vat_amount: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired' | 'converted';
  notes: string;
  created_at: string;
};
