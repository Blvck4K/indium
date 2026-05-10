import { useState, useEffect } from 'react';
import { Copy, Share2, MessageCircle, Mail, AtSign, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import './Pages.css';

interface ReferredUser {
  full_name: string;
  created_at: string;
}

const Referral = () => {
  const { profile, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferredUsers = async () => {
      if (user && profile) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, created_at')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setReferredUsers(data);
        }
      }
      setLoading(false);
    };

    fetchReferredUsers();
  }, [user, profile]);

  const referralCode = profile?.referral_code || 'N/A';
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <div className="mb-4">
        <h1 className="page-title">Refer & Earn</h1>
        <p className="page-subtitle">Earn ₦200 for every referral when they make their first investment.</p>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Your Personal Access Code</h3>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
          Share your unique identifier with your network. When they make their first investment, you will receive a ₦200 bonus added to your withdrawable balance.
        </p>

        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: '1px solid #f1f5f9'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
            Referral Code
          </span>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '3px', marginBottom: '24px' }}>
            {referralCode}
          </span>
          <button 
            onClick={handleCopy}
            style={{
              width: '100%',
              backgroundColor: copied ? '#10b981' : '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <Copy size={16} style={{ marginRight: '8px' }} /> {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Your Network</h3>
          <div style={{ display: 'flex', alignItems: 'center', color: '#3b82f6', fontWeight: 'bold', fontSize: '14px' }}>
            <Users size={16} style={{ marginRight: '6px' }} />
            {referredUsers.length}
          </div>
        </div>
        
        {loading ? (
          <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center' }}>Loading your network...</p>
        ) : referredUsers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {referredUsers.map((rUser, idx) => (
              <div key={idx} style={{ padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>{rUser.full_name}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(rUser.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', padding: '16px 0' }}>
            You haven't referred anyone yet. Share your code to start earning!
          </p>
        )}
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>Share via</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#0f172a',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            <Share2 size={18} style={{ marginRight: '8px', color: '#0f172a' }} /> LinkedIn
          </button>
          
          <button style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#0f172a',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            <MessageCircle size={18} style={{ marginRight: '8px', color: '#0f172a' }} /> WhatsApp
          </button>
          
          <button style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#0f172a',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            <Mail size={18} style={{ marginRight: '8px', color: '#0f172a' }} /> Email
          </button>
          
          <button style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#0f172a',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            <AtSign size={18} style={{ marginRight: '8px', color: '#0f172a' }} /> Twitter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Referral;
