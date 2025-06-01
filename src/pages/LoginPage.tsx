import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful, user data:', data);

      if (data?.user) {
        console.log('Fetching user profile...');
        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          throw new Error('Error fetching user profile');
        }

        console.log('User profile:', profile);

        // If user is admin, redirect to admin dashboard
        if (profile?.role === 'admin') {
          console.log('User is admin, redirecting to admin dashboard');
          navigate('/admin');
          return;
        }

        console.log('User is not admin, redirecting to home');
        // Temporarily bypass subscription check and redirect to home
        navigate('/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during sign in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#2a2a2a] rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#9b9b6f] mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

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
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#9b9b6f] text-white rounded-md font-medium hover:bg-[#8a8a5f] focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:ring-offset-2 focus:ring-offset-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/')}
                className="text-[#9b9b6f] hover:text-[#8a8a5f] font-medium transition-colors"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;