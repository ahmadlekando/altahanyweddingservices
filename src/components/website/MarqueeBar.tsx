import React, { useEffect, useState } from 'react';
import { X, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../contexts/LanguageContext';

type MarqueeMessage = {
  id: string;
  message: string;
  message_ar: string;
  link_url: string;
  link_text: string;
  link_text_ar: string;
  bg_color: string;
  text_color: string;
};

const DEFAULT_MESSAGES: MarqueeMessage[] = [
  {
    id: '1',
    message: 'Book your dream wedding today! Limited slots available for 2025',
    message_ar: 'احجز زفافك الاستثنائي اليوم! أماكن محدودة لعام 2025',
    link_url: '#booking',
    link_text: 'Book Now',
    link_text_ar: 'احجز الآن',
    bg_color: '#F59E0B',
    text_color: '#000000',
  },
  {
    id: '2',
    message: 'Special discounts up to 30% on all packages — Limited time offer!',
    message_ar: 'خصومات خاصة تصل إلى 30% على جميع الباقات — عرض لوقت محدود!',
    link_url: '#packages',
    link_text: 'View Packages',
    link_text_ar: 'عرض الباقات',
    bg_color: '#F59E0B',
    text_color: '#000000',
  },
];

export default function MarqueeBar() {
  const { t } = useLang();
  const [messages, setMessages] = useState<MarqueeMessage[]>(DEFAULT_MESSAGES);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    supabase
      .from('marquee_messages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data && data.length > 0) setMessages(data);
      });
  }, []);

  if (dismissed) return null;

  // Build the full marquee text from all messages
  const fullText = messages
    .map(m => {
      const text = t(m.message_ar, m.message);
      const link = m.link_url && (t(m.link_text_ar, m.link_text) || '');
      return link ? `${text}  •  ${link}` : text;
    })
    .join('     ✦     ');

  const bg = messages[0]?.bg_color || '#F59E0B';
  const textColor = messages[0]?.text_color || '#000000';

  return (
    <div
      className="relative overflow-hidden flex items-center"
      style={{ backgroundColor: bg, color: textColor, height: '36px' }}
    >
      {/* Left icon */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 z-10 font-bold text-xs" style={{ backgroundColor: bg }}>
        <Tag className="w-3.5 h-3.5" />
        <span className="font-arabic hidden sm:block">{t('عروض', 'Offers')}</span>
      </div>

      {/* Left fade */}
      <div
        className="absolute left-16 top-0 w-8 h-full z-10 pointer-events-none"
        style={{ background: `linear-gradient(to right, ${bg}, transparent)` }}
      />

      {/* Scrolling content */}
      <div className="overflow-hidden flex-1 relative">
        <div
          className="flex items-center whitespace-nowrap"
          style={{ animation: 'marquee 40s linear infinite' }}
        >
          <span className="font-arabic text-xs font-medium pr-8">{fullText}</span>
          <span className="font-arabic text-xs font-medium pr-8">{fullText}</span>
        </div>
      </div>

      {/* Right fade */}
      <div
        className="absolute right-8 top-0 w-8 h-full z-10 pointer-events-none"
        style={{ background: `linear-gradient(to left, ${bg}, transparent)` }}
      />

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1.5 z-10 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
        style={{ color: textColor }}
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
