import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface Profile {
  id: string;
  full_name: string;
  balance: number;
  withdrawable_balance: number;
  reward_balance: number;
  referrer_id: string | null;
  referral_code?: string;
  last_daily_claim_at?: string;
  account_number?: string;
  bank_name?: string;
  account_name?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isMockMode: boolean;
  refreshProfile: () => Promise<void>;
  updateBalanceMock: (amount: number, type?: string) => Promise<void>;
  updateWithdrawableBalance: (amount: number, type?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isMockMode: false,
  refreshProfile: async () => { },
  updateBalanceMock: async () => { },
  updateWithdrawableBalance: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Use the flag from supabaseClient
  const isMockMode = !isSupabaseConfigured;

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMockMode) {
      // Mock Data if no supabase connection
      setProfile({
        id: 'mock-id',
        full_name: 'Test User',
        balance: 1428950.42,
        withdrawable_balance: 50000,
        reward_balance: 0,
        referrer_id: null,
        referral_code: 'WEALTH-MOCK',
      });
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [isMockMode]);

  // Realtime subscription for profile changes
  useEffect(() => {
    if (!user || isMockMode) return;

    const profileSubscription = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [user, isMockMode]);

  const refreshProfile = async () => {
    if (user && !isMockMode) {
      await fetchProfile(user.id);
    }
  };

  const updateBalance = async (amount: number, type?: string) => {
    if (isMockMode && profile) {
      console.log('Mock Mode: Updating balance locally');
      setProfile(prev => prev ? { ...prev, balance: Number(prev.balance || 0) + amount } : null);
      return;
    }

    if (user) {
      try {
        console.log(`Attempting to update balance for user ${user.id} by ${amount}`);

        // Fetch fresh profile to get the absolute latest balance
        const { data: freshProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching fresh profile:', fetchError);
          throw fetchError;
        }

        const currentBalance = Number(freshProfile?.balance || 0);
        const newBalance = currentBalance + amount;

        console.log(`Current: ${currentBalance}, New: ${newBalance}`);

        // Optimistic UI update
        setProfile(prev => prev ? { ...prev, balance: newBalance } : null);

        // Database update
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating profile balance:', updateError);
          throw updateError;
        }

        // Log transaction
        const { error: transError } = await supabase.from('transactions').insert([{
          user_id: user.id,
          type: type || (amount > 0 ? 'Deposit' : 'Withdrawal'),
          amount: Math.abs(amount),
          status: 'Completed'
        }]);

        if (transError) console.error('Error logging transaction:', transError);

        console.log('Balance update successful');
      } catch (err) {
        console.error('Final balance update catch:', err);
        await fetchProfile(user.id);
        throw err;
      }
    } else {
      console.error('Update balance called but no user is logged in');
    }
  }

  const updateWithdrawableBalance = async (amount: number, type?: string) => {
    if (isMockMode && profile) {
      setProfile(prev => prev ? { ...prev, withdrawable_balance: Number(prev.withdrawable_balance) + amount } : null);
      return;
    }

    if (user && profile) {
      const currentBalance = Number(profile.withdrawable_balance);
      const newBalance = currentBalance + amount;

      setProfile(prev => prev ? { ...prev, withdrawable_balance: newBalance } : null);

      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ withdrawable_balance: newBalance })
          .eq('id', user.id);

        if (updateError) throw updateError;

        await supabase.from('transactions').insert([{
          user_id: user.id,
          type: type || (amount > 0 ? 'Earned' : 'Withdrawal'),
          amount: Math.abs(amount),
          status: 'Completed'
        }]);
      } catch (err) {
        console.error('Error updating withdrawable balance:', err);
        await fetchProfile(user.id);
        throw err;
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isMockMode,
      refreshProfile,
      updateBalanceMock: updateBalance,
      updateWithdrawableBalance
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
