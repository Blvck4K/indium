import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Gift, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './Pages.css';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferral(ref);
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (signUpError) throw signUpError;
      
      if (data.user) {
        let referrerId = null;
        
        // If they provided a referral code, look up the referrer after auth
        if (referral) {
          const { data: refData, error: refError } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referral.trim())
            .single();
            
          if (refData && !refError) {
            referrerId = refData.id;
          } else {
            console.warn("Invalid referral code provided:", referral);
            // We proceed anyway, but could choose to fail the signup here
          }
        }

        // Generate a random 6-character referral code
        const newReferralCode = 'WEALTH-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create profile manually if trigger is missing
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id, 
              full_name: name, 
              balance: 1000,
              withdrawable_balance: 0,
              reward_balance: 0,
              referral_code: newReferralCode,
              referrer_id: referrerId
            }
          ]);
          
        if (profileError) {
          console.error("Error creating profile:", profileError);
        } else {
          // Log welcome bonus transaction
          await supabase.from('transactions').insert([{
            user_id: data.user.id,
            type: 'Welcome Bonus',
            amount: 1000,
            status: 'Completed'
          }]);

          // Award Referral Reward to Referrer (Pending until first investment)
          if (referrerId) {
            await supabase.rpc('add_referral_pending', {
              p_referrer_id: referrerId
            });
          }
        }

        // Wait a bit to ensure profile is created before redirecting
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate('/dashboard', { state: { showWelcomeBonus: true } });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px 24px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px', marginBottom: '8px' }}>Create Account</h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Join the Indium wealth platform.</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <User size={18} />
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Referral Code (Optional)</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Gift size={18} />
              </div>
              <input 
                type="text" 
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                placeholder="e.g. WEALTH-77X"
                style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '16px', fontSize: '15px', fontWeight: '800', borderRadius: '12px', color: '#ffffff', backgroundColor: loading ? '#475569' : '#0f172a', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}
          >
            {loading ? 'Creating Account...' : <>Create Account <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: '700', color: '#0f172a', textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
