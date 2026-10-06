'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/database/supabaseClient';
import { DbRepository } from '@/lib/database/repository';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (displayName: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth session
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const dbUser = await DbRepository.upsertUser({
              telegram_user_id: Math.abs(hashCode(session.user.id)),
              username: session.user.email?.split('@')[0],
              display_name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
            });
            setUser(dbUser);
          }
        } else {
          // Local storage session fallback for demo mode
          const savedUser = localStorage.getItem('remindly_current_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signup = async (displayName: string, email: string, pass: string) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: { display_name: displayName },
          },
        });

        if (error) return { success: false, error: error.message };

        if (data.user) {
          const dbUser = await DbRepository.upsertUser({
            telegram_user_id: Math.abs(hashCode(data.user.id)),
            username: email.split('@')[0],
            display_name: displayName,
          });
          setUser(dbUser);
          return { success: true };
        }
      }

      // Local / Demo mode registration fallback
      const fakeTelegramId = Math.floor(100000000 + Math.random() * 900000000);
      const dbUser = await DbRepository.upsertUser({
        telegram_user_id: fakeTelegramId,
        username: email.split('@')[0],
        display_name: displayName,
      });

      localStorage.setItem('remindly_current_user', JSON.stringify(dbUser));
      setUser(dbUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed' };
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (error) return { success: false, error: error.message };

        if (data.user) {
          const dbUser = await DbRepository.upsertUser({
            telegram_user_id: Math.abs(hashCode(data.user.id)),
            username: email.split('@')[0],
            display_name: data.user.user_metadata?.display_name || email.split('@')[0],
          });
          setUser(dbUser);
          return { success: true };
        }
      }

      // Local / Demo mode login fallback
      const existingUsers = await DbRepository.getUsers();
      let dbUser = existingUsers.find((u) => u.telegram_username === email.split('@')[0]);

      if (!dbUser) {
        dbUser = await DbRepository.upsertUser({
          telegram_user_id: Math.floor(100000000 + Math.random() * 900000000),
          username: email.split('@')[0],
          display_name: email.split('@')[0],
        });
      }

      localStorage.setItem('remindly_current_user', JSON.stringify(dbUser));
      setUser(dbUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('remindly_current_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
