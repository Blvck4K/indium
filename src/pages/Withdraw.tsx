import { useState, useEffect } from 'react';
import { ArrowRight, Clock, AlertTriangle, Info, Wallet, Building2, User, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { sendTelegramMessage } from '../lib/telegram';
import './Pages.css';

const Withdraw = () => {
  const [amount, setAmount] = useState<string>('');
  const { profile, updateWithdrawableBalance } = useAuth();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [userPlans, setUserPlans] = useState<any[]>([]);
  const [lockedBalance, setLockedBalance] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);

  // Bank Details State
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setAccountNumber(profile.account_number || '');
      setBankName(profile.bank_name || '');
      setAccountName(profile.account_name || '');
    }
  }, [profile]);

  useEffect(() => {
    const fetchUserPlans = async () => {
      if (profile) {
        const { data, error } = await supabase
          .from('user_plans')
          .select('*')
          .eq('user_id', profile.id)
          .eq('status', 'Running');

        if (!error && data) {
          setUserPlans(data);
          
          // Calculate locked balance
          let locked = 0;
          const now = new Date();
          data.forEach((plan: any) => {
            if (plan.investment_amount === 3000 || plan.investment_amount === 5000) {
              const createdAt = new Date(plan.created_at);
              const diffTime = Math.abs(now.getTime() - createdAt.getTime());
              const diffDays = diffTime / (1000 * 60 * 60 * 24);
              
              if (diffDays < 3) {
                // If it's less than 3 days, all returns received so far are locked
                locked += Number(plan.total_received || 0);
              }
            }
          });
          setLockedBalance(locked);
          setAvailableBalance(Math.max(0, (profile.withdrawable_balance || 0) - locked));
        }
      }
    };
    fetchUserPlans();
  }, [profile]);

  const handleWithdraw = async () => {
    setError('');
    setSuccess('');

    if (!accountNumber || !bankName || !accountName) {
      setError('Please fill in all bank details.');
      return;
    }

    // Check time constraint
    const currentHour = new Date().getHours();
    if (currentHour < 19 || currentHour >= 20) {
      setError('Withdrawals are only allowed between 7:00 PM and 8:00 PM.');
      return;
    }

    // Check for 3000/5000 investment 3-day restriction (Granular)
    const numAmount = Number(amount);

    if (numAmount > availableBalance) {
      if (lockedBalance > 0) {
        setError(`Insufficient available balance. ₦${lockedBalance.toLocaleString()} is currently locked until 3 days after your ₦3,000/₦5,000 investments.`);
      } else {
        setError('Insufficient withdrawable balance.');
      }
      return;
    }

    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 2000) {
      setError('Minimum withdrawal amount is ₦2,000.');
      return;
    }

    if (!profile) return;

    if (numAmount > availableBalance) {
      setError('Insufficient available balance.');
      return;
    }

    setIsSaving(true);
    try {
      // Save bank details to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          account_number: accountNumber,
          bank_name: bankName,
          account_name: accountName
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Process withdrawal
      await updateWithdrawableBalance(-numAmount);

      // Send Telegram Notification
      const message = `
<b>🚀 NEW WITHDRAWAL REQUEST</b>
━━━━━━━━━━━━━━━━━━
<b>👤 User:</b> ${profile.full_name || 'User'}
<b>💰 Amount:</b> ₦${numAmount.toLocaleString()}
<b>🏦 Bank:</b> ${bankName}
<b>🔢 Account:</b> ${accountNumber}
<b>📝 Name:</b> ${accountName}
<b>📅 Date:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━
`;
      await sendTelegramMessage(message);

      setSuccess(`Successfully requested withdrawal of ₦${numAmount.toLocaleString()}. Funds will be processed shortly.`);
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'An error occurred during withdrawal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMax = () => {
    if (availableBalance) {
      setAmount(availableBalance.toString());
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <div className="mb-6">
        <h1 className="page-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Withdraw Funds</h1>
        <p className="page-subtitle text-secondary">Transfer your earned funds directly to your linked bank account.</p>
      </div>

      {/* Main Balance Card (Premium Look) */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '24px',
        padding: '32px 24px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
        marginBottom: '24px'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
          <Wallet size={140} />
        </div>

        <div style={{ position: 'relative', zIndex: 10 }}>
          <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
            Available for Withdrawal
          </span>
          <h2 style={{ fontSize: '38px', fontWeight: '800', margin: '0 0 16px 0', letterSpacing: '-1px' }}>
            <span style={{ color: '#10b981', marginRight: '4px' }}>₦</span>
            {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>

          {lockedBalance > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '10px 16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <Clock size={16} style={{ marginRight: '10px' }} />
              <div>
                <span style={{ fontSize: '11px', display: 'block', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Locked (3-Day Rule)</span>
                <span style={{ fontSize: '14px', fontWeight: '800' }}>₦{lockedBalance.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', backdropFilter: 'blur(4px)' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '2px' }}>Deposit Balance</span>
              <span style={{ fontSize: '15px', fontWeight: '700' }}>₦{profile?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
            </div>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>
              Must be invested
            </div>
          </div>
        </div>
      </div>

      {/* Info Callout */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '8px', borderRadius: '10px', marginRight: '16px' }}>
          <Info size={20} />
        </div>
        <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
          <strong style={{ color: '#0f172a' }}>Important:</strong> Only funds generated from daily returns, referral bonuses, and rewards can be withdrawn. Your deposit balance must be invested to generate withdrawable returns.
        </p>
      </div>

      {/* Input Section */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', marginBottom: '24px' }}>

        {/* Time Window Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#eff6ff', color: '#2563eb', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
            <Clock size={14} style={{ marginRight: '6px' }} />
            Window: 7:00 PM - 8:00 PM
          </div>
        </div>

        <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>
          Amount to Withdraw
        </label>

        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            ₦
          </div>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: '100%',
              padding: '20px 80px 20px 48px',
              fontSize: '24px',
              fontWeight: '800',
              color: '#0f172a',
              backgroundColor: '#f8fafc',
              border: '2px solid transparent',
              borderRadius: '16px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#e2e8f0'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
          <button
            onClick={handleMax}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: '#0f172a',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              letterSpacing: '1px'
            }}
          >
            MAX
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0', padding: '0 4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Min: ₦2,000</span>
          {amount && Number(amount) > availableBalance && (
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444' }}>Exceeds available</span>
          )}
        </div>
      </div>

      {/* Bank Details Section */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
          <Building2 size={20} style={{ marginRight: '10px', color: '#10b981' }} /> Bank Information
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
            Account Number
          </label>
          <div style={{ position: 'relative' }}>
            <CreditCard size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Enter 10-digit account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
            Bank Name
          </label>
          <div style={{ position: 'relative' }}>
            <Building2 size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="e.g. Access Bank, Kuda, GTBank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
            Account Name
          </label>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Full name on bank account"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ position: 'sticky', bottom: '24px', left: 0, right: 0, zIndex: 50 }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px', marginBottom: '12px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 12px rgba(185, 28, 28, 0.1)' }}>
            <AlertTriangle size={18} style={{ marginRight: '10px', flexShrink: 0 }} /> {error}
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px', marginBottom: '12px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#047857', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 12px rgba(4, 120, 87, 0.1)' }}>
            {success}
          </div>
        )}

        <button
          onClick={handleWithdraw}
          disabled={isSaving || !amount}
          style={{
            width: '100%',
            padding: '18px',
            backgroundColor: isSaving || !amount ? '#94a3b8' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isSaving || !amount ? 'not-allowed' : 'pointer',
            boxShadow: isSaving || !amount ? 'none' : '0 8px 20px -6px rgba(16, 185, 129, 0.5)',
            transition: 'all 0.2s',
          }}
          onMouseDown={(e) => !isSaving && amount && (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => !isSaving && amount && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isSaving ? 'Processing...' : <>Confirm Withdrawal <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>}
        </button>
      </div>
    </div>
  );
};

export default Withdraw;

