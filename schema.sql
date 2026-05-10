-- Create custom types (using a DO block to avoid errors if already exists)
DO $$ BEGIN
    CREATE TYPE plan_status AS ENUM ('Running', 'Completed', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  balance NUMERIC DEFAULT 0,
  withdrawable_balance NUMERIC DEFAULT 0,
  reward_balance NUMERIC DEFAULT 0,
  referrer_id UUID REFERENCES public.profiles(id),
  referral_code TEXT UNIQUE,
  account_number TEXT,
  bank_name TEXT,
  account_name TEXT,
  last_daily_claim_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Plans table
CREATE TABLE IF NOT EXISTS public.user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  plan_name TEXT NOT NULL,
  investment_amount NUMERIC NOT NULL,
  daily_return NUMERIC NOT NULL,
  days_left INTEGER NOT NULL,
  total_received NUMERIC DEFAULT 0,
  status plan_status DEFAULT 'Running',
  icon TEXT,
  color TEXT,
  bg TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_return_claimed_at TIMESTAMPTZ
);

-- Transactions table (Deposits, Withdrawals)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT NOT NULL, -- 'Deposit', 'Withdrawal', 'ReferralBonus', 'DailyClaim', 'Investment'
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Completed', 'Failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies (using DO blocks or IF NOT EXISTS logic where available)
DO $$ BEGIN
    CREATE POLICY "Authenticated users can view any profile" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view their own plans" ON public.user_plans FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own plans" ON public.user_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own plans" ON public.user_plans FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Function: process_daily_returns
-- This function can be run daily via a cron job (e.g. pg_cron on Supabase)
CREATE OR REPLACE FUNCTION process_daily_returns()
RETURNS void AS $$
DECLARE
    plan RECORD;
    bonus NUMERIC;
    v_referrer_id UUID;
BEGIN
    -- Loop through all running plans that have days left
    FOR plan IN SELECT * FROM public.user_plans WHERE status = 'Running' AND days_left > 0 LOOP
        
        -- Update user plan stats
        UPDATE public.user_plans
        SET days_left = days_left - 1,
            total_received = total_received + daily_return,
            last_return_claimed_at = NOW(),
            status = CASE WHEN (days_left - 1) <= 0 THEN 'Completed'::plan_status ELSE 'Running'::plan_status END
        WHERE id = plan.id;
        
        -- Add return to user's withdrawable balance
        UPDATE public.profiles
        SET withdrawable_balance = withdrawable_balance + plan.daily_return
        WHERE id = plan.user_id;

        -- Process Referral Bonus (10% of daily return)
        -- Find if user has a referrer
        SELECT referrer_id INTO v_referrer_id FROM public.profiles WHERE id = plan.user_id;
        
        IF v_referrer_id IS NOT NULL THEN
            bonus := plan.daily_return * 0.10;
            
            -- Add to referrer's withdrawable balance
            UPDATE public.profiles
            SET withdrawable_balance = withdrawable_balance + bonus
            WHERE id = v_referrer_id;
            
            -- Log transaction for referral bonus
            INSERT INTO public.transactions (user_id, type, amount, status)
            VALUES (v_referrer_id, 'Referral Commission', bonus, 'Completed');
        END IF;

    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: process_user_returns
-- More robust version that checks 24h cycles, intended for frontend-triggered processing
CREATE OR REPLACE FUNCTION process_user_returns(p_user_id UUID)
RETURNS void AS $$
DECLARE
    plan RECORD;
    v_days_owed INTEGER;
    v_return_amount NUMERIC;
    v_referrer_id UUID;
    v_referral_bonus NUMERIC;
BEGIN
    -- Loop through running plans for this specific user
    FOR plan IN 
        SELECT * FROM public.user_plans 
        WHERE user_id = p_user_id 
        AND status = 'Running' 
        AND days_left > 0 
    LOOP
        -- Calculate how many 24h periods passed since last_return_claimed_at (or created_at)
        v_days_owed := floor(extract(epoch from (NOW() - COALESCE(plan.last_return_claimed_at, plan.created_at))) / 86400)::INTEGER;

        -- If at least one day has passed
        IF v_days_owed > 0 THEN
            -- Cannot claim more days than are left
            IF v_days_owed > plan.days_left THEN
                v_days_owed := plan.days_left;
            END IF;

            v_return_amount := plan.daily_return * v_days_owed;

            -- Update the plan
            UPDATE public.user_plans
            SET days_left = days_left - v_days_owed,
                total_received = total_received + v_return_amount,
                last_return_claimed_at = COALESCE(plan.last_return_claimed_at, plan.created_at) + (v_days_owed * interval '1 day'),
                status = CASE WHEN (days_left - v_days_owed) <= 0 THEN 'Completed'::plan_status ELSE 'Running'::plan_status END
            WHERE id = plan.id;

            -- Update user's withdrawable balance
            UPDATE public.profiles
            SET withdrawable_balance = withdrawable_balance + v_return_amount
            WHERE id = p_user_id;

            -- Log transaction for the user
            INSERT INTO public.transactions (user_id, type, amount, status)
            VALUES (p_user_id, 'Investment Return', v_return_amount, 'Completed');

            -- Process Referral Bonus (10% of the return)
            SELECT referrer_id INTO v_referrer_id FROM public.profiles WHERE id = p_user_id;
            IF v_referrer_id IS NOT NULL THEN
                v_referral_bonus := v_return_amount * 0.10;
                
                UPDATE public.profiles
                SET withdrawable_balance = withdrawable_balance + v_referral_bonus
                WHERE id = v_referrer_id;
                
                INSERT INTO public.transactions (user_id, type, amount, status)
                VALUES (v_referrer_id, 'Referral Commission', v_referral_bonus, 'Completed');
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: add_referral_pending
-- Adds a pending bonus to a referrer when someone signs up with their code
CREATE OR REPLACE FUNCTION add_referral_pending(p_referrer_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET reward_balance = reward_balance + 200
    WHERE id = p_referrer_id;
    
    INSERT INTO public.transactions (user_id, type, amount, status)
    VALUES (p_referrer_id, 'Referral Pending', 200, 'Pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: handle_referral_investment
-- Unlocks the pending bonus for a referrer when a referred user makes their first investment
CREATE OR REPLACE FUNCTION handle_referral_investment(p_user_id UUID, p_referrer_id UUID)
RETURNS void AS $$
DECLARE
    v_count INTEGER;
    v_reward_balance NUMERIC;
BEGIN
    -- Check if this is truly the first investment
    SELECT count(*) INTO v_count FROM public.user_plans WHERE user_id = p_user_id;
    
    IF v_count = 1 THEN
        -- Get referrer's reward balance
        SELECT reward_balance INTO v_reward_balance FROM public.profiles WHERE id = p_referrer_id;
        
        IF v_reward_balance >= 200 THEN
            -- Unlock the reward
            UPDATE public.profiles
            SET reward_balance = reward_balance - 200,
                withdrawable_balance = withdrawable_balance + 200
            WHERE id = p_referrer_id;
            
            -- Log completion transaction
            INSERT INTO public.transactions (user_id, type, amount, status)
            VALUES (p_referrer_id, 'Referral Bonus', 200, 'Completed');
            
            -- Update the oldest pending transaction for this referrer
            UPDATE public.transactions
            SET status = 'Completed'
            WHERE id = (
                SELECT id FROM public.transactions 
                WHERE user_id = p_referrer_id 
                AND type = 'Referral Pending' 
                AND status = 'Pending' 
                ORDER BY created_at ASC 
                LIMIT 1
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
