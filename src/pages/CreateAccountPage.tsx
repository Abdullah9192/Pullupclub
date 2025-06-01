import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2 } from 'lucide-react';

const CreateAccountPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check for verification in URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=signup')) {
      setSuccess('Email verified successfully! Please sign in to continue.');
    }
  }, []);

  // Password validation
  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user',
            is_active: true
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('This email is already registered. Please try logging in instead.');
        }
        throw signUpError;
      }

      if (data?.user) {
        // Show success message and clear form
        setSuccess('Confirmation link has been sent to your email. Please verify your email and then sign in.');
        setEmail('');
        setPassword('');
        setIsLoading(false);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('already registered')) {
        setError(err.message);
      } else {
        setError('An error occurred during sign up');
      }
      setIsLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center space-x-2 text-sm">
      <CheckCircle2 
        size={16} 
        className={met ? 'text-green-500' : 'text-gray-500'} 
      />
      <span className={met ? 'text-green-500' : 'text-gray-500'}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#2a2a2a] rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#9b9b6f] mb-2">Create Account</h1>
            <p className="text-gray-400">Join our community</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-800 rounded text-green-200 text-sm">
              {success}
              {success.includes('verified') && (
                <button
                  onClick={() => navigate('/login')}
                  className="mt-2 w-full py-2 px-4 bg-[#9b9b6f] text-white rounded-md font-medium hover:bg-[#8a8a5f] focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:ring-offset-2 focus:ring-offset-[#2a2a2a] transition-colors"
                >
                  Go to Sign In
                </button>
              )}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:border-transparent"
                  placeholder="Create a password"
                />
              </div>

              <div className="space-y-2">
                <PasswordRequirement met={hasMinLength} text="At least 6 characters" />
                <PasswordRequirement met={hasUpperCase} text="At least one uppercase letter" />
                <PasswordRequirement met={hasLowerCase} text="At least one lowercase letter" />
                <PasswordRequirement met={hasNumber} text="At least one number" />
              </div>

              <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full py-3 px-4 bg-[#9b9b6f] text-white rounded-md font-medium hover:bg-[#8a8a5f] focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:ring-offset-2 focus:ring-offset-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#9b9b6f] hover:text-[#8a8a5f] font-medium transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAccountPage;