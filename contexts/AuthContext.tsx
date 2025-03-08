import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';

// Define types
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isEmailVerified: boolean;
  signOut: () => Promise<void>;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const checkEmailVerification = (user: User | null) => {
    return !!user?.email_confirmed_at;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // Check email verification
      const isVerified = checkEmailVerification(currentUser);
      setIsEmailVerified(isVerified);
      
      // Redirect to login if user exists but email is not verified
      if (currentUser && !isVerified) {
        router.replace('/login');
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        // Check email verification on auth state change
        const isVerified = checkEmailVerification(currentUser);
        setIsEmailVerified(isVerified);
        
        // Redirect to login if user exists but email is not verified
        if (currentUser && !isVerified) {
          router.replace('/login');
        }
        
        setLoading(false);
      }
    );

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    session,
    user,
    loading,
    isEmailVerified,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 