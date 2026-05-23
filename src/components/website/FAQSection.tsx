import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

type FAQ = {
  id: string;
  question: string;
  question_ar: string;
  answer: string;
  answer_ar: string;
  sort_order: number;
};

const FALLBACK_FAQS: FAQ[] = [
  {
    id: '1',
    question: 'What services do you offer?',
    question_ar: 'ما هي الخدمات التي تقدمونها؟',
    answer: 'We offer comprehensive wedding services including: Zaffa, Kousha & Decor, Lighting & Effects, DJ & Sound, Stage Setup, Event Planning, Hospitality & Catering, Tents, and Photography & Video.',
    answer_ar: 'نقدم خدمات أفراح شاملة تشمل: الزفة، الكوشة والديكور، الإضاءة والمؤثرات، الدي جي والصوت، تجهيز المسرح، تنظيم الفعاليات، الضيافة والبوفيه، الخيام، والتصوير والفيديو.',
    sort_order: 1,
  },
  {
    id: '2',
    question: 'How can I book your services?',
    question_ar: 'كيف يمكنني حجز خدماتكم؟',
    answer: 'You can book through our website, call us at +971 52 724 9190, contact us via WhatsApp, or visit our office in Sharjah.',
    answer_ar: 'يمكنك الحجز من خلال موقعنا الإلكتروني، أو الاتصال بنا على +971 52 724 9190، أو التواصل عبر واتساب، أو زيارة مكتبنا في الشارقة.',
    sort_order: 2,
  },
  {
    id: '3',
    question: 'Do you serve all UAE emirates?',
    question_ar: 'هل تعملون في جميع إمارات الدولة؟',
    answer: 'Yes, we serve all UAE emirates — Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, and Fujairah.',
    answer_ar: 'نعم، نقدم خدماتنا في جميع إمارات الدولة — أبوظبي، دبي، الشارقة، عجمان، أم القيوين، رأس الخيمة، والفجيرة.',
    sort_order: 3,
  },
  {
    id: '4',
    question: 'What are your package prices?',
    question_ar: 'ما هي أسعار الباقات؟',
    answer: 'Our packages start from AED 8,000 for Silver, AED 15,000 for Gold, and AED 30,000 for Platinum. We also offer custom packages tailored to your needs.',
    answer_ar: 'تبدأ باقاتنا من 8,000 درهم للباقة الفضية، و15,000 درهم للباقة الذهبية، و30,000 درهم للباقة البلاتينية. نقدم أيضاً باقات مخصصة حسب الطلب.',
    sort_order: 4,
  },
  {
    id: '5',
    question: 'How far in advance should I book?',
    question_ar: 'كم يجب الحجز قبل موعد الحفل؟',
    answer: 'We recommend booking at least 3-6 months in advance to ensure availability and best preparations. Wedding season (October-May) is very busy.',
    answer_ar: 'ننصح بالحجز قبل الموعد بـ 3-6 أشهر على الأقل لضمان التوفر وأفضل التحضيرات. موسم الأفراح (أكتوبر - مايو) يكون مزدحماً جداً.',
    sort_order: 5,
  },
  {
    id: '6',
    question: 'Are prices inclusive of VAT?',
    question_ar: 'هل تشمل الأسعار ضريبة القيمة المضافة؟',
    answer: 'All displayed prices are inclusive of 5% VAT in accordance with UAE legal requirements.',
    answer_ar: 'جميع الأسعار المعروضة شاملة لضريبة القيمة المضافة بنسبة 5% وفقاً للمتطلبات القانونية في الإمارات.',
    sort_order: 6,
  },
];

export default function FAQSection() {
  const { t } = useLang();
  const [open, setOpen] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>(FALLBACK_FAQS);

  useEffect(() => {
    supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data && data.length > 0) setFaqs(data as FAQ[]);
      });
  }, []);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-arabic mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            {t('الأسئلة الشائعة', 'Frequently Asked Questions')}
          </div>
          <h2 className="text-4xl font-bold text-gray-900 font-arabic">
            {t('هل لديك تساؤلات؟', 'Have Questions?')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">
              {t('نجيب عليها', "We've Got Answers")}
            </span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                open === faq.id ? 'border-amber-300 shadow-lg shadow-amber-50' : 'border-gray-200 hover:border-amber-200'
              }`}
            >
              <button
                onClick={() => setOpen(open === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-5 text-right gap-4"
              >
                <span className={`font-semibold font-arabic text-base transition-colors ${open === faq.id ? 'text-amber-700' : 'text-gray-800'}`}>
                  {t(faq.question_ar, faq.question)}
                </span>
                <motion.div
                  animate={{ rotate: open === faq.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${open === faq.id ? 'bg-amber-500' : 'bg-gray-100'}`}
                >
                  <ChevronDown className={`w-4 h-4 ${open === faq.id ? 'text-white' : 'text-gray-500'}`} />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === faq.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-gray-600 font-arabic leading-relaxed border-t border-gray-100 pt-4">
                      {t(faq.answer_ar, faq.answer)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
