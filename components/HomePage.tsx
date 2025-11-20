import React from 'react';
import Header from './Header';
import HeroSection from './HeroSection';
import StatsSection from './StatsSection';
import ServicesGrid from './ServicesGrid';
import WhyChooseUs from './WhyChooseUs';
import CTASection from './CTASection';
import Footer from './Footer';
import BackToTop from './BackToTop';

interface HomePageProps {
  onLoginClick: () => void;
  onServicesClick?: (serviceId?: string) => void;
  onContactClick?: () => void;
  isAuthenticated?: boolean;
  onDashboardClick?: () => void;
  onLogoutClick?: () => void;
  showHeader?: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ onLoginClick, onServicesClick, onContactClick, isAuthenticated = false, onDashboardClick, onLogoutClick, showHeader = true }) => {
  const handleGetStarted = () => {
    // Scroll to CTA section or trigger login
    const ctaSection = document.getElementById('cta');
    if (ctaSection) {
      ctaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onLoginClick();
    }
  };

  const handleServiceClick = (serviceId: string) => {
    if (onServicesClick) {
      onServicesClick(serviceId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && (
        <Header 
          isAuthenticated={isAuthenticated} 
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick || (() => {})}
          onHomeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onServicesClick={() => onServicesClick && onServicesClick()}
          onContactClick={onContactClick}
          onDashboardClick={onDashboardClick}
        />
      )}
      <main className="flex-grow">
        <HeroSection onGetStartedClick={handleGetStarted} />
        <StatsSection />
        <ServicesGrid onServiceClick={handleServiceClick} />
        <WhyChooseUs />
        <div id="cta">
          <CTASection onGetStartedClick={handleGetStarted} />
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default HomePage;

