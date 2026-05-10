import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import './Pages.css';

const Deposit = () => {
  const [amount, setAmount] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, updateBalanceMock } = useAuth();

  // If redirecting from Assets with a pre-selected plan
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefillAmount = params.get('amount');
    if (prefillAmount) {
      setAmount(prefillAmount);
    }
  }, [location]);

  const presetAmounts = [
    3000, 5000, 10000, 15000, 20000, 30000, 50000, 70000, 100000, 150000, 200000, 300000, 500000
  ];

  const handleAmountClick = (val: number) => {
    setAmount(val.toString());
  };

  const config = {
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
    tx_ref: Date.now().toString(),
    amount: Number(amount),
    currency: 'NGN',
    payment_options: 'banktransfer,card,ussd,mobilemoney',
    customer: {
      email: user?.email || '',
      phone_number: '',
      name: profile?.full_name || 'Customer',
    },
    customizations: {
      title: 'Wallet Deposit',
      description: 'Payment for wallet funding',
      logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-abstract-symbol-logo-template.jpg',
    },
  };

  const [processing, setProcessing] = useState(false);
  const handleFlutterPayment = useFlutterwave(config);

  const handleProceed = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 3000) {
      alert("Minimum deposit amount is ₦3,000");
      return;
    }

    const planId = new URLSearchParams(location.search).get('planId');

    handleFlutterPayment({
      callback: async (response) => {
        console.log("Flutterwave Response:", response);
        
        // Handle successful payment
        if (response.status === "successful" || response.status === "success" || (response as any).charge_response_code === "00") {
          setProcessing(true);
          try {
            // Use verified amount if available, otherwise state amount
            const verifiedAmount = response.amount ? Number(response.amount) : Number(amount);
            console.log(`Verifying deposit of ${verifiedAmount}...`);
            
            await updateBalanceMock(verifiedAmount);
            
            console.log("Balance updated successfully");
            if (planId) {
              navigate(`/dashboard?status=success&planId=${planId}`);
            } else {
              navigate('/dashboard?status=success');
            }
          } catch (err) {
            console.error("Critical: Balance update failed after successful payment:", err);
            alert(`PAYMENT SUCCESSFUL but balance update failed. Please DO NOT refresh. Copy this ID: ${response.transaction_id || 'N/A'} and send to support.`);
          } finally {
            setProcessing(false);
          }
        } else if (response.status === "pending") {
          alert("Payment is pending. Your balance will update automatically once confirmed by the bank. This usually takes 5-10 minutes.");
          navigate('/dashboard');
        } else {
          console.warn("Payment was not successful:", response.status);
          alert(`Payment Status: ${response.status}. If you have already been debited, please contact support with reference: ${response.tx_ref}`);
        }
        closePaymentModal();
      },
      onClose: () => {
        if (processing) {
          console.log("Modal closed while processing update...");
        }
      },
    });
  };

  return (
    <div className="page-container" style={{ paddingBottom: '80px', backgroundColor: '#ffffffff', minHeight: '100vh', paddingTop: '20px' }}>
      {/* Top Header - Mocking the balance view or just title based on screenshot */}
      <div className="mb-6 flex flex-col items-center justify-center pt-4" style={{ color: 'white' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', letterSpacing: '1px' }}>
          ₦{profile?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
        </h1>
        <button style={{
          backgroundColor: '#1e293b', color: '#e2e8f0', fontSize: '12px', fontWeight: '600',
          padding: '8px 16px', borderRadius: '20px', marginTop: '12px',
          display: 'flex', alignItems: 'center', gap: '6px', border: 'none'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          View History
        </button>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px 24px 0 0',
        padding: '32px 24px',
        minHeight: '60vh',
        boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '24px' }}>
          Select Amount
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '28px'
        }}>
          {presetAmounts.map((val) => (
            <button
              key={val}
              onClick={() => handleAmountClick(val)}
              style={{
                padding: '14px 4px',
                borderRadius: '12px',
                border: amount === val.toString() ? '2px solid #ef4444' : '1px solid #f1f5f9',
                backgroundColor: amount === val.toString() ? '#fef2f2' : '#ffffff',
                color: amount === val.toString() ? '#ef4444' : '#475569',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              ₦{val.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: '#94a3b8', fontSize: '11px' }}>
          OR ENTER CUSTOM AMOUNT
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '32px',
          border: '1px solid #f1f5f9'
        }}>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#94a3b8', marginRight: '8px' }}>₦</span>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '18px',
              fontWeight: '800',
              color: '#0f172a',
              width: '100%'
            }}
          />
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
          Minimum deposit is ₦3,000
        </div>
        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginBottom: '24px', textAlign: 'center', backgroundColor: '#ecfdf5', padding: '8px', borderRadius: '8px' }}>
          ✨ Bank Transfer is recommended for faster processing
        </div>

        <button
          onClick={handleProceed}
          disabled={processing}
          style={{
            width: '100%',
            padding: '20px',
            backgroundColor: processing ? '#475569' : '#000000ff',
            color: 'white',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '700',
            border: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: processing ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 20px -6px rgba(94, 94, 94, 0.6)'
          }}
        >
          {processing ? 'Updating Balance...' : <>Proceed to Pay <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>}
        </button>
      </div>
    </div>
  );
};

export default Deposit;
