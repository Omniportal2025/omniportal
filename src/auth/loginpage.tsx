import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import './loginpage.css';
import { supabase } from '../supabase/supabaseClient';

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ email: '', password: '' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem('rememberedEmail');
    if (storedEmail) {
      setEmail(storedEmail);
      setRememberMe(true);
    }
  }, []);

  // Custom email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Custom validation
    const newValidationErrors = {
      email: '',
      password: ''
    };

    if (!email.trim()) {
      newValidationErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newValidationErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newValidationErrors.password = 'Password is required';
    }

    // If there are validation errors, show them and don't submit
    if (newValidationErrors.email || newValidationErrors.password) {
      setValidationErrors(newValidationErrors);
      return;
    }

    setError('');
    setSuccess('');
    setValidationErrors({ email: '', password: '' });

    try {
      console.log("Attempting login with:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        
        // Check if this is an email confirmation error
        if (error.message.includes("Email not confirmed")) {
          // Try to resend confirmation email
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
          });
          
          if (resendError) {
            console.error("Failed to resend confirmation email:", resendError);
            throw new Error(`Email not confirmed. Failed to resend confirmation: ${resendError.message}`);
          } else {
            throw new Error("Email not confirmed. A new confirmation email has been sent. Please check your inbox.");
          }
        }
        
        throw error;
      }

      if (data.user) {
        console.log("Login successful for user:", data.user.id);
        
        // Store user email in localStorage
        localStorage.setItem('userEmail', email);

        // Remember email if checkbox is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Enforce admin access only for emails in Admin table
        // Step 1: Check if user is admin
        const { data: adminData, error: adminError } = await supabase
          .from('Admin')
          .select('Email, Access')
          .eq('Email', email)
          .single();

        if (adminData && adminData.Email === email) {
          const allowedAdminEmails = [
            'guest@gmail.com',
            'angelap.hdc@gmail.com',
            'rowelhal.hdc@gmail.com',
            'hdc.ellainegarcia@gmail.com',
          ];
          const adminNames: { [email: string]: string } = {
            'rowelhal.hdc@gmail.com': 'Rowelha',
            'angelap.hdc@gmail.com': 'Angela',
            'guest@gmail.com': 'John Doe',
            'hdc.ellainegarcia@gmail.com': 'Ellaine',
          };
          if (
            (adminData.Access === true || adminData.Access === 'True' || adminData.Access === 'true') &&
            allowedAdminEmails.includes(email)
          ) {
            const adminName = adminNames[email] || 'Admin';
            localStorage.setItem('adminName', adminName);
            console.log(`User is an admin (${adminName}), redirecting to admin dashboard`);
            navigate('/components/admin/admindashboard');
            return;
          } else {
            // Access is False or email not allowed, block login and show error
            setError('You do not have access to this Dashboard.');
            return;
          }
        } else if (adminError && adminError.code !== 'PGRST116') { // PGRST116: No rows found
          // Log unexpected errors (not just 'not found')
          console.error("Error checking Admin table:", adminError);
          setError('An error occurred while verifying admin access.');
          return;
        }

        // Step 2: Check if user is a client
        const { data: clientData } = await supabase
          .from('Clients')
          .select('id')
          .eq('auth_id', data.user.id)
          .single();

        if (clientData) {
          // This is a client user
          console.log("User is a client, redirecting to client dashboard");
          navigate('/components/client/clientdashboard');
        } else {
          // Not an admin or client
          setError('You do not have access to this Dashboard.');
        }
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || 'An error occurred during login');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setIsResetting(true);

    if (!validateEmail(forgotEmail)) {
      setForgotError('Please enter a valid email address');
      setIsResetting(false);
      return;
    }

    try {
      console.log('Sending password reset email to:', forgotEmail);

      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error);
        setForgotError(error.message);
      } else {
        setForgotSuccess('Check your email for the password reset link!');
        
        // Auto-close modal after 3 seconds on success
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotEmail('');
          setForgotSuccess('');
        }, 3000);
      }
    } catch (err: any) {
      console.error("Password reset failed:", err);
      setForgotError('An unexpected error occurred. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {/* Main Content */}
      <div
        className={`flex min-h-screen bg-gradient-to-r from-[#4A90E2] to-[#9013FE] ${showForgotPassword ? 'blur-sm' : ''}`}
        style={{ transition: 'filter 0.3s ease' }}
      >
        <div className="hidden md:flex w-1/2 items-center justify-center bg-[#003DA5] relative">
          <div className="text-center text-white z-10">
            <h3 className="text-2xl font-bold">OMNI PORTAL</h3>
            <p className="text-gray-200">Your dream property is just a click away — experience real estate made easy.</p>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white relative">
          <form className="w-full max-w-md p-8 space-y-6" onSubmit={handleLogin}>
            <h2 className="text-3xl font-extrabold text-center text-[#2563EB]">Welcome Back</h2>
            <p className="text-center text-[#6B7280] text-sm">Enter your email and password to access your account</p>
            {error && (
              <div className="flex items-center justify-center p-4 mb-4 text-red-700 bg-red-100 border border-red-300 rounded-full" role="alert">
                <span className="flex-1 text-center">{error}</span>
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
            )}
            {success && (
              <div className="flex items-center justify-center p-4 mb-4 text-green-700 bg-green-100 border border-green-300 rounded-full" role="alert">
                <span className="flex-1 text-center">{success}</span>
                <CheckCircle className="h-6 w-6 ml-2" aria-hidden="true" />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#111827]">
                Email
              </label>
              <div className="flex items-center border border-gray-400 rounded-md focus-within:ring-2 focus-within:ring-[#2563EB] transition duration-200 ease-in-out">
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear validation error when user starts typing
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  className="mt-1 block w-full p-3 focus:outline-none rounded-md transition duration-200 ease-in-out" 
                  placeholder="you@example.com"
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#111827]">
                Password
              </label>
              <div className="flex items-center border border-gray-400 rounded-md focus-within:ring-2 focus-within:ring-[#2563EB] transition duration-200 ease-in-out">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear validation error when user starts typing
                    if (validationErrors.password) {
                      setValidationErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  className="mt-1 block w-full p-3 focus:outline-none rounded-md transition duration-200 ease-in-out" 
                  placeholder="••••••••"
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
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="mr-2"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="remember" className="text-[#6B7280]">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-[#2563EB] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              className="w-full py-3 mt-2 text-white bg-[#2563EB] rounded-md hover:bg-[#1D4ED8] focus:outline-none focus:ring focus:ring-[#2563EB] transition duration-200 cursor-pointer" 
            >
              Log In
            </button>
            <p className="text-sm text-center text-[#6B7280]">
              {/* Sign up link removed */}
            </p>
          </form>
          <div className="absolute bottom-4 right-8 text-gray-300">
            © 2025 ELEVATE HR
          </div>
        </div>
      </div>

      {/* Modal Overlay - Separate from main content */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md mx-4 relative">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotEmail('');
                setForgotError('');
                setForgotSuccess('');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-800">Reset Password</h2>
            <form onSubmit={handleForgotPassword}>
              <label htmlFor="forgotEmail" className="block text-sm font-medium text-[#111827] mb-2">
                Enter your email to reset password
              </label>
              <input
                type="email"
                id="forgotEmail"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition duration-200 ease-in-out"
                placeholder="you@example.com"
                disabled={isResetting}
              />
              {forgotError && <p className="text-red-500 text-sm mt-2">{forgotError}</p>}
              {forgotSuccess && <p className="text-green-500 text-sm mt-2">{forgotSuccess}</p>}

              <button
                type="submit"
                disabled={isResetting}
                className={`w-full py-3 mt-6 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 transition duration-200 cursor-pointer ${
                  isResetting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                }`}
              >
                {isResetting ? 'Sending Reset Link...' : 'Send Reset Link'}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                You'll receive an email with instructions to reset your password.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;