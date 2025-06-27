import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { CoinService } from '@/utils/coinService';

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

  const checkEmailVerification = useCallback((user: User | null) => {
    return !!user?.email_confirmed_at;
  }, []);

  useEffect(() => {
    // Define handler here to avoid duplication
    const handleAuthChange = (_event: string, session: Session | null) => {
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
      
      // Migrate coins from AsyncStorage to database when user logs in
      if (currentUser && isVerified) {
        CoinService.migrateCoinsToDatabase(currentUser.id).catch(error => {
          console.error('Error migrating coins to database:', error);
        });
      }
      
      setLoading(false);
    };

    // Get initial session - use Promise.then for better performance than async/await here
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange('INITIAL', session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [checkEmailVerification]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize context value to prevent unnecessary rerenders
  const value = useMemo(() => ({
    session,
    user,
    loading,
    isEmailVerified,
    signOut,
  }), [session, user, loading, isEmailVerified, signOut]);

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