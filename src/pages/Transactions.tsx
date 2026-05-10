import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, Activity, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import './Pages.css';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

const Transactions = () => {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Deposit' | 'Withdrawal'>('All');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (profile) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
          
        if (data && !error) {
          setTransactions(data);
        }
      }
      setLoading(false);
    };
    
    fetchTransactions();
  }, [profile]);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'All') return true;
    return t.type === filter;
  });

  const getIcon = (type: string) => {
    if (type === 'Deposit') return <ArrowDownLeft size={20} />;
    if (type === 'Withdrawal') return <ArrowUpRight size={20} />;
    if (type === 'Investment Return') return <Activity size={20} />;
    if (type === 'Referral Commission') return <Users size={20} />;
    return <Activity size={20} />;
  };

  const getColor = (type: string) => {
    if (type === 'Deposit') return { bg: '#ecfdf5', text: '#10b981' };
    if (type === 'Withdrawal') return { bg: '#fef2f2', text: '#ef4444' };
    if (type === 'Investment Return') return { bg: '#eff6ff', text: '#2563eb' };
    if (type === 'Referral Commission') return { bg: '#faf5ff', text: '#9333ea' };
    return { bg: '#f1f5f9', text: '#64748b' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <div className="mb-6">
        <h1 className="page-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Transaction History</h1>
        <p className="page-subtitle text-secondary">Track all your deposits, withdrawals, and earnings.</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['All', 'Deposit', 'Withdrawal'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as any)}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              backgroundColor: filter === tab ? '#0f172a' : '#f1f5f9',
              color: filter === tab ? 'white' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            {tab}s
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '8px 16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
        
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
            <Clock className="animate-spin mb-2 mx-auto" size={24} />
            <p className="text-sm font-bold">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
            <Activity className="mb-3 mx-auto" size={32} opacity={0.5} />
            <p className="text-sm font-bold">No transactions found.</p>
            <p className="text-xs mt-1">Your recent activity will appear here.</p>
          </div>
        ) : (
          filteredTransactions.map((tx, index) => {
            const colors = getColor(tx.type);
            return (
              <div 
                key={tx.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '16px 0',
                  borderBottom: index !== filteredTransactions.length - 1 ? '1px solid #f1f5f9' : 'none'
                }}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '16px', 
                  backgroundColor: colors.bg, 
                  color: colors.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  flexShrink: 0
                }}>
                  {getIcon(tx.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>{tx.type}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{formatDate(tx.created_at)}</span>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontSize: '15px', 
                    fontWeight: '800', 
                    color: tx.type === 'Withdrawal' ? '#ef4444' : '#10b981',
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    {tx.type === 'Withdrawal' ? '-' : '+'}₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    color: tx.status === 'Completed' ? '#10b981' : (tx.status === 'Failed' ? '#ef4444' : '#f59e0b'),
                    backgroundColor: tx.status === 'Completed' ? '#ecfdf5' : (tx.status === 'Failed' ? '#fef2f2' : '#fffbeb'),
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {tx.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Transactions;
