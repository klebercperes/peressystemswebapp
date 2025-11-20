import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import { getBusinessSettings, BusinessSettings } from '../services/businessSettings';

interface ContactPageProps {
  onLoginClick: () => void;
  onServicesClick: () => void;
  onHomeClick?: () => void;
  isAuthenticated?: boolean;
  onDashboardClick?: () => void;
  onLogoutClick?: () => void;
  showHeader?: boolean;
}

const ContactPage: React.FC<ContactPageProps> = ({ onLoginClick, onServicesClick, onHomeClick, isAuthenticated = false, onDashboardClick, onLogoutClick, showHeader = true }) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    getBusinessSettings().then(setSettings);
  }, []);

  // Use business settings or fallback to defaults
  // Priority: phone_number (1300) > mobile_number
  const email = settings?.email_contact || 'info@peres.systems';
  const phone = settings?.phone_number || settings?.mobile_number || '+61 493 929 511';
  // For placeholder, use mobile_number specifically
  const mobilePlaceholder = settings?.mobile_number || '+61 493 929 511';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.0.1.122:8000';
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to send message' }));
        throw new Error(error.detail || 'Failed to send message');
      }

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {showHeader && (
        <Header 
          isAuthenticated={isAuthenticated} 
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick || (() => {})}
          onHomeClick={onHomeClick}
          onServicesClick={onServicesClick}
          onContactClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onDashboardClick={onDashboardClick}
        />
      )}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-blue-900 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Get In Touch
            </h1>
            <p className="text-xl text-blue-100 text-center max-w-3xl mx-auto">
              Have a question or need assistance? We're here to help. Send us a message and we'll get back to you as soon as possible.
            </p>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8">
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    <p className="font-semibold">Message sent successfully!</p>
                    <p>We'll get back to you as soon as possible.</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <p className="font-semibold">Error sending message</p>
                    <p>{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder={mobilePlaceholder}
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="services">Services Information</option>
                      <option value="support">Technical Support</option>
                      <option value="sales">Sales & Pricing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-900 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>

                {/* Contact Information */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Other Ways to Reach Us</h3>
                  <div className="space-y-3 text-gray-600">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${email}`} className="hover:text-blue-900">
                        {email}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-blue-900">
                        {phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default ContactPage;

