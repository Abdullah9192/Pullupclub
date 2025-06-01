import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Development mode check
const isDevelopment = import.meta.env.MODE === 'development';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface Profile {
  isProfileCompleted: boolean;
  socialMedia: string | null;
  streetAddress: string | null;
  apartment: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<{ data: { user: User | null } | null; error: Error | null }>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isFirstLogin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  signIn: async () => ({ data: null, error: null }),
  signUp: async () => {},
  signOut: async () => {},
  isFirstLogin: false,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No profile found
          setIsFirstLogin(true);
          // Create empty profile with default user role
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([{ 
              user_id: userId,
              role: 'user', // Set default role
              is_profile_completed: false
            }])
            .select()
            .single();

          if (insertError) {
            // If insert fails due to duplicate, try to fetch the existing profile
            if (insertError.code === '23505') { // Unique violation
              const { data: existingProfile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

              if (fetchError) {
                console.error('Error fetching existing profile:', fetchError);
                return;
              }

              if (existingProfile) {
                setProfile({
                  isProfileCompleted: existingProfile.is_profile_completed,
                  socialMedia: existingProfile.social_media,
                  streetAddress: existingProfile.street_address,
                  apartment: existingProfile.apartment,
                  city: existingProfile.city,
                  state: existingProfile.state,
                  zipCode: existingProfile.zip_code,
                  country: existingProfile.country,
                  role: existingProfile.role
                });
                setIsFirstLogin(!existingProfile.is_profile_completed);
                setIsAdmin(existingProfile.role === 'admin');
              }
            } else {
              console.error('Error creating profile:', insertError);
            }
            return;
          }

          // If insert was successful, set the new profile
          if (data) {
            setProfile({
              isProfileCompleted: data.is_profile_completed,
              socialMedia: data.social_media,
              streetAddress: data.street_address,
              apartment: data.apartment,
              city: data.city,
              state: data.state,
              zipCode: data.zip_code,
              country: data.country,
              role: data.role
            });
            setIsFirstLogin(!data.is_profile_completed);
            setIsAdmin(data.role === 'admin');
          }
          return;
        }
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile({
        isProfileCompleted: data.is_profile_completed,
        socialMedia: data.social_media,
        streetAddress: data.street_address,
        apartment: data.apartment,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
        country: data.country,
        role: data.role
      });
      setIsFirstLogin(!data.is_profile_completed);
      setIsAdmin(data.role === 'admin');
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Check for existing session on load
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
          });
          await fetchProfile(session.user.id);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log('Auth state changed:', event, newSession?.user?.email);
          
          if (newSession?.user) {
            setUser({
              id: newSession.user.id,
              email: newSession.user.email!,
            });
            await fetchProfile(newSession.user.id);
          } else {
            setUser(null);
            setProfile(null);
            setIsFirstLogin(false);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Transform the data to match our expected type
      return {
        data: {
          user: data.user ? {
            id: data.user.id,
            email: data.user.email || '',
          } : null
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    // Development bypass
    if (isDevelopment && email === 'dev@example.com' && password === 'dev123') {
      setUser({
        id: 'dev-user-id',
        email: 'dev@example.com'
      });
      setProfile({
        isProfileCompleted: false,
        socialMedia: null,
        streetAddress: null,
        apartment: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        role: 'user'
      });
      setIsFirstLogin(true);
      return;
    }

    // For Supabase, use signUp with email confirmation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('already registered');
      } else if (error.message.includes('invalid email')) {
        throw new Error('invalid email');
      } else {
        throw error;
      }
    }

    if (data.user) {
      // When using signUp, we also need to sign in immediately to create a session
      await signIn(email, password);
      setIsFirstLogin(true);
    }
  };

  const signOut = async () => {
    if (!isDevelopment) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setIsFirstLogin(false);
  };

  if (loading) {
    // You could return a loading component here if needed
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b9b6f]"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signUp, signOut, isFirstLogin, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};