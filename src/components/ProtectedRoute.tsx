import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getActiveSubscription } from '../lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // First check if user is admin
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        const isUserAdmin = profile?.role === 'admin';
        setIsAdmin(isUserAdmin);

        // Temporarily bypass subscription check for all users
        setHasSubscription(true);
        setIsLoading(false);
        return;

        // Commented out subscription check for now
        /*
        // If user is admin, skip subscription check
        if (isUserAdmin) {
          setHasSubscription(true);
          setIsLoading(false);
          return;
        }

        // For non-admin users, check subscription
        const subscription = await getActiveSubscription();
        setHasSubscription(subscription?.subscription_status === 'active');
        */
      } catch (error) {
        console.error('Error checking access:', error);
        setHasSubscription(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9b9b6f] mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Only check subscription for non-admin users
  if (!isAdmin && !hasSubscription) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 