import React, { useState } from 'react';
import { PeresSystemsLogo } from '../components/icons';
import { authService } from '../services/auth';
import type { UserRole } from '../types';

interface SignupPageProps {
  onSignUp: (role: UserRole, token: string) => void;
  onNavigateToLogin: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignUp, onNavigateToLogin }) => {
  const [signupMethod, setSignupMethod] = useState<'password' | 'email'>('password');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (signupMethod === 'email') {
      // Email-only signup
      if (!formData.email) {
        setError('Email is required.');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/signup-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            full_name: formData.fullName || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to send verification email');
        }

        setSuccessMessage('Verification email sent! Please check your inbox and click the link to verify your email address.');
        setFormData({ username: '', email: '', password: '', confirmPassword: '', fullName: '' });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send verification email. Please try again.';
        setError(errorMessage);
        console.error('Email signup error:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Password signup
      // Validation
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!formData.email || !formData.username) {
        setError('Email and username are required.');
        return;
      }

      setIsLoading(true);
      try {
        // Register new user
        const user = await authService.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName || undefined,
        });

        // Auto-login after registration
        const loginResponse = await authService.login({
          username: formData.email, // Can use email or username
          password: formData.password,
        });

        // Determine role from user object
        const role: UserRole = (user.role === 'team' ? 'team' : 'customer') as UserRole;
        
        // Store role
        localStorage.setItem('userRole', role);
        localStorage.setItem('isAuthenticated', 'true');

        // Call parent handler
        onSignUp(role, loginResponse.access_token);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
        setError(errorMessage);
        console.error('Signup error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-neutral-dark p-10 rounded-xl shadow-lg">
        <div>
          <PeresSystemsLogo className="mx-auto h-12 w-auto text-primary" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-dark dark:text-white">
            Create a new account
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {/* Signup Method Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => {
              setSignupMethod('password');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              signupMethod === 'password'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-neutral text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-dark'
            }`}
          >
            Sign Up with Password
          </button>
          <button
            type="button"
            onClick={() => {
              setSignupMethod('email');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              signupMethod === 'email'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-neutral text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-dark'
            }`}
          >
            Sign Up with Email Only
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {signupMethod === 'password' && (
              <input
                name="username"
                type="text"
                required
                disabled={isLoading}
                value={formData.username}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-neutral bg-white dark:bg-neutral text-neutral-dark dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50"
                placeholder="Username"
              />
            )}
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isLoading}
              value={formData.email}
              onChange={handleChange}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-neutral bg-white dark:bg-neutral text-neutral-dark dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50"
              placeholder="Email address"
            />
            <input
              name="fullName"
              type="text"
              disabled={isLoading}
              value={formData.fullName}
              onChange={handleChange}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-neutral bg-white dark:bg-neutral text-neutral-dark dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50"
              placeholder="Full Name (optional)"
            />
            {signupMethod === 'password' && (
              <>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-neutral bg-white dark:bg-neutral text-neutral-dark dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50"
                  placeholder="Password (min 8 characters)"
                />
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-neutral bg-white dark:bg-neutral text-neutral-dark dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50"
                  placeholder="Confirm Password"
                />
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? (signupMethod === 'email' ? 'Sending verification email...' : 'Creating account...')
                : (signupMethod === 'email' ? 'Send Verification Email' : 'Sign Up')
              }
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToLogin();
            }}
            className="font-medium text-primary hover:text-primary-dark"
          >
            Already have an account? Sign In
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
