/*
  # ALTAHANY Wedding Services - Complete Database Schema
  Full enterprise schema including profiles, CRM, bookings, invoices, quotations,
  content management, settings, AI settings, analytics, and seed data.
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  full_name_ar text DEFAULT '',
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin','admin','manager','accountant','employee','customer')),
  avatar_url text DEFAULT '',
  is_active boolean DEFAULT true,
  language text DEFAULT 'ar' CHECK (language IN ('ar','en')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager'))
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin'))
    OR auth.uid() = id
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL DEFAULT '',
  full_name_ar text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  whatsapp text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  country text DEFAULT 'UAE',
  vat_number text DEFAULT '',
  trade_license text DEFAULT '',
  notes text DEFAULT '',
  tags text[] DEFAULT '{}',
  category text DEFAULT 'individual' CHECK (category IN ('individual','corporate','vip')),
  source text DEFAULT 'walk_in',
  is_active boolean DEFAULT true,
  avatar_url text DEFAULT '',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view customers"
  ON customers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant','employee')));

CREATE POLICY "Staff can insert customers"
  ON customers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','employee')));

CREATE POLICY "Staff can update customers"
  ON customers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','employee')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','employee')));

-- SERVICES
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  name_ar text DEFAULT '',
  description text DEFAULT '',
  description_ar text DEFAULT '',
  price numeric(10,2) DEFAULT 0,
  unit text DEFAULT 'service',
  category text DEFAULT 'general',
  image_url text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services"
  ON services FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Admins can update services"
  ON services FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

-- PACKAGES
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  name_ar text DEFAULT '',
  description text DEFAULT '',
  description_ar text DEFAULT '',
  price numeric(10,2) DEFAULT 0,
  original_price numeric(10,2) DEFAULT 0,
  features text[] DEFAULT '{}',
  features_ar text[] DEFAULT '{}',
  category text DEFAULT 'standard' CHECK (category IN ('standard','premium','vip','custom')),
  badge text DEFAULT '',
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON packages FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage packages"
  ON packages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Admins can update packages"
  ON packages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text UNIQUE NOT NULL DEFAULT '',
  customer_id uuid REFERENCES customers(id),
  customer_name text NOT NULL DEFAULT '',
  customer_phone text DEFAULT '',
  customer_email text DEFAULT '',
  event_date date,
  event_time time,
  event_type text DEFAULT 'wedding',
  venue text DEFAULT '',
  services_requested text[] DEFAULT '{}',
  package_id uuid REFERENCES packages(id),
  total_amount numeric(10,2) DEFAULT 0,
  deposit_amount numeric(10,2) DEFAULT 0,
  deposit_paid boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled')),
  notes text DEFAULT '',
  special_requests text DEFAULT '',
  assigned_to uuid REFERENCES profiles(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view bookings"
  ON bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant','employee')));

CREATE POLICY "Staff can insert bookings"
  ON bookings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','employee')));

CREATE POLICY "Staff can update bookings"
  ON bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','employee')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','employee')));

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL DEFAULT '',
  invoice_type text DEFAULT 'tax' CHECK (invoice_type IN ('tax','proforma','receipt')),
  customer_id uuid REFERENCES customers(id),
  customer_name text NOT NULL DEFAULT '',
  customer_phone text DEFAULT '',
  customer_email text DEFAULT '',
  customer_address text DEFAULT '',
  customer_vat text DEFAULT '',
  booking_id uuid REFERENCES bookings(id),
  issue_date date DEFAULT CURRENT_DATE,
  due_date date,
  subtotal numeric(10,2) DEFAULT 0,
  discount_percent numeric(5,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  vat_percent numeric(5,2) DEFAULT 5,
  vat_amount numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  amount_paid numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'AED',
  status text DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','partial','overdue','cancelled')),
  notes text DEFAULT '',
  terms text DEFAULT '',
  language text DEFAULT 'ar' CHECK (language IN ('ar','en','both')),
  qr_code text DEFAULT '',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view invoices"
  ON invoices FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant','employee')));

CREATE POLICY "Staff can insert invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

CREATE POLICY "Staff can update invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

-- INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  description_ar text DEFAULT '',
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(10,2) DEFAULT 0,
  discount_percent numeric(5,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  sort_order integer DEFAULT 0
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view invoice items"
  ON invoice_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant','employee')));

CREATE POLICY "Staff can insert invoice items"
  ON invoice_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

CREATE POLICY "Staff can update invoice items"
  ON invoice_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

CREATE POLICY "Staff can delete invoice items"
  ON invoice_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

-- QUOTATIONS
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text UNIQUE NOT NULL DEFAULT '',
  customer_id uuid REFERENCES customers(id),
  customer_name text NOT NULL DEFAULT '',
  customer_phone text DEFAULT '',
  customer_email text DEFAULT '',
  customer_address text DEFAULT '',
  event_date date,
  event_type text DEFAULT 'wedding',
  issue_date date DEFAULT CURRENT_DATE,
  valid_until date,
  subtotal numeric(10,2) DEFAULT 0,
  discount_percent numeric(5,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  vat_percent numeric(5,2) DEFAULT 5,
  vat_amount numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'AED',
  status text DEFAULT 'draft' CHECK (status IN ('draft','sent','approved','rejected','expired','converted')),
  converted_to_invoice uuid REFERENCES invoices(id),
  notes text DEFAULT '',
  terms text DEFAULT '',
  language text DEFAULT 'ar' CHECK (language IN ('ar','en','both')),
  digital_signature text DEFAULT '',
  signed_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view quotations"
  ON quotations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant','employee')));

CREATE POLICY "Staff can insert quotations"
  ON quotations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

CREATE POLICY "Staff can update quotations"
  ON quotations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

-- QUOTATION ITEMS
CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  description_ar text DEFAULT '',
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(10,2) DEFAULT 0,
  discount_percent numeric(5,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  sort_order integer DEFAULT 0
);

ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view quotation items"
  ON quotation_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant','employee')));

CREATE POLICY "Staff can insert quotation items"
  ON quotation_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

CREATE POLICY "Staff can update quotation items"
  ON quotation_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

CREATE POLICY "Staff can delete quotation items"
  ON quotation_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

-- POSTS
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  title_ar text DEFAULT '',
  slug text UNIQUE NOT NULL DEFAULT '',
  content text DEFAULT '',
  content_ar text DEFAULT '',
  excerpt text DEFAULT '',
  excerpt_ar text DEFAULT '',
  featured_image text DEFAULT '',
  category text DEFAULT 'tips',
  tags text[] DEFAULT '{}',
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  seo_keywords text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  views integer DEFAULT 0,
  author_id uuid REFERENCES profiles(id),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
  ON posts FOR SELECT USING (status = 'published');

CREATE POLICY "Staff can view all posts"
  ON posts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','employee')));

CREATE POLICY "Staff can manage posts"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Staff can update posts"
  ON posts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

-- MEDIA
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL DEFAULT '',
  original_name text DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  file_type text DEFAULT 'image' CHECK (file_type IN ('image','video','audio','pdf','document','other')),
  file_size bigint DEFAULT 0,
  mime_type text DEFAULT '',
  width integer,
  height integer,
  alt_text text DEFAULT '',
  alt_text_ar text DEFAULT '',
  folder text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  watermark_applied boolean DEFAULT false,
  download_count integer DEFAULT 0,
  is_public boolean DEFAULT true,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public media"
  ON media FOR SELECT USING (is_public = true);

CREATE POLICY "Staff can manage media"
  ON media FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','employee')));

CREATE POLICY "Staff can update media"
  ON media FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','employee')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','employee')));

-- GALLERY ITEMS
CREATE TABLE IF NOT EXISTS gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT '',
  title_ar text DEFAULT '',
  description text DEFAULT '',
  media_id uuid REFERENCES media(id),
  media_url text NOT NULL DEFAULT '',
  thumbnail_url text DEFAULT '',
  media_type text DEFAULT 'image' CHECK (media_type IN ('image','video','reel')),
  category text DEFAULT 'wedding',
  tags text[] DEFAULT '{}',
  likes_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  downloads_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_public boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public gallery"
  ON gallery_items FOR SELECT USING (is_public = true);

CREATE POLICY "Staff can manage gallery"
  ON gallery_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Staff can update gallery"
  ON gallery_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

-- SLIDERS
CREATE TABLE IF NOT EXISTS sliders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT '',
  title_ar text DEFAULT '',
  subtitle text DEFAULT '',
  subtitle_ar text DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  video_url text DEFAULT '',
  cta_text text DEFAULT '',
  cta_text_ar text DEFAULT '',
  cta_url text DEFAULT '',
  overlay_opacity numeric(3,2) DEFAULT 0.4,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sliders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sliders"
  ON sliders FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage sliders"
  ON sliders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

CREATE POLICY "Admins can update sliders"
  ON sliders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

-- TESTIMONIALS
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL DEFAULT '',
  customer_name_ar text DEFAULT '',
  customer_photo text DEFAULT '',
  rating integer DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  review text DEFAULT '',
  review_ar text DEFAULT '',
  event_type text DEFAULT 'wedding',
  video_url text DEFAULT '',
  is_featured boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  is_public boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials"
  ON testimonials FOR SELECT USING (is_approved = true AND is_public = true);

CREATE POLICY "Admins can manage testimonials"
  ON testimonials FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Admins can update testimonials"
  ON testimonials FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

-- COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL DEFAULT '',
  author_name text DEFAULT '',
  author_email text DEFAULT '',
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  gallery_item_id uuid REFERENCES gallery_items(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id),
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved comments"
  ON comments FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can submit comments with content"
  ON comments FOR INSERT
  WITH CHECK (length(trim(content)) > 0 AND length(trim(author_name)) > 0);

CREATE POLICY "Admins can manage comments"
  ON comments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

-- LIKES
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  gallery_item_id uuid REFERENCES gallery_items(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, gallery_item_id),
  UNIQUE(session_id, post_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert likes with session"
  ON likes FOR INSERT
  WITH CHECK (length(trim(session_id)) > 0);

-- MEMBERSHIPS
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  name_ar text DEFAULT '',
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium','vip')),
  price_monthly numeric(10,2) DEFAULT 0,
  price_yearly numeric(10,2) DEFAULT 0,
  features text[] DEFAULT '{}',
  features_ar text[] DEFAULT '{}',
  limits jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active memberships"
  ON memberships FOR SELECT USING (is_active = true);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number text UNIQUE NOT NULL DEFAULT '',
  customer_id uuid REFERENCES customers(id),
  invoice_id uuid REFERENCES invoices(id),
  booking_id uuid REFERENCES bookings(id),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'AED',
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash','card','bank_transfer','stripe','paypal','tabby','tamara','cheque')),
  payment_date date DEFAULT CURRENT_DATE,
  reference_number text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  notes text DEFAULT '',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view payments"
  ON payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

CREATE POLICY "Staff can insert payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

CREATE POLICY "Staff can update payments"
  ON payments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

-- CONTRACTS
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text UNIQUE NOT NULL DEFAULT '',
  customer_id uuid REFERENCES customers(id),
  booking_id uuid REFERENCES bookings(id),
  title text DEFAULT '',
  title_ar text DEFAULT '',
  content text DEFAULT '',
  content_ar text DEFAULT '',
  start_date date,
  end_date date,
  total_value numeric(10,2) DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','active','completed','cancelled')),
  customer_signature text DEFAULT '',
  admin_signature text DEFAULT '',
  signed_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view contracts"
  ON contracts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

CREATE POLICY "Staff can insert contracts"
  ON contracts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Staff can update contracts"
  ON contracts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  title_ar text DEFAULT '',
  message text DEFAULT '',
  message_ar text DEFAULT '',
  type text DEFAULT 'info' CHECK (type IN ('info','success','warning','error','booking','invoice','payment')),
  link text DEFAULT '',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager'))
    OR auth.uid() = user_id
  );

-- REMINDERS
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  remind_at timestamptz NOT NULL,
  booking_id uuid REFERENCES bookings(id),
  invoice_id uuid REFERENCES invoices(id),
  is_sent boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reminders"
  ON reminders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text DEFAULT '',
  value_json jsonb DEFAULT NULL,
  type text DEFAULT 'string' CHECK (type IN ('string','number','boolean','json','color')),
  category text DEFAULT 'general',
  label text DEFAULT '',
  label_ar text DEFAULT '',
  description text DEFAULT '',
  is_public boolean DEFAULT false,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public settings"
  ON settings FOR SELECT USING (is_public = true);

CREATE POLICY "Staff can view all settings"
  ON settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Admins can manage settings"
  ON settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

-- AI SETTINGS
CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text UNIQUE NOT NULL,
  is_enabled boolean DEFAULT false,
  provider text DEFAULT 'openai',
  model text DEFAULT 'gpt-4',
  system_prompt text DEFAULT '',
  temperature numeric(3,2) DEFAULT 0.7,
  max_tokens integer DEFAULT 1000,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ai_settings"
  ON ai_settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

CREATE POLICY "Admins can insert ai_settings"
  ON ai_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

CREATE POLICY "Admins can update ai_settings"
  ON ai_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

-- SEO SETTINGS
CREATE TABLE IF NOT EXISTS seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text UNIQUE NOT NULL,
  title text DEFAULT '',
  title_ar text DEFAULT '',
  description text DEFAULT '',
  description_ar text DEFAULT '',
  keywords text[] DEFAULT '{}',
  og_image text DEFAULT '',
  schema_markup jsonb DEFAULT '{}',
  canonical_url text DEFAULT '',
  robots text DEFAULT 'index,follow',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seo_settings"
  ON seo_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage seo_settings"
  ON seo_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

CREATE POLICY "Admins can update seo_settings"
  ON seo_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

-- ANALYTICS
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT '',
  page text DEFAULT '',
  referrer text DEFAULT '',
  user_agent text DEFAULT '',
  ip_hash text DEFAULT '',
  session_id text DEFAULT '',
  user_id uuid REFERENCES profiles(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics"
  ON analytics FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Anyone can insert analytics with valid event"
  ON analytics FOR INSERT
  WITH CHECK (event_type IS NOT NULL AND length(trim(event_type)) > 0);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL DEFAULT '',
  table_name text DEFAULT '',
  record_id text DEFAULT '',
  old_values jsonb DEFAULT '{}',
  new_values jsonb DEFAULT '{}',
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL DEFAULT '',
  question_ar text DEFAULT '',
  answer text DEFAULT '',
  answer_ar text DEFAULT '',
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active faqs"
  ON faqs FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage faqs"
  ON faqs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Admins can update faqs"
  ON faqs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

-- NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text DEFAULT '',
  language text DEFAULT 'ar',
  is_active boolean DEFAULT true,
  subscribed_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view subscribers"
  ON newsletter_subscribers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Anyone can subscribe with valid email"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT '',
  company_name_ar text DEFAULT '',
  contact_name text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  vat_number text DEFAULT '',
  trade_license text DEFAULT '',
  category text DEFAULT 'general',
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view suppliers"
  ON suppliers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant','employee')));

CREATE POLICY "Staff can insert suppliers"
  ON suppliers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Staff can update suppliers"
  ON suppliers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

-- EMAIL LOGS
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  to_name text,
  subject text NOT NULL,
  log_type text DEFAULT 'manual',
  reference_id uuid,
  status text DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','bounced')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view email logs"
  ON email_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager','accountant')));

CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- WEDDING HALLS
CREATE TABLE IF NOT EXISTS wedding_halls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  name_ar text DEFAULT '',
  description text DEFAULT '',
  description_ar text DEFAULT '',
  city text DEFAULT 'Sharjah',
  address text DEFAULT '',
  map_url text DEFAULT '',
  capacity_min integer DEFAULT 0,
  capacity_max integer DEFAULT 0,
  price_per_night numeric(10,2) DEFAULT 0,
  features text[] DEFAULT '{}',
  features_ar text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  phone text DEFAULT '',
  email text DEFAULT '',
  rating numeric(3,2) DEFAULT 0,
  reviews_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wedding_halls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active halls"
  ON wedding_halls FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage halls"
  ON wedding_halls FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

CREATE POLICY "Admins can update halls"
  ON wedding_halls FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','manager')));

-- MARQUEE MESSAGES
CREATE TABLE IF NOT EXISTS marquee_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL DEFAULT '',
  message_ar text DEFAULT '',
  link_url text DEFAULT '',
  link_text text DEFAULT '',
  link_text_ar text DEFAULT '',
  bg_color text DEFAULT '#F59E0B',
  text_color text DEFAULT '#000000',
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marquee_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active marquee messages"
  ON marquee_messages FOR SELECT
  USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));

CREATE POLICY "Admins can manage marquee"
  ON marquee_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

CREATE POLICY "Admins can update marquee"
  ON marquee_messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- SEED: Settings
INSERT INTO settings (key, value, type, category, label, label_ar, is_public) VALUES
  ('company_name', 'ALTAHANY Wedding Services', 'string', 'company', 'Company Name', 'اسم الشركة', true),
  ('company_name_ar', 'التهاني لخدمات الأفراح', 'string', 'company', 'Company Name Arabic', 'اسم الشركة بالعربي', true),
  ('company_phone', '+971506000000', 'string', 'company', 'Phone', 'الهاتف', true),
  ('company_email', 'info@altahany.com', 'string', 'company', 'Email', 'البريد الإلكتروني', true),
  ('company_address', 'Sharjah, UAE', 'string', 'company', 'Address', 'العنوان', true),
  ('vat_number', 'TRN000000000', 'string', 'company', 'VAT Number', 'الرقم الضريبي', true),
  ('currency', 'AED', 'string', 'finance', 'Currency', 'العملة', true),
  ('vat_rate', '5', 'number', 'finance', 'VAT Rate', 'نسبة الضريبة', true),
  ('invoice_prefix', 'INV', 'string', 'finance', 'Invoice Prefix', 'بادئة الفاتورة', false),
  ('quotation_prefix', 'QUO', 'string', 'finance', 'Quotation Prefix', 'بادئة العرض', false),
  ('smtp_host', 'smtp.hostinger.com', 'string', 'email', 'SMTP Host', 'خادم SMTP', false),
  ('smtp_port', '465', 'string', 'email', 'SMTP Port', 'منفذ SMTP', false),
  ('smtp_email', 'info@altahany.com', 'string', 'email', 'SMTP Email', 'بريد SMTP', false),
  ('smtp_password', 'Altahany@2024', 'string', 'email', 'SMTP Password', 'كلمة مرور SMTP', false),
  ('social_instagram', 'https://instagram.com/altahany', 'string', 'social', 'Instagram', 'انستقرام', true),
  ('social_tiktok', 'https://tiktok.com/@altahany', 'string', 'social', 'TikTok', 'تيك توك', true),
  ('social_facebook', 'https://facebook.com/altahany', 'string', 'social', 'Facebook', 'فيسبوك', true),
  ('social_youtube', 'https://youtube.com/@altahany', 'string', 'social', 'YouTube', 'يوتيوب', true),
  ('social_whatsapp', 'https://wa.me/971506000000', 'string', 'social', 'WhatsApp', 'واتساب', true)
ON CONFLICT (key) DO NOTHING;

-- SEED: AI Settings
INSERT INTO ai_settings (feature, is_enabled, provider, model) VALUES
  ('quotation_generator', false, 'openai', 'gpt-4'),
  ('invoice_assistant', false, 'openai', 'gpt-4'),
  ('email_writer', false, 'openai', 'gpt-4'),
  ('social_caption', false, 'openai', 'gpt-4'),
  ('hashtag_generator', false, 'openai', 'gpt-4'),
  ('package_creator', false, 'openai', 'gpt-4'),
  ('seo_optimizer', false, 'openai', 'gpt-4'),
  ('chatbot', false, 'openai', 'gpt-4')
ON CONFLICT (feature) DO NOTHING;

-- SEED: FAQs
INSERT INTO faqs (question, question_ar, answer, answer_ar, category, sort_order) VALUES
  ('What services do you offer?', 'ما هي الخدمات التي تقدمونها؟', 'We offer comprehensive wedding services including Zaffa, Kousha, decorations, photography, videography, DJ, bridal makeup, wedding cars, and luxury event planning.', 'نقدم خدمات أفراح شاملة تشمل الزفة، الكوشة، الديكورات، التصوير، الفيديو، الدي جي، مكياج العرائس، سيارات الأفراح، وتنظيم الفعاليات الفاخرة.', 'services', 1),
  ('How do I book your services?', 'كيف أحجز خدماتكم؟', 'You can book through our website, call us at +971506000000, or contact us via WhatsApp.', 'يمكنك الحجز عبر موقعنا، أو الاتصال بنا على +971506000000، أو التواصل معنا عبر واتساب.', 'booking', 2),
  ('Do you work across UAE?', 'هل تعملون في جميع أنحاء الإمارات؟', 'Yes, we provide services across all emirates in the UAE.', 'نعم، نقدم خدماتنا في جميع إمارات الدولة.', 'general', 3),
  ('What is your pricing?', 'ما هي أسعاركم؟', 'Our packages start from AED 5,000. Contact us for a customized quotation.', 'تبدأ باقاتنا من 5,000 درهم. تواصل معنا للحصول على عرض سعر مخصص.', 'pricing', 4)
ON CONFLICT DO NOTHING;

-- SEED: Packages
INSERT INTO packages (name, name_ar, description, description_ar, price, original_price, features, features_ar, category, badge, is_featured, sort_order) VALUES
  ('Silver Package', 'باقة الفضة', 'Perfect for intimate wedding ceremonies', 'مثالية للحفلات الزفاف الصغيرة', 8000, 10000, ARRAY['Zaffa Service','Basic Decoration','Photography 4h','Bridal Makeup'], ARRAY['خدمة الزفة','ديكور أساسي','تصوير 4 ساعات','مكياج العروس'], 'standard', 'Popular', false, 1),
  ('Gold Package', 'باقة الذهب', 'Our most popular wedding package', 'باقتنا الأكثر شعبية', 15000, 20000, ARRAY['Full Zaffa','Premium Kousha','Full Day Photography','Videography','DJ','Bridal Makeup','Wedding Car'], ARRAY['زفة كاملة','كوشة فاخرة','تصوير طوال اليوم','فيديو','دي جي','مكياج العروس','سيارة أفراح'], 'premium', 'Best Seller', true, 2),
  ('Platinum Package', 'باقة البلاتين', 'Ultimate luxury wedding experience', 'تجربة زفاف فاخرة بالكامل', 30000, 40000, ARRAY['Grand Zaffa','Luxury Kousha','2-Day Photography','Cinematic Video','2 DJs','Full Makeup Team','2 Wedding Cars','Event Planner'], ARRAY['زفة كبرى','كوشة فاخرة','تصوير يومين','فيديو سينمائي','دي جيان','فريق مكياج كامل','سيارتان','منسق فعاليات'], 'vip', 'VIP', false, 3)
ON CONFLICT DO NOTHING;

-- SEED: Services
INSERT INTO services (name, name_ar, description, description_ar, price, category, sort_order) VALUES
  ('Zaffa', 'الزفة', 'Traditional wedding procession', 'موكب الزفاف التقليدي', 2000, 'ceremony', 1),
  ('Kousha', 'الكوشة', 'Elegant wedding stage decoration', 'ديكور منصة الزواج الأنيق', 3000, 'decoration', 2),
  ('Decorations', 'الديكورات', 'Full venue decoration', 'تزيين القاعة الكاملة', 5000, 'decoration', 3),
  ('Photography', 'التصوير', 'Professional wedding photography', 'تصوير أفراح احترافي', 3500, 'media', 4),
  ('Videography', 'الفيديو', 'Cinematic wedding videography', 'تصوير فيديو سينمائي', 4000, 'media', 5),
  ('DJ', 'الدي جي', 'Professional DJ with premium sound', 'دي جي احترافي مع نظام صوت', 2500, 'entertainment', 6),
  ('Bridal Makeup', 'مكياج العروس', 'Professional bridal makeup', 'مكياج احترافي للعروس', 1500, 'beauty', 7),
  ('Wedding Cars', 'سيارات الأفراح', 'Luxury wedding car rentals', 'تأجير سيارات الأفراح', 1200, 'transport', 8),
  ('Event Planning', 'تنظيم الفعاليات', 'Full wedding event planning', 'تخطيط حفل الزفاف بالكامل', 8000, 'planning', 9)
ON CONFLICT DO NOTHING;

-- SEED: Marquee messages
INSERT INTO marquee_messages (message, message_ar, is_active, sort_order) VALUES
  ('Book your dream wedding today! Limited slots for 2025', 'احجز زفافك الاستثنائي اليوم! أماكن محدودة لعام 2025', true, 1),
  ('Special discounts up to 30% on all packages', 'خصومات خاصة تصل إلى 30% على جميع الباقات', true, 2)
ON CONFLICT DO NOTHING;
