import React, { useState, useEffect } from 'react';
import ServiceCard from './ServiceCard';
import type { Service } from '../types';
import { getServices } from '../services/services';

interface ServicesGridProps {
  onServiceClick?: (serviceId: string) => void;
}

const ServicesGrid: React.FC<ServicesGridProps> = ({ onServiceClick }) => {
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

  if (loading) {
    return (
      <section id="services" className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Loading services...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="services" className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return (
      <section id="services" className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">No services available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Services</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            We offer a comprehensive suite of IT services designed to meet the needs of businesses of all sizes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ServiceCard service={service} onServiceClick={onServiceClick} />
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out both;
        }
      `}</style>
    </section>
  );
};

export default ServicesGrid;
