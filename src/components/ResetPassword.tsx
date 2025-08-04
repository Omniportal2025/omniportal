// components/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../supabase/supabaseClient';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({ password: '', confirmPassword: '' });
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the auth callback when user clicks reset link
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setError('Invalid or expired reset link. Please request a new password reset.');
        return;
      }

      if (!data.session) {
        setError('No active session found. Please request a new reset link.');
      }
    };

    handleAuthCallback();
  }, []);

  const validatePasswords = () => {
    const newValidationErrors = {
      password: '',
      confirmPassword: ''
    };

    if (!password.trim()) {
      newValidationErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newValidationErrors.password = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword.trim()) {
      newValidationErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newValidationErrors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(newValidationErrors);
    return !newValidationErrors.password && !newValidationErrors.confirmPassword;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-[#4A90E2] to-[#9013FE]">
      <div className="hidden md:flex w-1/2 items-center justify-center bg-[#003DA5] relative">
        <div className="text-center text-white z-10">
          <h3 className="text-2xl font-bold">OMNI PORTAL</h3>
          <p className="text-gray-200">Reset your password to continue accessing your account.</p>
        </div>
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white relative">
        <form className="w-full max-w-md p-8 space-y-6" onSubmit={handleResetPassword}>
          <h2 className="text-3xl font-extrabold text-center text-[#2563EB]">Set New Password</h2>
          <p className="text-center text-[#6B7280] text-sm">Enter your new password below</p>
          
          {error && (
            <div className="flex items-center justify-center p-4 mb-4 text-red-700 bg-red-100 border border-red-300 rounded-full" role="alert">
              <span className="flex-1 text-center">{error}</span>
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
          
          {message && (
            <div className="flex items-center justify-center p-4 mb-4 text-green-700 bg-green-100 border border-green-300 rounded-full" role="alert">
              <span className="flex-1 text-center">{message}</span>
              <CheckCircle className="h-6 w-6 ml-2" aria-hidden="true" />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#111827]">
              New Password
            </label>
            <div className="flex items-center border border-gray-400 rounded-md focus-within:ring-2 focus-within:ring-[#2563EB] transition duration-200 ease-in-out">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                className="mt-1 block w-full p-3 focus:outline-none rounded-md transition duration-200 ease-in-out"
                placeholder="Enter new password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="mr-3 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-[#6B7280]" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5 text-[#6B7280]" aria-hidden="true" />
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#111827]">
              Confirm New Password
            </label>
            <div className="flex items-center border border-gray-400 rounded-md focus-within:ring-2 focus-within:ring-[#2563EB] transition duration-200 ease-in-out">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                className="mt-1 block w-full p-3 focus:outline-none rounded-md transition duration-200 ease-in-out"
                placeholder="Confirm new password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="mr-3 cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-[#6B7280]" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5 text-[#6B7280]" aria-hidden="true" />
                )}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-2 text-white rounded-md focus:outline-none focus:ring focus:ring-[#2563EB] transition duration-200 cursor-pointer ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
            }`}
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#2563EB] hover:underline text-sm"
            >
              ← Back to Login
            </button>
          </div>
        </form>
        <div className="absolute bottom-4 right-8 text-gray-300">
          © 2025 ELEVATE HR
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;