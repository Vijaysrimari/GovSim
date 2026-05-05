import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../services/api';
import { isAuthNetworkError, registerLocalAuth } from '../services/localAuth';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/register', form);
      login(res.data);
      navigate('/app');
    } catch (err) {
      if (isAuthNetworkError(err)) {
        try {
          const fallback = registerLocalAuth(form);
          login(fallback);
          navigate('/app');
          return;
        } catch (fallbackError) {
          setError(fallbackError.message);
          return;
        }
      }
      setError(err.response?.data?.message || 'Registration failed');
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
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start simulating government policies in 3D</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="field">
            <label>Full Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your name" required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Create Account →'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
