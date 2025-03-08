import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';


const supabaseUrl = 'https://vhvoiekejcawjgwqimxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodm9pZWtlamNhd2pnd3FpbXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MDI5NTksImV4cCI6MjA1NTk3ODk1OX0.29KaXxN7niBKWPcss3RulaFnw7O-Jg-u77T_noU_Qno';

const customStorage = {
  getItem: async (key: string) => {
    try {
      if (typeof window === 'undefined') {
        
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (typeof window === 'undefined') {
       
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in AsyncStorage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (typeof window === 'undefined') {
        
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from AsyncStorage:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
}); 