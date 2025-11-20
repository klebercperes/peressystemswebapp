
import React from 'react';

interface HeroSectionProps {
  onGetStartedClick?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStartedClick }) => {
  const scrollToServices = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative bg-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-30"></div>
         <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80&blur=5&grayscale')" }}>
        </div>
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4 animate-fade-in">
          Reliable IT Solutions for Modern Businesses
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-200 mb-8 animate-fade-in-delay">
          Peres Systems provides cutting-edge technology services to streamline your operations, enhance security, and drive growth.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-2">
          <a
            href="#services"
            onClick={scrollToServices}
            className="inline-block bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-500 transition duration-300 transform hover:scale-105 shadow-lg"
          >
            Explore Our Services
          </a>
          {onGetStartedClick && (
            <button
              onClick={onGetStartedClick}
              className="inline-block bg-white text-blue-900 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 shadow-lg"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        .animate-fade-in-delay {
          animation: fadeIn 1s ease-out 0.2s both;
        }
        .animate-fade-in-delay-2 {
          animation: fadeIn 1.2s ease-out 0.4s both;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
