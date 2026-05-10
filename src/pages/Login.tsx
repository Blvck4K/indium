import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './Pages.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px 24px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px', marginBottom: '8px' }}>Welcome Back</h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Sign in to continue to Indium.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
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
                placeholder="Enter your password"
                required
                style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <a href="#" style={{ fontSize: '12px', fontWeight: '600', color: '#3b82f6', textDecoration: 'none' }}>Forgot Password?</a>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '16px', fontSize: '15px', fontWeight: '800', borderRadius: '12px', color: '#ffffff', backgroundColor: loading ? '#475569' : '#0f172a', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}
          >
            {loading ? 'Signing In...' : <>Sign In <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Don't have an account? <Link to="/signup" style={{ fontWeight: '700', color: '#0f172a', textDecoration: 'none' }}>Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
