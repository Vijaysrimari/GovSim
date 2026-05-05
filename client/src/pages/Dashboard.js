import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../services/api';
import './Dashboard.css';

const CAT_COLORS = {
  Education: '#3b82f6', Healthcare: '#ef4444', Environment: '#22c55e',
  Economic: '#f59e0b', Infrastructure: '#8b5cf6', Social: '#ec4899', Agriculture: '#84cc16'
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [pRes, cRes] = await Promise.allSettled([
        api.get('/policies?limit=6'),
        api.get('/categories'),
      ]);

      if (cancelled) return;

      const policies = pRes.status === 'fulfilled' ? (pRes.value.data?.policies || []) : [];
      const total = pRes.status === 'fulfilled' ? pRes.value.data?.total : null;
      const categories = cRes.status === 'fulfilled' ? (cRes.value.data || []) : [];

      if (pRes.status !== 'fulfilled' || cRes.status !== 'fulfilled') {
        // eslint-disable-next-line no-console
        console.warn('Dashboard partial fetch:', {
          policies: pRes.status,
          categories: cRes.status,
        });
      }

      setRecent(policies);
      setStats({ total: total ?? 35, cats: categories.length || 7 });
      setCats(categories);
      setLoading(false);
    })().catch((err) => {
      // Backend returned an error (500) or is unreachable. Log and fall back to safe defaults.
      // Keep a visible empty state instead of letting the app crash with uncaught errors.
      // eslint-disable-next-line no-console
      console.error('Dashboard fetch error:', err?.response || err.message || err);
      if (!cancelled) {
        setRecent([]);
        setStats({ total: 35, cats: 7 });
        setCats([]);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dashboard fade-in">
      {/* Header */}
      <div className="dash-header">
        <div>
          <div className="dash-greeting">{greeting}, {user?.name?.split(' ')[0]}</div>
          <h1 className="dash-title">Policy Simulation <em>Dashboard</em></h1>
          <p className="dash-sub">Explore, simulate and analyse government policies in real-time 3D</p>
        </div>
        <button className="dash-cta" onClick={() => navigate('/app/policies')}>
          Browse All Policies →
        </button>
      </div>

      {/* Stats row */}
      <div className="dash-stats">
        {[
          { label: 'Total Policies', val: stats?.total ?? 35, icon: '◈', color: 'var(--orange)' },
          { label: 'Categories', val: stats?.cats ?? 7, icon: '⬡', color: 'var(--blue)' },
          { label: 'Avg Duration', val: '54 mo', icon: '◷', color: 'var(--cyan)' },
          { label: 'Impact Axes', val: 3, icon: '◉', color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="sc-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="sc-val" style={{ color: s.color }}>{s.val}</div>
            <div className="sc-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="dash-section">
        <div className="section-hd">
          <div className="section-title">Policy Categories</div>
          <button className="section-link" onClick={() => navigate('/app/policies')}>View all →</button>
        </div>
        <div className="cats-grid">
          {cats.map(c => (
            <button
              key={c._id}
              className="cat-card"
              onClick={() => navigate(`/app/policies?category=${c.name}`)}
              style={{ '--cat-color': CAT_COLORS[c.name] || '#6b7280' }}
            >
              <div className="cat-icon">{c.icon}</div>
              <div className="cat-name">{c.name}</div>
              <div className="cat-count">{c.policyCount} policies</div>
              <div className="cat-arrow">→</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent policies */}
      <div className="dash-section">
        <div className="section-hd">
          <div className="section-title">Recent Policies</div>
          <button className="section-link" onClick={() => navigate('/app/policies')}>See all →</button>
        </div>
        <div className="recent-grid">
          {recent.map(p => (
            <div key={p._id} className="policy-card" onClick={() => navigate(`/app/simulate/${p._id}`)}>
              <div className="pc-top">
                <div className="pc-icon" style={{ background: `${CAT_COLORS[p.category]}18` }}>{p.icon}</div>
                <div className="pc-cat" style={{ color: CAT_COLORS[p.category] || 'var(--orange)' }}>{p.category}</div>
              </div>
              <div className="pc-title">{p.title}</div>
              <div className="pc-sub">{p.subtitle}</div>
              <div className="pc-meta">
                <span className="pc-tag">⏱ {p.duration} months</span>
                <span className="pc-tag">👥 {p.targetPopulation}</span>
              </div>
              <div className="pc-simulate">Simulate in 3D →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
