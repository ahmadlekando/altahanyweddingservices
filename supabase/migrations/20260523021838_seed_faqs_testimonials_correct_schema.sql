/*
  # Seed FAQs and testimonials using actual schema columns

  FAQs: question, question_ar, answer, answer_ar, category, is_active, sort_order
  Testimonials: customer_name, customer_name_ar, customer_photo, rating, review, review_ar, 
                event_type, is_public, is_featured, sort_order
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM faqs LIMIT 1) THEN
    INSERT INTO faqs (question, question_ar, answer, answer_ar, category, is_active, sort_order) VALUES
    (
      'What services do you offer?',
      'ما هي الخدمات التي تقدمونها؟',
      'We offer comprehensive wedding services including: Zaffa, Kousha & Decor, Lighting & Effects, DJ & Sound, Stage Setup, Event Planning, Hospitality & Catering, Tents, and Photography & Video.',
      'نقدم خدمات أفراح شاملة تشمل: الزفة، الكوشة والديكور، الإضاءة والمؤثرات، الدي جي والصوت، تجهيز المسرح، تنظيم الفعاليات، الضيافة والبوفيه، الخيام، والتصوير والفيديو.',
      'general', true, 1
    ),
    (
      'How can I book your services?',
      'كيف يمكنني حجز خدماتكم؟',
      'You can book through our website, call us at +971 52 724 9190, contact us via WhatsApp, or visit our office in Sharjah.',
      'يمكنك الحجز من خلال موقعنا الإلكتروني، أو الاتصال بنا على +971 52 724 9190، أو التواصل عبر واتساب، أو زيارة مكتبنا في الشارقة.',
      'booking', true, 2
    ),
    (
      'Do you serve all UAE emirates?',
      'هل تعملون في جميع إمارات الدولة؟',
      'Yes, we serve all UAE emirates — Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, and Fujairah.',
      'نعم، نقدم خدماتنا في جميع إمارات الدولة — أبوظبي، دبي، الشارقة، عجمان، أم القيوين، رأس الخيمة، والفجيرة.',
      'general', true, 3
    ),
    (
      'What are your package prices?',
      'ما هي أسعار الباقات؟',
      'Our packages start from AED 8,000 for Silver, AED 15,000 for Gold, and AED 30,000 for Platinum. We also offer custom packages tailored to your needs.',
      'تبدأ باقاتنا من 8,000 درهم للباقة الفضية، و15,000 درهم للباقة الذهبية، و30,000 درهم للباقة البلاتينية. نقدم أيضاً باقات مخصصة حسب الطلب.',
      'pricing', true, 4
    ),
    (
      'How far in advance should I book?',
      'كم يجب الحجز قبل موعد الحفل؟',
      'We recommend booking at least 3-6 months in advance to ensure availability and best preparations. Wedding season (October-May) is very busy.',
      'ننصح بالحجز قبل الموعد بـ 3-6 أشهر على الأقل لضمان التوفر وأفضل التحضيرات. موسم الأفراح (أكتوبر - مايو) يكون مزدحماً جداً.',
      'booking', true, 5
    ),
    (
      'Are prices inclusive of VAT?',
      'هل تشمل الأسعار ضريبة القيمة المضافة؟',
      'All displayed prices are inclusive of 5% VAT in accordance with UAE legal requirements.',
      'جميع الأسعار المعروضة شاملة لضريبة القيمة المضافة بنسبة 5% وفقاً للمتطلبات القانونية في الإمارات.',
      'pricing', true, 6
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM testimonials LIMIT 1) THEN
    INSERT INTO testimonials (customer_name, customer_name_ar, customer_photo, rating, review, review_ar, event_type, is_public, is_featured, sort_order) VALUES
    (
      'Amira & Sultan Al-Mansouri',
      'أميرة وسلطان المنصوري',
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
      5,
      'Altahany made our wedding legendary! The Zaffa was absolutely amazing and the Kousha exceeded our expectations. Every detail was perfect.',
      'التهاني جعلت حفل زفافنا أسطورياً! الزفة كانت رائعة جداً والكوشة فاقت توقعاتنا. كل التفاصيل كانت مثالية ولا أستطيع أن أشكرهم بما يكفي.',
      'wedding', true, false, 1
    ),
    (
      'Noura & Abdullah Al-Zaabi',
      'نورة وعبدالله الزعابي',
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
      5,
      'Exceptional professional service! The team was very cooperative from the start. Photography and video were amazing. I highly recommend Altahany.',
      'خدمة احترافية بامتياز! الفريق كان متعاوناً جداً منذ البداية. التصوير والفيديو كانا رائعين. أنصح الجميع بالتعامل مع التهاني.',
      'wedding', true, false, 2
    ),
    (
      'Fatima & Khalid Al-Mutairi',
      'فاطمة وخالد المطيري',
      'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=200',
      5,
      'I could not have imagined my wedding being this beautiful! The organization and attention to detail was exceptional. Thank you Altahany team.',
      'لم أتخيل أن حفل زفافي سيكون بهذا الجمال! التنظيم والاهتمام بالتفاصيل كان استثنائياً. شكراً لفريق التهاني من القلب.',
      'wedding', true, true, 3
    ),
    (
      'Shaikha & Mohammed Al-Shamsi',
      'شيخة ومحمد الشامسي',
      'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200',
      5,
      'Outstanding service and professional team. The decoration was magical and the Zaffa added a wonderful spirit to the ceremony.',
      'خدمة متميزة وفريق محترف. الديكور كان خيالياً والزفة أضافت روحاً رائعة للحفل. سأوصي بهم لكل أحد.',
      'wedding', true, false, 4
    );
  END IF;
END $$;
