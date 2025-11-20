
import React, { useState, useEffect } from 'react';
import { getBusinessSettings, BusinessSettings } from '../services/businessSettings';

const Footer: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    getBusinessSettings().then(setSettings);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Use business settings or fallback to defaults
  // Priority: phone_number (1300) > mobile_number
  const businessName = settings?.business_name || settings?.trading_name || 'Peres Systems';
  const email = settings?.email_contact || 'info@peres.systems';
  const phone = settings?.phone_number || settings?.mobile_number || '+61 493 929 511';
  const linkedinUrl = settings?.linkedin_url || 'https://linkedin.com';
  const facebookUrl = settings?.facebook_url || 'https://facebook.com';
  const instagramUrl = settings?.instagram_url;
  const twitterUrl = settings?.twitter_url;

  return (
    <footer className="bg-blue-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">{businessName}</h3>
            <p className="text-blue-200 text-sm mb-4">
              Smart IT Solutions for Modern Businesses
            </p>
            <div className="flex space-x-4">
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-200 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-200 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-200 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-200 hover:text-white transition-colors"
                  aria-label="X (Twitter)"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => scrollToSection('services')}
                  className="text-blue-200 hover:text-white transition-colors cursor-pointer"
                >
                  Services
                </button>
              </li>
              <li>
                <a
                  href={`mailto:${email}`}
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <button
                  onClick={scrollToTop}
                  className="text-blue-200 hover:text-white transition-colors cursor-pointer"
                >
                  Back to Top
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="hover:text-white transition-colors"
                >
                  {email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${phone.replace(/[\s\-\(\)]/g, '')}`}
                  className="hover:text-white transition-colors"
                >
                  {phone}
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-bold mb-4">Stay Updated</h3>
            <p className="text-blue-200 text-sm mb-4">
              Subscribe to our newsletter for IT tips and updates.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Newsletter functionality can be added later
                alert('Newsletter signup coming soon!');
              }}
              className="flex flex-col space-y-2"
            >
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
              <button
                type="submit"
                className="bg-yellow-400 text-gray-900 font-semibold py-2 px-4 rounded text-sm hover:bg-yellow-500 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-blue-800 pt-8 text-center text-sm text-blue-200">
          <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

