import { supabase } from './supabaseClient';

export const buyPlan = async (profile: any, plan: any) => {
  if (!profile) return { error: 'No profile' };

  const amount = typeof plan.investment === 'string' 
    ? Number(plan.investment.replace(/[^0-9.-]+/g, "")) 
    : plan.investment;
    
  const dailyReturnNum = typeof plan.dailyReturn === 'string'
    ? Number(plan.dailyReturn.replace(/[^0-9.-]+/g, ""))
    : plan.dailyReturn;
    
  const durationNum = typeof plan.duration === 'string'
    ? Number(plan.duration.replace(/[^0-9.-]+/g, ""))
    : plan.duration;

  const iconMatch = plan.name.match(/^(\S+)\s+(.+)$/u);
  const icon = iconMatch ? iconMatch[1] : '📦';
  const planName = iconMatch ? iconMatch[2] : plan.name;

  const colors = ['#d97706', '#64748b', '#c39c5b', '#059669', '#2563eb', '#7c3aed', '#db2777'];
  const bgs = ['#fef3c7', '#f1f5f9', '#fdfaf3', '#d1fae5', '#dbeafe', '#ede9fe', '#fce7f3'];
  const randomIdx = Math.floor(Math.random() * colors.length);

  const { data, error: insertError } = await supabase.from('user_plans').insert([{
    user_id: profile.id,
    plan_name: planName,
    investment_amount: amount,
    daily_return: dailyReturnNum,
    days_left: durationNum,
    icon: icon,
    color: colors[randomIdx],
    bg: bgs[randomIdx],
    status: 'Running'
  }]).select().single();

  if (insertError) {
    console.error('Error inserting plan:', insertError);
    return { error: insertError };
  }

  // Handle referral bonus activation on first investment
  if (profile.referrer_id) {
    await supabase.rpc('handle_referral_investment', {
      p_user_id: profile.id,
      p_referrer_id: profile.referrer_id
    });
  }

  return { success: true, data };
};
