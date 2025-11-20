import React from 'react';

const StatsSection: React.FC = () => {
  const stats = [
    { number: '500+', label: 'Clients Served' },
    { number: '99.9%', label: 'Uptime Guarantee' },
    { number: '24/7', label: 'Support Available' },
    { number: '10+', label: 'Years Experience' },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center transform hover:scale-105 transition-transform duration-300"
            >
              <div className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 text-sm md:text-base font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

