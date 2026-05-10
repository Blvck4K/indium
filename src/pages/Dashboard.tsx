import { useState, useEffect } from 'react';
import { PlusCircle, ArrowUpRight, ArrowDownRight, Gift, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { plans } from '../data/plans';
import { buyPlan } from '../lib/investmentUtils';
import './Pages.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, updateBalanceMock, refreshProfile } = useAuth();
  const [realAssets, setRealAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (location.state?.showWelcomeBonus) {
      setShowWelcomeModal(true);
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }

    // Auto-buy logic if redirected from Deposit
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const planId = params.get('planId');

    if (status === 'success' && planId && profile) {
      const planToBuy = plans.find(p => p.id === Number(planId));
      if (planToBuy) {
        const executeAutoBuy = async () => {
          // Deduct the investment amount from balance
          const amount = typeof planToBuy.investment === 'string' 
            ? Number(planToBuy.investment.replace(/[^0-9.-]+/g,"")) 
            : planToBuy.investment;
            
          // Deduct from balance
          await updateBalanceMock(-amount, 'Investment');

          const { success, error } = await buyPlan(profile, planToBuy);
          if (success) {
            alert(`Auto-purchase successful: ${planToBuy.name} is now active!`);
            // Refresh assets list
            const { data } = await supabase
              .from('user_plans')
              .select('*')
              .eq('user_id', profile.id)
              .order('created_at', { ascending: false });
            if (data) setRealAssets(data);
          } else {
            console.error('Auto-buy error:', error);
          }
          // Remove query params
          navigate('/dashboard', { replace: true });
        };
        executeAutoBuy();
      }
    }
  }, [location, profile, navigate]);

  useEffect(() => {
    const fetchAssets = async () => {
      if (profile) {
        // Automatically process any matured returns (24h cycles)
        try {
          const { error: rpcError } = await supabase.rpc('process_user_returns', {
            p_user_id: profile.id
          });
          if (rpcError) console.error('Error processing returns:', rpcError);
          else {
            // If returns were processed, refresh the profile to show new balance
            await refreshProfile();
          }
        } catch (err) {
          console.error('Failed to process returns:', err);
        }

        const { data, error } = await supabase
          .from('user_plans')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        if (data && !error) {
          setRealAssets(data);
        }
      }
      setLoadingAssets(false);
    };

    fetchAssets();
  }, [profile]);

  return (
    <div className="page-container">
      {/* Daily Reward Banner */}
      <div
        className="flex justify-between items-center rounded-lg p-3 mb-2 border cursor-pointer"
        style={{ backgroundColor: '#fdfaf3', borderColor: '#fde68a' }}
        onClick={() => navigate('/rewards')}
      >
        <div className="flex items-center">
          <Gift size={20} className="mr-3" style={{ color: '#c39c5b' }} />
          <div className="flex flex-col">
            <span className="font-bold text-sm" style={{ color: '#b45309' }}>Daily Reward Available</span>
            <span className="text-xs" style={{ color: '#c39c5b' }}>Claim your Daily Bonus of ₦200 today</span>
          </div>
        </div>
        <button className="text-white text-xs font-bold py-2 px-4 rounded transition-transform active:scale-95" style={{ backgroundColor: '#c39c5b', padding: '5%', }}>
          Claim
        </button>
      </div>

      {/* Balance Section */}
      <div className="dark-card" style={{ padding: '32px 24px', textAlign: 'center', marginBottom: '8px' }}>
        <span className="text-xs font-bold uppercase tracking-widest text-secondary mb-2 block" style={{ color: '#94a3b8' }}>
          AVAILABLE BALANCE
        </span>
        <h1 className="text-4xl font-bold mb-2 text-white">
          ₦{profile?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
        </h1>
        <div className="flex justify-center items-center text-sm">
          <span className="bg-green-500 bg-opacity-20 text-green-400 px-2 py-1 rounded text-xs font-bold mr-2" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
            Live
          </span>
          <span className="text-secondary" style={{ color: '#94a3b8' }}>Real-time</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-between gap-3 mb-4">
        <button
          onClick={() => navigate('/deposit')}
          className="card flex-1 flex flex-col items-center justify-center py-4 mb-0" style={{ cursor: 'pointer' }}>
          <div className="bg-blue-50 text-blue-600 rounded-full p-3 mb-2" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <ArrowDownRight size={20} />
          </div>
          <span className="text-xs font-bold">Deposit</span>
        </button>
        <button
          onClick={() => navigate('/withdraw')}
          className="card flex-1 flex flex-col items-center justify-center py-4 mb-0" style={{ cursor: 'pointer' }}>
          <div className="bg-blue-50 text-blue-600 rounded-full p-3 mb-2" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <ArrowUpRight size={20} />
          </div>
          <span className="text-xs font-bold">Withdraw</span>
        </button>
        <button
          onClick={() => navigate('/assets')}
          className="card flex-1 flex flex-col items-center justify-center py-4 mb-0" style={{ cursor: 'pointer' }}>
          <div className="bg-gold-light text-gold rounded-full p-3 mb-2" style={{ backgroundColor: '#fdfaf3', color: '#c39c5b' }}>
            <PlusCircle size={20} />
          </div>
          <span className="text-xs font-bold text-gold">Buy</span>
        </button>
      </div>

      {/* Owned Assets List */}
      <div className="flex justify-between items-center mb-3 mt-2">
        <h2 className="text-lg font-bold">My Assets</h2>
        <span className="text-xs font-bold text-secondary flex items-center cursor-pointer">

        </span>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="asset-list px-4 py-2">
          {loadingAssets ? (
            <div className="py-4 text-center text-sm" style={{ color: '#64748b' }}>Loading your assets...</div>
          ) : realAssets.length === 0 ? (
            <div className="py-4 text-center text-sm" style={{ color: '#64748b' }}>
              You don't have any active plans yet.<br />
              <span className="text-blue-500 cursor-pointer" onClick={() => navigate('/assets')}>Browse plans to start earning.</span>
            </div>
          ) : (
            realAssets.map((asset, index) => (
              <div key={asset.id} className={`asset-item flex justify-between items-center py-4 ${index !== realAssets.length - 1 ? 'border-b' : ''}`}>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-xl" style={{ backgroundColor: asset.bg || '#fef3c7', color: asset.color || '#d97706' }}>
                    {asset.icon || '📦'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{asset.plan_name}</span>
                    <span className="text-xs font-bold" style={{ color: '#10b981' }}>{asset.status} <span className="text-secondary" style={{ color: '#64748b', fontWeight: 'normal' }}>• {asset.days_left} Days Left</span></span>
                  </div>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-bold text-sm" style={{ color: '#16a34a' }}>₦{asset.total_received?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                  <span className="text-xs text-secondary font-bold" style={{ color: '#64748b', fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Received</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Welcome Bonus Modal */}
      {showWelcomeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }} onClick={() => setShowWelcomeModal(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px 24px', width: '100%', maxWidth: '400px', textAlign: 'center', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowWelcomeModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={24} />
            </button>

            <div style={{ width: '80px', height: '80px', backgroundColor: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#d97706' }}>
              <Gift size={40} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' }}>Welcome to Indium!</h2>
            <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
              We're thrilled to have you onboard. You've just received a <strong style={{ color: '#10b981' }}>₦1,000.00</strong> sign-up bonus to jumpstart your wealth building journey!
            </p>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Bonus Deposited</span>
              <span style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' }}>₦1,000.00</span>
            </div>

            <button
              onClick={() => {
                setShowWelcomeModal(false);
                navigate('/assets');
              }}
              style={{ width: '100%', padding: '18px', backgroundColor: '#0f172a', color: 'white', borderRadius: '16px', fontWeight: '800', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            >
              Invest Bonus Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
