import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Calendar, X, Bot, Moon, Sun } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

export default function FloatingWidgets() {
  const { t } = useLang();
  const [aiOpen, setAiOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: t('مرحباً! أنا مساعد التهاني الذكي. كيف يمكنني مساعدتك في تنظيم حفل زفافك؟', "Hello! I'm Altahany's AI assistant. How can I help you plan your wedding?") }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setTimeout(() => {
      setAiMessages(prev => [...prev, {
        role: 'bot',
        text: t(
          'شكراً على سؤالك! فريق التهاني سيسعد بمساعدتك. للاستفسار عن الباقات والأسعار، يمكنك التواصل معنا على +971527249190',
          'Thank you for your question! The Altahany team will be happy to help. For package and pricing inquiries, contact us at +971 52 724 9190'
        )
      }]);
    }, 1000);
  };

  return (
    <>
      {/* Fixed Floating Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
        {/* Dark Mode Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setDarkMode(!darkMode)}
          className="w-11 h-11 rounded-xl bg-white shadow-xl border border-gray-200 flex items-center justify-center hover:shadow-2xl transition-shadow"
          title={t('تبديل الوضع', 'Toggle Mode')}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </motion.button>

        {/* AI Assistant */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAiOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-xl hover:shadow-blue-200 transition-shadow"
        >
          <Bot className="w-5 h-5" />
          <span className="text-sm font-arabic font-medium hidden sm:block">{t('مساعد ذكي', 'AI Assistant')}</span>
        </motion.button>

        {/* Booking */}
        <motion.a
          href="#booking"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl shadow-xl shadow-amber-200 hover:shadow-amber-300 transition-shadow"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-arabic font-medium hidden sm:block">{t('احجز الآن', 'Book Now')}</span>
        </motion.a>

        {/* WhatsApp */}
        <motion.a
          href="https://wa.me/971527249190"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-xl shadow-green-200 hover:shadow-green-300 hover:bg-green-600 transition-all"
        >
          <MessageCircle className="w-7 h-7" />
        </motion.a>
      </div>

      {/* AI Chat Modal */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm font-arabic">{t('مساعد التهاني الذكي', 'Altahany AI Assistant')}</div>
                  <div className="text-blue-100 text-xs font-arabic">{t('متاح 24/7', 'Available 24/7')}</div>
                </div>
              </div>
              <button onClick={() => setAiOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-arabic leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gray-100 text-gray-800 rounded-br-sm'
                      : 'bg-blue-500 text-white rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={t('اكتب سؤالك...', 'Type your question...')}
                className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-sm font-arabic border-none outline-none focus:bg-gray-100 transition-colors"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-colors font-arabic"
              >
                {t('إرسال', 'Send')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
