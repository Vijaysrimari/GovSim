import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './PolicyLibrary.css';

const CAT_COLORS = {
  Education:'#3b82f6',Healthcare:'#ef4444',Environment:'#22c55e',
  Economic:'#f59e0b',Infrastructure:'#8b5cf6',Social:'#ec4899',Agriculture:'#84cc16'
};
const CATEGORIES = ['All','Education','Healthcare','Environment','Economic','Infrastructure','Social','Agriculture'];

// Generate complete fallback policy data with simulation support
const FALLBACK_POLICIES = (() => {
  const titles = [
    'Free WiFi for School Students','Mid-Day Meal Scheme','Digital Classroom Initiative','Free Higher Education for Girls','National Coding in Schools',
    'Universal Health Coverage','National Vaccination Drive','Mental Health in Schools','Swachh Bharat Mission','Ayushman Bharat PM-JAY',
    'Solar Rooftop for Every Home','Plastic Ban Policy','National Electric Vehicle Mission','National Afforestation Programme','Jal Jeevan Mission',
    'GST Simplified for MSMEs','MGNREGA Employment Guarantee','Startup India Initiative','Jan Dhan Financial Inclusion','Production Linked Incentive',
    'PM Gati Shakti National Master Plan','5G Rollout National Mission','Smart Cities Mission','Urban Metro Expansion','PM Awas Yojana',
    'Direct Benefit Transfer Pension','Beti Bachao Beti Padhao','PM Ujjwala LPG Scheme','National Social Security for Gig Workers','PDS Digital Ration Reform',
    'PM-KISAN Direct Income Support','Fasal Bima Crop Insurance','Drip Irrigation Mission','Organic Farming Mission','e-NAM Agricultural Markets'
  ];
  const categories = ['Education','Healthcare','Environment','Economic','Infrastructure','Social','Agriculture'];
  const icons = ['📶','🍱','🖥️','👩‍🎓','💻','🏥','💉','🧠','🚿','💊','☀️','♻️','🚗','🌱','💧','📊','🛠️','🚀','💳','⚡','🏗️','📡','🏙️','🚇','🏠','💰','👧','🔥','👷','🛒','🚜','📋','💧','🌾','🛍️'];

  return titles.map((t, i) => {
    const phases = [
      { phase: 0, name: 'Announcement', monthStart: 0, monthEnd: 2, description: 'Policy announced and preparation begins', color: '#eab308', sceneDescription: 'Announcement scene' },
      { phase: 1, name: 'Implementation', monthStart: 3, monthEnd: 25, description: 'Policy rolls out across the country', color: '#22c55e', sceneDescription: 'Implementation scene with growth' },
      { phase: 2, name: 'Challenges', monthStart: 26, monthEnd: 40, description: 'Issues and challenges emerge', color: '#ef4444', sceneDescription: 'Challenge phase with obstacles' },
      { phase: 3, name: 'Stabilization', monthStart: 41, monthEnd: 60, description: 'Policy stabilizes and impacts normalize', color: '#3b82f6', sceneDescription: 'Stable equilibrium reached' }
    ];

    const impactData = Array.from({ length: 61 }, (_, month) => {
      const t_norm = month / 60;
      const easeIn = t_norm < 0.5 ? 2*t_norm*t_norm : -1+(4-2*t_norm)*t_norm;
      const clamp = (v) => Math.min(100, Math.max(0, Math.round(v)));
      return {
        month,
        economic: clamp(20 + 50 * easeIn),
        social: clamp(30 + 55 * easeIn),
        environmental: clamp(15 + 45 * easeIn),
        positiveEffects: [{label: 'Benefit Impact', value: clamp(40 + 50 * easeIn)}],
        negativeEffects: [{label: 'Challenge Impact', value: clamp(Math.max(0, 50 - 60 * easeIn))}]
      };
    });

    return {
      _id: `fallback-${i}`,
      icon: icons[i % icons.length],
      category: categories[i % categories.length],
      title: t,
      subtitle: `${categories[i % categories.length]} Policy`,
      description: `This is an offline placeholder for ${t}. The actual policy data loads when the backend is available.`,
      duration: 48 + (i % 3) * 12,
      budget: `₹${5 + (i % 10)}00 Crore`,
      targetPopulation: `${(i+1)*10} Million`,
      netScore: 65 + (i % 30),
      phases,
      impactData,
      positiveImpacts: [{label: 'Positive Effect',icon: '✓',description: 'This policy has positive outcomes'}],
      negativeImpacts: [{label: 'Challenge',icon: '⚠️',description: 'Implementation faces challenges'}]
    };
  });
})();

