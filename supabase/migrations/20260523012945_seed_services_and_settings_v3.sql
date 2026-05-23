
/*
  # Seed Services & Update Settings (v3)

  1. Add missing columns to services (icon, base_price, is_featured, updated_at)
  2. Upsert all 9 Al Tahany services
  3. Upsert contact/social settings (type = 'string' per check constraint)
*/

-- ============================================================
-- 1. Add missing columns to services
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'icon') THEN
    ALTER TABLE public.services ADD COLUMN icon text DEFAULT '✨';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'base_price') THEN
    ALTER TABLE public.services ADD COLUMN base_price numeric(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'is_featured') THEN
    ALTER TABLE public.services ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'updated_at') THEN
    ALTER TABLE public.services ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================================
-- 2. Upsert services
-- ============================================================
INSERT INTO public.services (name, name_ar, description, description_ar, icon, base_price, price, category, is_featured, is_active, sort_order, image_url)
VALUES
  ('Zaffa','الزفة','Luxurious traditional Zaffa with oriental music and vibrant dance','زفة تقليدية فاخرة بالموسيقى الشرقية والرقص الحماسي لاستقبال العروسين','🎵',1500,1500,'music',true,true,1,'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=600'),
  ('Kousha & Decor','الكوشة والديكور','All types of Kousha (Emirati, Indian, Classic, Outdoor, Henna) with natural and artificial floral decor','جميع أنواع الكوش (إماراتي، هندي، كلاسيك، خارجي، حنة) بأرقى التصاميم وزهور طبيعية وصناعية','✨',3000,3000,'decor',true,true,2,'https://images.pexels.com/photos/1478442/pexels-photo-1478442.jpeg?auto=compress&cs=tinysrgb&w=600'),
  ('Lighting & Effects','الإضاءة والمؤثرات','Spot & Stage Lighting, Smoke, Fog & Snow Machines, illuminated Dance Floor, and celebratory Sparkles','Spot Light، Stage Lighting، Smoke & Fog & Snow، Dance Floor مضيء، Sparkles احتفالية','💡',2000,2000,'decor',true,true,3,'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=600'),
  ('DJ & Sound','الدي جي والصوت','Professional DJ with top sound systems, organized music library of Zaffa & songs, full musical coordination','دي جي احترافي مع أحدث أجهزة الصوت، مكتبة زفات وأغانٍ منظمة، وتنسيق موسيقي كامل','🎶',1800,1800,'music',true,true,4,'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=600'),
  ('Stage & Walkways','تجهيز المسرح والممرات','Full Stage setup, Red Carpet, transparent & illuminated Acrylic Walkways, luxury VIP Entrance design','Stage كامل، Red Carpet، ممرات Acrylic شفافة ومضيئة، تصميم مداخل VIP فاخرة','🏛️',2500,2500,'decor',false,true,5,'https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=600'),
  ('Event Planning & Management','تنظيم وإدارة الفعاليات','Full Event Planning, day-of supervision, bride & groom entrance coordination, and minute-by-minute schedule','Event Planning كامل، إشراف يوم الحدث، تنظيم دخول العروسين، وتنسيق جدول الحفل لحظة بلحظة','🎊',5000,5000,'general',true,true,6,'https://images.pexels.com/photos/1114425/pexels-photo-1114425.jpeg?auto=compress&cs=tinysrgb&w=600'),
  ('Hospitality & Catering','الضيافة والبوفيه','Perfume Tables, Arabic coffee service, wedding buffets, outdoor tent catering, and corporate breakfast events','طاولات عطور، صبابات قهوة عربية، بوفيه أفراح، بوفيه خيام خارجية، وإفطار للشركات والمناسبات','☕',1200,1200,'catering',false,true,7,'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=600'),
  ('Tents & Outdoor Events','الخيام والمناسبات الخارجية','Wedding, Ramadan & condolence tents with full outdoor event setup at the highest comfort standards','خيام زفاف، رمضانية، وعزاء مع تجهيز كامل للمناسبات الخارجية بأعلى معايير الراحة','🏕️',3500,3500,'general',false,true,8,'https://images.pexels.com/photos/1114425/pexels-photo-1114425.jpeg?auto=compress&cs=tinysrgb&w=600'),
  ('Photography & Videography','التصوير والفيديو','Professional photography and cinematic video production that immortalizes your most beautiful moments','تصوير احترافي وإنتاج فيديو سينمائي فاخر يخلّد أجمل لحظاتكم للأبد','📷',2200,2200,'photography',true,true,9,'https://images.pexels.com/photos/1444441/pexels-photo-1444441.jpeg?auto=compress&cs=tinysrgb&w=600')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Upsert settings (type = 'string' per check constraint)
-- ============================================================
INSERT INTO public.settings (key, value, type, category, label, label_ar, is_public)
VALUES
  ('phone_primary',    '+971527249190',                                   'string', 'contact', 'Primary Phone',   'الهاتف الرئيسي',  true),
  ('phone_secondary',  '+971506973130',                                   'string', 'contact', 'Secondary Phone', 'الهاتف الثاني',   true),
  ('whatsapp',         '+971527249190',                                   'string', 'contact', 'WhatsApp',        'واتساب',          true),
  ('email_main',       'info@altahany.com',                               'string', 'contact', 'Main Email',      'البريد الرئيسي',  true),
  ('email_support',    'support@altahany.com',                            'string', 'contact', 'Support Email',   'بريد الدعم',      true),
  ('email_dj',         'dj@altahany.com',                                 'string', 'contact', 'DJ Email',        'بريد الدي جي',    true),
  ('instagram',        'https://www.instagram.com/altahany/',             'string', 'social',  'Instagram',       'انستغرام',        true),
  ('tiktok',           'https://www.tiktok.com/@altahanyweddingservices', 'string', 'social',  'TikTok',          'تيك توك',         true),
  ('founded_year',     '2004',                                            'string', 'general', 'Founded Year',    'سنة التأسيس',     true),
  ('location_en',      'Sharjah, UAE',                                    'string', 'contact', 'Location',        'الموقع',          true),
  ('location_ar',      'الشارقة، الإمارات العربية المتحدة',              'string', 'contact', 'Location (AR)',   'الموقع بالعربي', true)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
