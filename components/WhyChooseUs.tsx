import React from 'react';

const WhyChooseUs: React.FC = () => {
  const features = [
    {
      icon: '✓',
      title: 'Expert Team',
      description: 'Our certified professionals bring years of industry experience to every project.',
    },
    {
      icon: '✓',
      title: '24/7 Support',
      description: 'Round-the-clock assistance ensures your business never faces downtime alone.',
    },
    {
      icon: '✓',
      title: 'Proven Track Record',
      description: 'Trusted by hundreds of businesses for reliable IT solutions and exceptional service.',
    },
    {
      icon: '✓',
      title: 'Custom Solutions',
      description: 'Tailored services designed to meet your unique business needs and goals.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Peres Systems?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We deliver exceptional IT services that help your business thrive in the digital age.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl text-blue-600 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;