export default function PolicyLibrary() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [policies, setPolicies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState('');

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category && category !== 'All') params.set('category', category);
      params.set('limit', 50);
      const res = await api.get(`/policies?${params}`);
      setPolicies(res.data.policies || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      // API failed; use offline fallback and apply filters
      // eslint-disable-next-line no-console
      console.error('PolicyLibrary fetch error:', err?.response || err.message || err);
      let filtered = [...FALLBACK_POLICIES];
      
      // Filter by category
      if (category && category !== 'All') {
        filtered = filtered.filter(p => p.category === category);
      }
      
      // Filter by search text
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(q) || 
          p.subtitle.toLowerCase().includes(q)
        );
      }
      
      setPolicies(filtered);
      setTotal(filtered.length);
    } finally { setLoading(false); }
  }, [search, category]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const deletePolicy = async (policyId) => {
    const ok = window.confirm('Delete this policy? This action cannot be undone.');
    if (!ok) return;

    try {
      setDeletingId(policyId);
      await api.delete(`/policies/${policyId}`);
      setPolicies((prev) => prev.filter((p) => p._id !== policyId));
      setTotal((prev) => Math.max(0, prev - 1));
      setSelected((prev) => (prev?._id === policyId ? null : prev));
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="library-page fade-in">
      {/* Header */}
      <div className="lib-header">
        <div>
          <h1 className="lib-title">Policy <em>Library</em></h1>
          <p className="lib-sub">{total} real government policies · Click any to run 3D simulation</p>
        </div>
        <div className="lib-search">
          <span className="search-icon">⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search policies..."
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
        </div>
      </div>

      {/* Category tabs */}
      <div className="cat-tabs">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`cat-tab ${category === c ? 'active' : ''}`}
            style={category === c && c !== 'All' ? { '--tc': CAT_COLORS[c] } : {}}
            onClick={() => { setCategory(c); if(c !== 'All') setSearchParams({category: c}); else setSearchParams({}); }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="lib-body">
        {/* Policy Grid */}
        <div className="lib-grid">
          {loading ? (
            Array(6).fill(0).map((_,i) => <div key={i} className="policy-skeleton" />)
          ) : policies.length === 0 ? (
            <div className="lib-empty">No policies found for "{search}"</div>
          ) : (
            policies.map(p => (
              <div
                key={p._id}
                className={`lib-card ${selected?._id === p._id ? 'selected' : ''}`}
                style={{ '--cc': CAT_COLORS[p.category] || '#6b7280' }}
                onClick={() => setSelected(selected?._id === p._id ? null : p)}
              >
                <div className="lc-accent" />
                <div className="lc-top">
                  <div className="lc-icon">{p.icon}</div>
                  <div className="lc-cat" style={{ color: CAT_COLORS[p.category] }}>{p.category}</div>
                </div>
                <div className="lc-title">{p.title}</div>
                <div className="lc-sub">{p.subtitle}</div>
                <div className="lc-footer">
                  <div className="lc-meta">
                    <span>⏱ {p.duration}mo</span>
                    <span>💰 {p.budget}</span>
                  </div>
                  <div className="lc-actions">
                    <button
                      className="lc-del-btn"
                      disabled={deletingId === p._id}
                      onClick={e => { e.stopPropagation(); deletePolicy(p._id); }}
                    >
                      {deletingId === p._id ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      className="lc-sim-btn"
                      onClick={e => { e.stopPropagation(); navigate(`/app/simulate/${p._id}`); }}
                    >
                      Simulate →
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="detail-panel fade-in">
            <button className="detail-close" onClick={() => setSelected(null)}>×</button>
            <div className="dp-icon">{selected.icon}</div>
            <div className="dp-cat" style={{ color: CAT_COLORS[selected.category] }}>{selected.category}</div>
            <div className="dp-title">{selected.title}</div>
            <div className="dp-sub">{selected.subtitle}</div>
            <p className="dp-desc">{selected.description}</p>

            <div className="dp-grid">
              <div className="dp-item"><div className="dp-il">Target</div><div className="dp-iv">{selected.targetPopulation}</div></div>
              <div className="dp-item"><div className="dp-il">Budget</div><div className="dp-iv">{selected.budget}</div></div>
              <div className="dp-item"><div className="dp-il">Duration</div><div className="dp-iv">{selected.duration} months</div></div>
              <div className="dp-item"><div className="dp-il">Net Score</div><div className="dp-iv" style={{color:'var(--green)'}}>{selected.netScore}/100</div></div>
            </div>

            <div className="dp-phases">
              <div className="dp-section-label">Policy Phases</div>
              {selected.phases?.map(ph => (
                <div key={ph.phase} className="dp-phase" style={{ '--phc': ph.color }}>
                  <div className="dpp-dot" />
                  <div>
                    <div className="dpp-name">{ph.name}</div>
                    <div className="dpp-range">Month {ph.monthStart}–{ph.monthEnd}</div>
                    <div className="dpp-desc">{ph.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="dp-impacts">
              <div className="dp-col">
                <div className="dp-section-label" style={{color:'var(--green)'}}>✓ Positive</div>
                {selected.positiveImpacts?.map(imp => (
                  <div key={imp.label} className="dp-impact-item dp-pos">
                    <span>{imp.icon}</span>
                    <div>
                      <div className="dpi-label">{imp.label}</div>
                      <div className="dpi-desc">{imp.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dp-col">
                <div className="dp-section-label" style={{color:'var(--red)'}}>✗ Negative</div>
                {selected.negativeImpacts?.map(imp => (
                  <div key={imp.label} className="dp-impact-item dp-neg">
                    <span>{imp.icon}</span>
                    <div>
                      <div className="dpi-label">{imp.label}</div>
                      <div className="dpi-desc">{imp.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dp-actions">
              <button
                className="dp-delete"
                disabled={deletingId === selected._id}
                onClick={() => deletePolicy(selected._id)}
              >
                {deletingId === selected._id ? 'Deleting...' : 'Delete Policy'}
              </button>
              <button className="dp-simulate" onClick={() => navigate(`/app/simulate/${selected._id}`)}>
                ▶ Launch 3D Simulation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
