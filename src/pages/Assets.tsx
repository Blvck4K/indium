import { useState } from 'react';
import { Clock, BarChart2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { plans } from '../data/plans';
import { buyPlan } from '../lib/investmentUtils';
import './Pages.css';

const Assets = () => {
  const navigate = useNavigate();
  const { profile, updateBalanceMock, updateWithdrawableBalance } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);


  const handleInvestFromBalance = async (plan: any) => {
    if (!profile) return;
    const amount = Number(plan.investment.replace(/[^0-9.-]+/g,""));
    const totalAvailable = Number(profile.balance) + Number(profile.withdrawable_balance);
    
    if (totalAvailable >= amount) {
      // Deduct from balance first, then withdrawable_balance if needed
      let remaining = amount;
      let deductDeposit = 0;
      let deductWithdrawable = 0;
      
      if (profile.balance >= remaining) {
        deductDeposit = remaining;
      } else {
        deductDeposit = profile.balance;
        deductWithdrawable = remaining - deductDeposit;
      }
      
      // We must await these to ensure they process
      if (deductDeposit > 0) await updateBalanceMock(-deductDeposit, 'Investment');
      if (deductWithdrawable > 0) await updateWithdrawableBalance(-deductWithdrawable, 'Investment');

      const { success, error } = await buyPlan(profile, plan);
      
      if (success) {
        alert(`Successfully invested in ${plan.name}`);
        setSelectedPlan(null);
        navigate('/dashboard');
      } else {
        console.error('Error investing:', error);
        alert('Error creating plan. Balance might be deducted temporarily but will restore on refresh.');
      }
    } else {
      alert('Insufficient total balance. Please deposit funds first.');
    }
  };

  const handlePayFromBank = (plan: any) => {
    const amount = Number(plan.investment.replace(/[^0-9.-]+/g,""));
    navigate(`/deposit?amount=${amount}&planId=${plan.id}`);
  };

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <div className="mb-4">
        <h1 className="page-title">Investment Plans</h1>
        <p className="page-subtitle mb-0">Select a plan to start earning daily returns.</p>
      </div>

      <div className="flex flex-col gap-5">
        {plans.map((plan) => (
          <div key={plan.id} style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
          }}>

            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1 }}>
                  {plan.name}
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}>
                  {plan.status}
                </span>
              </div>
            </div>

            {/* Investment & Return Box */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#64748b', marginBottom: '4px' }}>INVESTMENT</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>{plan.investment}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#16a34a', marginBottom: '4px' }}>DAILY RETURN</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a', letterSpacing: '-0.5px' }}>{plan.dailyReturn}</span>
              </div>
            </div>

            {/* Duration & ROI Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', padding: '0 8px' }}>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: '#eff6ff', color: '#2563eb',
                  marginRight: '12px', flexShrink: 0
                }}>
                  <Clock size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '2px' }}>Duration</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{plan.duration}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: '#faf5ff', color: '#9333ea',
                  marginRight: '12px', flexShrink: 0
                }}>
                  <BarChart2 size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '2px' }}>Total Return</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{plan.roi}</span>
                </div>
              </div>

            </div>

            <button 
              onClick={() => setSelectedPlan(plan)}
              style={{
              width: '100%',
              padding: '16px',
              fontSize: '15px',
              fontWeight: '700',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              backgroundColor: '#0f172a',
              border: 'none',
              cursor: 'pointer'
            }}>
              Invest Now <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </button>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedPlan(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Invest in {selectedPlan.name}</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Choose your payment method for the {selectedPlan.investment} investment.</p>
            
            <button 
              onClick={() => handleInvestFromBalance(selectedPlan)}
              style={{ width: '100%', padding: '14px', backgroundColor: '#0f172a', color: 'white', borderRadius: '8px', fontWeight: 'bold', marginBottom: '12px', border: 'none', cursor: 'pointer' }}
            >
              Invest from Balance
            </button>
            
            <button 
              onClick={() => handlePayFromBank(selectedPlan)}
              style={{ width: '100%', padding: '14px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '8px', fontWeight: 'bold', marginBottom: '16px', border: 'none', cursor: 'pointer' }}
            >
              Straight from Bank
            </button>
            
            <button onClick={() => setSelectedPlan(null)} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
