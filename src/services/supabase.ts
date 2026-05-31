import { createClient } from '@supabase/supabase-js';
import type { User, CoffeeDonation } from '../types';
import { db } from './db';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Auth Adapter Wrapper to allow seamless fallback to Mock LocalStorage engine
export const authService = {
  isRealSupabase(): boolean {
    return isConfigured();
  },

  async getSession(): Promise<User | null> {
    if (!isConfigured() || !supabase) {
      const localUser = db.getUser();
      return localUser.isLoggedIn ? localUser : null;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return null;

      const { user } = session;
      
      // Fetch details from profile table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'User',
        dogName: profile?.dog_name || user.user_metadata?.dogName,
        dogBreed: profile?.dog_breed || user.user_metadata?.dogBreed,
        dogSize: profile?.dog_size || user.user_metadata?.dogSize,
        dogTemperament: profile?.dog_temperament || user.user_metadata?.dogTemperament,
        isLoggedIn: true,
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || 'user')}`,
        email: user.email,
      };
    } catch (err) {
      console.error('Supabase getSession error, falling back:', err);
      const localUser = db.getUser();
      return localUser.isLoggedIn ? localUser : null;
    }
  },

  async signUp(email: string, password: string, metadata: {
    username: string;
    dogName?: string;
    dogBreed?: string;
    dogSize?: 'small' | 'medium' | 'large';
    dogTemperament?: 'friendly' | 'neutral' | 'reactive';
  }): Promise<{ user: User | null; error: string | null }> {
    if (!isConfigured() || !supabase) {
      // Mock LocalStorage SignUp
      const user: User = {
        username: metadata.username,
        dogName: metadata.dogName,
        dogBreed: metadata.dogBreed,
        dogSize: metadata.dogSize,
        dogTemperament: metadata.dogTemperament,
        isLoggedIn: true,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(metadata.dogName || metadata.username)}`,
        email: email,
      };
      
      // Register locally in localStorage (db uses it)
      db.setUser(user);
      // We also store registered accounts in a mock accounts database inside localStorage
      const mockAccounts = JSON.parse(localStorage.getItem('psiatrasa_mock_accounts') || '[]');
      const exists = mockAccounts.some((a: any) => a.email === email);
      if (exists) {
        return { user: null, error: 'Konto o tym adresie e-mail już istnieje.' };
      }
      mockAccounts.push({ email, password, user });
      localStorage.setItem('psiatrasa_mock_accounts', JSON.stringify(mockAccounts));

      return { user, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: metadata.username,
            dogName: metadata.dogName,
            dogBreed: metadata.dogBreed,
            dogSize: metadata.dogSize,
            dogTemperament: metadata.dogTemperament,
          }
        }
      });

      if (error) throw error;
      if (!data.user) return { user: null, error: 'Coś poszło nie tak.' };

      const userProfile: User = {
        username: metadata.username,
        dogName: metadata.dogName,
        dogBreed: metadata.dogBreed,
        dogSize: metadata.dogSize,
        dogTemperament: metadata.dogTemperament,
        isLoggedIn: true,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(metadata.dogName || metadata.username)}`,
        email: email,
      };

      return { user: userProfile, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Błąd rejestracji.' };
    }
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    if (!isConfigured() || !supabase) {
      // Mock LocalStorage SignIn
      const mockAccounts = JSON.parse(localStorage.getItem('psiatrasa_mock_accounts') || '[]');
      const account = mockAccounts.find((a: any) => a.email === email);
      if (!account) {
        return { user: null, error: 'Nieprawidłowy e-mail lub hasło.' };
      }
      if (account.password !== password) {
        return { user: null, error: 'Nieprawidłowe hasło.' };
      }
      
      const loggedUser = { ...account.user, isLoggedIn: true };
      db.setUser(loggedUser);
      return { user: loggedUser, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) return { user: null, error: 'Błąd logowania' };

      // Load profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const userProfile: User = {
        username: profile?.username || data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User',
        dogName: profile?.dog_name || data.user.user_metadata?.dogName,
        dogBreed: profile?.dog_breed || data.user.user_metadata?.dogBreed,
        dogSize: profile?.dog_size || data.user.user_metadata?.dogSize,
        dogTemperament: profile?.dog_temperament || data.user.user_metadata?.dogTemperament,
        isLoggedIn: true,
        avatarUrl: profile?.avatar_url || data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.user.email || 'user')}`,
        email: data.user.email,
      };

      db.setUser(userProfile);
      return { user: userProfile, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Nieprawidłowe dane logowania.' };
    }
  },

  async signInWithGoogle(): Promise<{ error: string | null }> {
    if (!isConfigured() || !supabase) {
      return { error: null }; // App.tsx handles mockup popup for Google login in mock mode
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        }
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Błąd logowania Google.' };
    }
  },

  async updateProfile(user: User): Promise<{ user: User | null; error: string | null }> {
    if (!isConfigured() || !supabase) {
      db.setUser(user);
      
      // Update in mock account db if present
      const mockAccounts = JSON.parse(localStorage.getItem('psiatrasa_mock_accounts') || '[]');
      const index = mockAccounts.findIndex((a: any) => a.email === user.email);
      if (index !== -1) {
        mockAccounts[index].user = user;
        localStorage.setItem('psiatrasa_mock_accounts', JSON.stringify(mockAccounts));
      }
      return { user, error: null };
    }

    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (!supabaseUser) throw new Error('Brak zalogowanego użytkownika');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: supabaseUser.id,
          username: user.username,
          dog_name: user.dogName,
          dog_breed: user.dogBreed,
          dog_size: user.dogSize,
          dog_temperament: user.dogTemperament,
          avatar_url: user.avatarUrl,
          email: user.email,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      db.setUser(user);
      return { user, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Błąd zapisu profilu.' };
    }
  },

  async signOut(): Promise<void> {
    const defaultUser: User = { username: 'Gość', isLoggedIn: false };
    db.setUser(defaultUser);

    if (isConfigured() && supabase) {
      await supabase.auth.signOut();
    }
  }
};

// Donation API Wrapper to sync donations with Supabase when available
export const donationService = {
  async getDonations(): Promise<CoffeeDonation[]> {
    if (!isConfigured() || !supabase) {
      return db.getDonations();
    }

    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        donorName: d.donor_name,
        coffees: d.coffees,
        message: d.message,
        createdAt: d.created_at,
      }));
    } catch (err) {
      console.error('Supabase load donations error, falling back:', err);
      return db.getDonations();
    }
  },

  async addDonation(donation: Omit<CoffeeDonation, 'id' | 'createdAt'>): Promise<CoffeeDonation> {
    const newDonationLocal = db.addDonation(donation);

    if (!isConfigured() || !supabase) {
      return newDonationLocal;
    }

    try {
      const { data, error } = await supabase
        .from('donations')
        .insert({
          donor_name: donation.donorName,
          coffees: donation.coffees,
          message: donation.message,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        donorName: data.donor_name,
        coffees: data.coffees,
        message: data.message,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error('Supabase save donation error, saved locally:', err);
      return newDonationLocal;
    }
  },

  // Subscribe to real-time donation notifications if configured
  subscribeToNewDonations(onNewDonation: (donation: CoffeeDonation) => void): (() => void) | null {
    if (!isConfigured() || !supabase) return null;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations',
        },
        (payload) => {
          const newD = payload.new;
          onNewDonation({
            id: newD.id,
            donorName: newD.donor_name,
            coffees: newD.coffees,
            message: newD.message,
            createdAt: newD.created_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

function isConfigured(): boolean {
  return isSupabaseConfigured;
}
