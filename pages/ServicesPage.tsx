import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import type { Service } from '../types';
import { getServices } from '../services/services';
import { getIconComponent } from '../components/icons';

interface ServicesPageProps {
  onLoginClick: () => void;
  onContactClick: () => void;
  onHomeClick?: () => void;
  serviceId?: string;
  isAuthenticated?: boolean;
  onDashboardClick?: () => void;
  onLogoutClick?: () => void;
  showHeader?: boolean;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ onLoginClick, onContactClick, onHomeClick, serviceId, isAuthenticated = false, onDashboardClick, onLogoutClick, showHeader = true }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const fetchedServices = await getServices();
        setServices(fetchedServices);
        setError(null);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    // Scroll to specific service if serviceId is provided
    if (serviceId && services.length > 0) {
      setTimeout(() => {
        const serviceElement = document.getElementById(`service-${serviceId}`);
        if (serviceElement) {
          serviceElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [serviceId, services]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {showHeader && (
        <Header 
          isAuthenticated={isAuthenticated} 
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick || (() => {})}
          onHomeClick={onHomeClick}
          onServicesClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onContactClick={onContactClick}
          onDashboardClick={onDashboardClick}
        />
      )}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-blue-900 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Our Services
            </h1>
            <p className="text-xl text-blue-100 text-center max-w-3xl mx-auto">
              Comprehensive IT solutions designed to help your business thrive in the digital age.
            </p>
          </div>
        </section>

        {/* Services List */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading services...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No services available at the moment.</p>
              </div>
            ) : (
              <div className="space-y-24">
                {services.map((service, index) => {
                  const Icon = getIconComponent(service.icon_name);
                  const isEven = index % 2 === 0;
                  
                  return (
                    <div
                      key={service.id}
                      id={`service-${service.id}`}
                      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-center scroll-mt-20`}
                    >
                      <div className={`flex-1 ${isEven ? 'lg:pr-8' : 'lg:pl-8'}`}>
                        <img
                          src={service.image_url}
                          alt={service.title}
                          className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-4">
                          <div className="p-3 bg-blue-600 rounded-full mr-4">
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                            {service.title}
                          </h2>
                        </div>
                        <p className="text-lg text-gray-600 mb-4">
                          {service.description}
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default ServicesPage;

