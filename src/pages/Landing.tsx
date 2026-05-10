import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, Megaphone, ShieldCheck, TrendingUp, Gem } from 'lucide-react';
import './Pages.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', marginTop: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' }}>Indium.</h1>
      </div>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#fdfaf3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c39c5b' }}>
            <Gem size={32} />
          </div>
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', lineHeight: '1.2', letterSpacing: '-1px' }}>
          Invest in the World's Rarest Precious Stones
        </h2>
        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', marginBottom: '24px', padding: '0 12px' }}>
          Indium unlocks exclusive access to high-yield investments in physical precious metals and rare gemstones. From Copper to flawless Red Diamonds, build a tangible portfolio that generates guaranteed daily compounding returns. Join our elite network today and secure your wealth with assets that never lose their shine.
        </p>
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <ShieldCheck size={24} style={{ color: '#10b981', marginBottom: '12px' }} />
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Tangible Assets</h4>
          <p style={{ fontSize: '12px', color: '#64748b' }}>Backed by physical gems</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <TrendingUp size={24} style={{ color: '#3b82f6', marginBottom: '12px' }} />
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>High Yield</h4>
          <p style={{ fontSize: '12px', color: '#64748b' }}>25% guaranteed daily ROI</p>
        </div>
      </div>

      {/* Community Section */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Join the Inner Circle</h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
          Connect with other investors, receive live signals, and stay updated on the latest wealth generation protocols.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a href="https://t.me/+5ufcu0hYv1kxZTg0" style={{ display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: '#eff6ff', borderRadius: '12px', textDecoration: 'none' }}>
            <MessageCircle size={20} style={{ color: '#2563eb', marginRight: '16px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a8a' }}>Telegram Group</div>
              <div style={{ fontSize: '12px', color: '#3b82f6' }}>Chat & Networking</div>
            </div>
          </a>

          <a href="https://t.me/+cniQgl_u7uJkN2Jk" style={{ display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: '#faf5ff', borderRadius: '12px', textDecoration: 'none' }}>
            <Megaphone size={20} style={{ color: '#9333ea', marginRight: '16px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#5b21b6' }}>Telegram Channel</div>
              <div style={{ fontSize: '12px', color: '#a855f7' }}>Official Announcements</div>
            </div>
          </a>
        </div>
      </div>

      <div style={{ flex: 1 }}></div>

      {/* Proceed Button */}
      <div style={{ paddingBottom: '20px' }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            padding: '18px',
            fontSize: '16px',
            fontWeight: '800',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            backgroundColor: '#0f172a',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)'
          }}
        >
          Proceed to Platform <ArrowRight size={20} style={{ marginLeft: '12px' }} />
        </button>
      </div>
    </div>
  );
};

export default Landing;
