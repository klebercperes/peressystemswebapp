import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PeresSystemsLogo } from '../components/icons';
import { authService } from '../services/auth';
import type { UserRole } from '../types';

interface VerifyEmailPageProps {
  onVerifySuccess: (role: UserRole, token: string) => void;
}

const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ onVerifySuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [setPasswordMode, setSetPasswordMode] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No verification token provided.');
      return;
    }
  }, [token]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    setError(null);

    if (setPasswordMode) {
      // Set password and verify
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: setPasswordMode ? password : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Verification failed');
      }

      // Store token
      localStorage.setItem('auth_token', data.access_token);
      
      // Get user info to determine role
      const user = await authService.getCurrentUser();
      const role: UserRole = (user.role === 'team' ? 'team' : 'customer') as UserRole;
      
      localStorage.setItem('userRole', role);
      localStorage.setItem('isAuthenticated', 'true');

      setIsVerified(true);
      
      // Call parent handler
      setTimeout(() => {
        onVerifySuccess(role, data.access_token);
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      setError(errorMessage);
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-neutral-dark p-10 rounded-xl shadow-lg">
          <PeresSystemsLogo className="mx-auto h-12 w-auto text-primary" />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-dark dark:text-white mb-4">
              Invalid Verification Link
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This verification link is invalid or has expired.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-neutral-dark p-10 rounded-xl shadow-lg">
          <PeresSystemsLogo className="mx-auto h-12 w-auto text-primary" />
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-dark dark:text-white mb-4">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting you to your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-neutral-dark p-10 rounded-xl shadow-lg">
        <div>
          <PeresSystemsLogo className="mx-auto h-12 w-auto text-primary" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-dark dark:text-white">
            Verify Your Email
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!setPasswordMode ? (
          <div className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Would you like to set a password for your account? This will allow you to log in with your email and password.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setSetPasswordMode(true)}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition"
              >
                Set Password
              </button>
              <button
                onClick={() => handleVerify()}
                disabled={isLoading}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-neutral text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-dark transition disabled:opacity-50"
              >
                Skip for Now
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerify}>
            <div className="rounded-md shadow-sm space-y-4">
              <input
                type="password"
                autoComplete="new-password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-neutral bg-white dark:bg-neutral text-neutral-dark dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50"
                placeholder="Password (min 8 characters)"
              />
              <input
                type="password"
                autoComplete="new-password"
                required
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-neutral bg-white dark:bg-neutral text-neutral-dark dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50"
                placeholder="Confirm Password"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setSetPasswordMode(false);
                  setPassword('');
                  setConfirmPassword('');
                  setError(null);
                }}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-neutral text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-dark transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify & Set Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;

