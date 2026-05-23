import React from 'react';
import SEO from '../../components/SEO';
import Navbar from '../../components/website/Navbar';
import MarqueeBar from '../../components/website/MarqueeBar';
import HeroSection from '../../components/website/HeroSection';
import AboutSection from '../../components/website/AboutSection';
import ServicesSection from '../../components/website/ServicesSection';
import PackagesSection from '../../components/website/PackagesSection';
import GallerySection from '../../components/website/GallerySection';
import TestimonialsSection from '../../components/website/TestimonialsSection';
import FAQSection from '../../components/website/FAQSection';
import BookingSection from '../../components/website/BookingSection';
import ContactSection from '../../components/website/ContactSection';
import NewsletterSection from '../../components/website/NewsletterSection';
import Footer from '../../components/website/Footer';
import FloatingWidgets from '../../components/website/FloatingWidgets';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SEO
        title="التهاني لخدمات الأفراح | Al Tahany Wedding & Events UAE"
        description="التهاني لخدمات الأفراح الفاخرة في الإمارات منذ 2004. زفة، كوشة، إضاءة، دي جي، تجهيز مسرح، تنظيم فعاليات، ضيافة وخيام. الشارقة - الإمارات."
        keywords="أفراح الإمارات, زفة فاخرة, كوشة, تنظيم أفراح, دي جي, إضاءة حفلات, wedding uae, luxury wedding sharjah, wedding planner dubai"
        url="https://altahany.com"
      />
      <MarqueeBar />
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <PackagesSection />
        <GallerySection />
        <TestimonialsSection />
        <BookingSection />
        <FAQSection />
        <ContactSection />
        <NewsletterSection />
      </main>
      <Footer />
      <FloatingWidgets />
    </div>
  );
}
