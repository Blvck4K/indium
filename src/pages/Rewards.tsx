import { useState, useEffect } from 'react';
import { CheckCircle, Zap, Gift, Wallet, Clock, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import './Pages.css';

const Rewards = () => {
  const { profile, user, refreshProfile, updateWithdrawableBalance } = useAuth();
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const rewardBalance = profile?.reward_balance || 0;
  const TARGET_AMOUNT = 8000;
  const REWARD_AMOUNT = 200;

  useEffect(() => {
    if (profile) {
      if (profile.last_daily_claim_at) {
        const lastClaim = new Date(profile.last_daily_claim_at);
        const now = new Date();
        const diffMs = now.getTime() - lastClaim.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 24) {
          setClaimed(true);
          const remainingMs = (24 * 60 * 60 * 1000) - diffMs;
          const h = Math.floor(remainingMs / (1000 * 60 * 60));
          const m = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${h}h ${m}m`);
        } else {
          setClaimed(false);
        }
      } else {
        setClaimed(false);
      }
      setLoading(false);
    }
  }, [profile]);

  const handleClaim = async () => {
    if (!user || !profile) return;
    
    // Optimistic update
    setClaimed(true);
    
    // Database update
    const { error } = await supabase
      .from('profiles')
      .update({ 
        reward_balance: Number(profile.reward_balance) + REWARD_AMOUNT,
        last_daily_claim_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward. Please try again later.');
      setClaimed(false);
    } else {
      await refreshProfile();
      setTimeLeft('23h 59m');
    }
  };

  const handleWithdrawRewards = async () => {
    if (!user || !profile) return;
    
    if (rewardBalance >= TARGET_AMOUNT) {
      // Use updateWithdrawableBalance so it counts as earnings!
      await updateWithdrawableBalance(rewardBalance);
      
      // Reset reward balance
      const { error } = await supabase
        .from('profiles')
        .update({ reward_balance: 0 })
        .eq('id', user.id);
        
      if (!error) {
        await refreshProfile();
        alert('Successfully withdrawn rewards to your Withdrawable Balance!');
      } else {
        alert('Failed to update reward balance in database.');
      }
    } else {
      alert(`You need at least ₦${TARGET_AMOUNT.toLocaleString()} to withdraw rewards.`);
    }
  };

  if (loading) {
    return <div className="page-container flex items-center justify-center h-full"><p className="text-secondary font-bold">Loading rewards...</p></div>;
  }

  const progressPercentage = Math.min((rewardBalance / TARGET_AMOUNT) * 100, 100);

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <div className="mb-6">
        <h1 className="page-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Daily Rewards</h1>
        <p className="page-subtitle text-secondary">Claim daily rewards and withdraw them to your balance.</p>
      </div>

      {/* Main Daily Claim Action */}
      <div style={{ 
        background: claimed ? '#f8fafc' : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: claimed ? '#0f172a' : 'white',
        borderRadius: '24px',
        padding: '32px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: claimed ? 'none' : '0 10px 25px -5px rgba(49, 46, 129, 0.4)',
        border: claimed ? '1px solid #e2e8f0' : 'none',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        {!claimed && (
          <>
            <div style={{ position: 'absolute', top: '-30px', right: '-20px', opacity: 0.1, transform: 'rotate(15deg)' }}>
              <Gift size={150} color="#c7d2fe" />
            </div>
            <div style={{ position: 'absolute', top: '20px', left: '20px', opacity: 0.2 }}>
              <Zap size={40} color="#fbbf24" />
            </div>
          </>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', position: 'relative', zIndex: 10 }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            width: '80px', height: '80px', borderRadius: '50%', 
            backgroundColor: claimed ? '#ecfdf5' : 'rgba(251, 191, 36, 0.15)', 
            color: claimed ? '#10b981' : '#fbbf24',
            boxShadow: claimed ? 'none' : '0 0 20px rgba(251, 191, 36, 0.3)'
          }}>
            {claimed ? <CheckCircle size={40} /> : <Gift size={40} />}
          </div>
        </div>
        
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', position: 'relative', zIndex: 10, letterSpacing: '-0.5px' }}>
          {claimed ? 'Reward Claimed!' : 'Daily Reward Ready'}
        </h2>
        
        <p style={{ fontSize: '14px', marginBottom: '24px', position: 'relative', zIndex: 10, color: claimed ? '#64748b' : '#c7d2fe', lineHeight: 1.5 }}>
          {claimed 
            ? `You have successfully claimed today's ₦${REWARD_AMOUNT} reward. Come back in ${timeLeft}!` 
            : `Claim your ₦${REWARD_AMOUNT} reward for today. Accumulate up to ₦${TARGET_AMOUNT.toLocaleString()} to withdraw to your main balance.`}
        </p>
        
        <button 
          onClick={handleClaim}
          disabled={claimed}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: claimed ? 'transparent' : '#fbbf24',
            color: claimed ? '#64748b' : '#1e1b4b',
            border: claimed ? '2px solid #e2e8f0' : 'none',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: claimed ? 'not-allowed' : 'pointer',
            position: 'relative',
            zIndex: 10,
            boxShadow: claimed ? 'none' : '0 4px 14px 0 rgba(251, 191, 36, 0.4)',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => { if(!claimed) e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={(e) => { if(!claimed) e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { if(!claimed) e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {claimed ? (
            <>Available Tomorrow <Clock size={18} style={{ marginLeft: '8px' }} /></>
          ) : (
            <>Claim ₦{REWARD_AMOUNT} <Zap size={18} style={{ marginLeft: '8px' }} /></>
          )}
        </button>
      </div>

      {/* Rewards Balance & Withdrawal Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#eff6ff', color: '#3b82f6', padding: '10px', borderRadius: '12px', marginRight: '16px' }}>
            <Wallet size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>Reward Balance</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Progress towards withdrawal</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Accumulated
            </span>
            <span style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>
              <span style={{ fontSize: '20px', color: '#64748b', marginRight: '2px' }}>₦</span>
              {rewardBalance.toLocaleString()}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Target
            </span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '8px' }}>
              ₦{TARGET_AMOUNT.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Premium Progress Bar */}
        <div style={{ position: 'relative', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '100px', marginBottom: '24px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            position: 'absolute', top: 0, left: 0, bottom: 0, 
            width: `${progressPercentage}%`, 
            background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
            borderRadius: '100px',
            transition: 'width 0.5s ease-out'
          }}>
            {/* Shimmer effect */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)', animation: 'shimmer 2s infinite' }}></div>
          </div>
        </div>

        {rewardBalance < TARGET_AMOUNT && (
          <div style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', marginBottom: '24px', borderRadius: '16px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
            <div style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '6px', borderRadius: '8px', marginRight: '12px' }}>
              <Lock size={16} />
            </div>
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0, lineHeight: 1.5, fontWeight: '600' }}>
              You need <strong style={{ color: '#b45309' }}>₦{(TARGET_AMOUNT - rewardBalance).toLocaleString()}</strong> more to unlock your reward withdrawal. Keep claiming daily!
            </p>
          </div>
        )}

        <button 
          onClick={handleWithdrawRewards}
          disabled={rewardBalance < TARGET_AMOUNT}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: rewardBalance >= TARGET_AMOUNT ? '#3b82f6' : '#f1f5f9',
            color: rewardBalance >= TARGET_AMOUNT ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: rewardBalance >= TARGET_AMOUNT ? 'pointer' : 'not-allowed',
            boxShadow: rewardBalance >= TARGET_AMOUNT ? '0 4px 14px 0 rgba(59, 130, 246, 0.4)' : 'none',
            transition: 'transform 0.1s, background-color 0.3s',
          }}
          onMouseDown={(e) => { if(rewardBalance >= TARGET_AMOUNT) e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={(e) => { if(rewardBalance >= TARGET_AMOUNT) e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { if(rewardBalance >= TARGET_AMOUNT) e.currentTarget.style.transform = 'scale(1)'; }}
        >
          Withdraw to Balance {rewardBalance >= TARGET_AMOUNT && <ArrowRight size={18} style={{ marginLeft: '8px' }} />}
        </button>
      </div>
      
    </div>
  );
};

export default Rewards;
