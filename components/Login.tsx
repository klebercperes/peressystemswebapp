import React, { useState, useEffect } from 'react';
import { authService, LoginCredentials, RegisterData } from '../services/auth';
import Header from './Header';
import { GoogleIcon } from './icons';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

interface LoginProps {
  onLoginSuccess: () => void;
  onHomeClick?: () => void;
  onServicesClick?: () => void;
  onContactClick?: () => void;
}

// Extend Window interface for Google types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: any) => void }) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (element: HTMLElement, options: { sitekey: string; callback?: (token: string) => void }) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onHomeClick, onServicesClick, onContactClick }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(''); // For non-error messages like approval pending
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null);

  // Load reCAPTCHA script
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      // Only log in development mode to reduce console noise
      if (import.meta.env.DEV) {
        console.debug('reCAPTCHA site key not configured. CAPTCHA will be disabled.');
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          setRecaptchaLoaded(true);
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector(`script[src*="recaptcha"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Load Google Sign-In script (only on production domains or localhost)
  useEffect(() => {
    // Check if we're on a production domain (not a LAN IP)
    const isProductionDomain = typeof window !== 'undefined' && 
      (window.location.hostname === 'peres.systems' || 
       window.location.hostname === 'www.peres.systems' ||
       window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1');
    
    // Don't load Google OAuth on LAN IPs (Google doesn't support them)
    if (!isProductionDomain) {
      console.info('Google OAuth not available on LAN IPs. Use localhost or production domain.');
      return;
    }
    
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Client ID not configured. Google login will not work.');
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const handleGoogleCallback = async (response: any) => {
    try {
      setError('');
      setInfoMessage('');
      setLoading(true);
      
      // Send Google ID token to backend
      const authResponse = await authService.googleLogin(response.credential);
      
      // Get user data
      const user = await authService.getCurrentUser();
      if (user) {
        authService.setUser(user);
      }
      
      onLoginSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google login failed. Please try again.';
      // Check if it's an approval message - show as info instead of error
      if (errorMessage.includes('pending admin approval') || errorMessage.includes('account has been created')) {
        setInfoMessage(errorMessage);
        setError('');
      } else {
        setError(errorMessage);
        setInfoMessage('');
      }
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google login is not configured. Please contact support.');
      return;
    }

    if (window.google && window.google.accounts) {
      // FedCM-compatible approach: call prompt without callback
      // Always render button as fallback (FedCM compatible)
      window.google.accounts.id.prompt();
      
      // Ensure button is rendered as fallback
      const buttonContainer = document.getElementById('google-signin-button');
      if (buttonContainer && buttonContainer.children.length === 0) {
        window.google.accounts.id.renderButton(
          buttonContainer,
          { theme: 'outline', size: 'large', width: '100%' }
        );
      }
    } else {
      setError('Google Sign-In is not available. Please refresh the page.');
    }
  };

  const getCaptchaToken = async (): Promise<string | null> => {
    if (!RECAPTCHA_SITE_KEY || !window.grecaptcha) {
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' });
      return token;
    } catch (err) {
      console.error('CAPTCHA error:', err);
      return null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const captchaToken = await getCaptchaToken();
      const credentials: LoginCredentials = { 
        username, 
        password,
        captcha_token: captchaToken || undefined
      };
      await authService.login(credentials);
      onLoginSuccess();
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed';
      
      // Always extract a proper string message, never "[object Object]"
      if (err instanceof Error) {
        errorMessage = err.message || 'Login failed';
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        // Handle error objects - try to extract meaningful message
        const errObj = err as any;
        if (errObj.message && typeof errObj.message === 'string') {
          errorMessage = errObj.message;
        } else if (errObj.detail) {
          // Handle FastAPI error detail (can be string or array)
          if (Array.isArray(errObj.detail)) {
            errorMessage = errObj.detail.map((e: any) => 
              typeof e === 'string' ? e : `${e.loc?.join('.')}: ${e.msg}`
            ).join(', ');
          } else if (typeof errObj.detail === 'string') {
            errorMessage = errObj.detail;
          } else {
            errorMessage = JSON.stringify(errObj.detail);
          }
        } else {
          // Last resort: stringify the whole object
          try {
            errorMessage = JSON.stringify(err);
          } catch {
            errorMessage = 'Login failed. Please try again.';
          }
        }
      }
      
      // Provide more helpful error messages
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (errorMessage.includes('401') || errorMessage.includes('Incorrect')) {
        setError('Incorrect username or password. Please try again.');
      } else if (errorMessage.includes('approval') || errorMessage.includes('account has been created')) {
        // Show approval messages as info, not error
        setInfoMessage(errorMessage);
        setError('');
      } else if (errorMessage.includes('Validation error') || errorMessage.includes('422')) {
        setError(`Validation error: ${errorMessage}`);
      } else {
        setError(errorMessage || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const captchaToken = await getCaptchaToken();
      const registerData: RegisterData = {
        username,
        email,
        password,
        full_name: fullName || undefined,
        captcha_token: captchaToken || undefined,
      };
      await authService.register(registerData);
      // After registration, show success message instead of auto-login
      // User needs admin approval before they can login
      setError('');
      alert('Registration successful! Your account is pending admin approval. You will be able to login once an administrator approves your account.');
      setIsLogin(true);
      setUsername('');
      setEmail('');
      setPassword('');
      setFullName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotPasswordMessage('');
    
    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending password reset request for:', forgotPasswordEmail);
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();
      console.log('Password reset response:', data);
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send password reset email');
      }

      setForgotPasswordMessage(data.message || 'If an account with that email exists, a password reset link has been sent. Please check your inbox.');
      setForgotPasswordEmail('');
      setError('');
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send password reset email');
      setForgotPasswordMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        isAuthenticated={false} 
        onLoginClick={() => {}} // Already on login page
        onLogoutClick={() => {}}
        onHomeClick={onHomeClick}
        onServicesClick={onServicesClick}
        onContactClick={onContactClick}
      />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>
        </div>
        <form
          className="mt-8 space-y-6"
          onSubmit={isLogin ? handleLogin : handleRegister}
        >
          {infoMessage && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium">Account Created Successfully!</p>
                  <p className="text-sm mt-1">{infoMessage}</p>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
            {!isLogin && (
              <div>
                <label htmlFor="fullName" className="sr-only">
                  Full Name (Optional)
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Full Name (Optional)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setError('');
                  setInfoMessage('');
                  setForgotPasswordMessage('');
                }}
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Forgot password?
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Register'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setInfoMessage('');
                setShowForgotPassword(false);
                setForgotPasswordMessage('');
                setUsername('');
                setEmail('');
                setPassword('');
                setFullName('');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              {isLogin
                ? "Don't have an account? Register"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>

        {/* Google Sign-In - Only show on production domains (not LAN IPs) */}
        {isLogin && (() => {
          // Check if we're on a production domain (not a LAN IP)
          const isProductionDomain = typeof window !== 'undefined' && 
            (window.location.hostname === 'peres.systems' || 
             window.location.hostname === 'www.peres.systems' ||
             window.location.hostname === 'localhost' ||
             window.location.hostname === '127.0.0.1');
          
          // Only show Google OAuth on production domains or localhost
          // LAN IPs (like 10.0.1.122) are not supported by Google OAuth
          if (!isProductionDomain) {
            return null;
          }
          
          return (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="mt-4">
                {GOOGLE_CLIENT_ID ? (
                  <>
                    <div id="google-signin-button" className="flex justify-center mb-2"></div>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <GoogleIcon className="h-5 w-5 bg-white rounded-full p-0.5 mr-2" />
                      Sign in with Google
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center">Google login not configured</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Reset Password
              </h3>
              <form onSubmit={handleForgotPassword}>
                {infoMessage && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium">Account Created Successfully!</p>
                        <p className="text-sm mt-1">{infoMessage}</p>
                      </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                {forgotPasswordMessage && (
                  <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {forgotPasswordMessage}
                  </div>
                )}
                <div className="mb-4">
                  <label htmlFor="forgotPasswordEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email address
                  </label>
                  <input
                    id="forgotPasswordEmail"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                      setForgotPasswordMessage('');
                      setError('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

