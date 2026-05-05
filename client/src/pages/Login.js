// Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../services/api';
import { isAuthNetworkError, loginLocalAuth } from '../services/localAuth';
import './Auth.css';

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.data);
      navigate('/app');
    } catch (err) {
      if (isAuthNetworkError(err)) {
        try {
          const fallback = loginLocalAuth(form);
          login(fallback);
          navigate('/app');
          return;
        } catch (fallbackError) {
          setError(fallbackError.message);
          return;
        }
      }
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb orb1" /><div className="auth-orb orb2" />
        <div className="grid-overlay" />
      </div>
      <div className="auth-card fade-in">
        <div className="auth-brand"><span>⬡</span> GovSim</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your policy simulation dashboard</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Sign In →'}
          </button>
        </form>
        <div className="auth-footer">
          No account? <Link to="/register">Create one</Link>
        </div>
        <div className="auth-demo">
          <div className="demo-label">Demo credentials</div>
          <div className="demo-creds">admin@govsim.in · password123</div>
        </div>
      </div>
    </div>
  );
}

export default Login;
