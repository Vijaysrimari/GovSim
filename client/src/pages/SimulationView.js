import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../services/api';
import PolicyScene3D from '../components/3d/PolicyScene3D';
import './SimulationView.css';

const CAT_COLORS = {
  Education: '#3b82f6', Healthcare: '#ef4444', Environment: '#22c55e',
  Economic: '#f59e0b', Infrastructure: '#8b5cf6', Social: '#ec4899', Agriculture: '#84cc16'
};

const AXES = [
  { key: 'economic', label: 'Economic', color: '#f59e0b', icon: '📈' },
  { key: 'social', label: 'Social', color: '#ec4899', icon: '🤝' },
  { key: 'environmental', label: 'Environmental', color: '#22c55e', icon: '🌿' }
];

function clampMonth(value, maxMonth) {
  return Math.min(Number(maxMonth || 0), Math.max(0, Number(value || 0)));
}

// Check if policy ID is a fallback ID to use offline data
const isFallbackId = (id) => String(id).startsWith('fallback-');

let FALLBACK_POLICIES_MAP = null;
const getFallbackPolicy = (id) => {
  if (!FALLBACK_POLICIES_MAP) {
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

    FALLBACK_POLICIES_MAP = {};
    titles.forEach((t, i) => {
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
      FALLBACK_POLICIES_MAP[`fallback-${i}`] = {
        _id: `fallback-${i}`,
        icon: icons[i % icons.length],
        category: categories[i % categories.length],
        title: t,
        subtitle: `${categories[i % categories.length]} Policy`,
        description: `Offline placeholder for ${t}`,
        duration: 48 + (i % 3) * 12,
        budget: `₹${5 + (i % 10)}00 Crore`,
        targetPopulation: `${(i+1)*10} Million`,
        netScore: 65 + (i % 30),
        phases,
        impactData
      };
    });
  }
  return FALLBACK_POLICIES_MAP[id];
};

export default function SimulationView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [policy, setPolicyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activePhase, setActivePhase] = useState(0);
  const [allPolicies, setAllPolicies] = useState([]);
  const [comparisonIds, setComparisonIds] = useState([]);
  const [comparisonPolicies, setComparisonPolicies] = useState([]);
  const [comparisonAxis, setComparisonAxis] = useState('economic');
  const [toasts, setToasts] = useState([]);
  const [busyAction, setBusyAction] = useState('');
  const [isSavedPolicy, setIsSavedPolicy] = useState(false);

  const timerRef = useRef(null);
  const sliderRef = useRef(null);
  const reportRef = useRef(null);
  const alertedMonthsRef = useRef(new Set());

  useEffect(() => {
    // Check if this is a fallback ID first
    if (isFallbackId(id)) {
      const fallback = getFallbackPolicy(id);
      if (fallback) {
        setPolicyData(fallback);
        setAllPolicies([]);
        setLoading(false);
      } else {
        navigate('/app/policies');
      }
      return;
    }

    Promise.all([
      api.get(`/policies/${id}/simulation`),
      api.get('/policies?limit=200'),
      api.get('/users/profile').catch(() => null)
    ])
      .then(([policyRes, listRes, profileRes]) => {
        setPolicyData(policyRes.data);
        setAllPolicies((listRes.data?.policies || []).filter((p) => p._id !== id));
        const saved = profileRes?.data?.savedPolicies || [];
        setIsSavedPolicy(saved.some((p) => p._id === id));
      })
      .then(() => setLoading(false))
      .catch(() => {
        // If API fails, try fallback
        const fallback = getFallbackPolicy(id);
        if (fallback) {
          setPolicyData(fallback);
          setLoading(false);
        } else {
          navigate('/app/policies');
        }
      });
  }, [id, navigate]);

  useEffect(() => {
    if (!playing) {
      clearInterval(timerRef.current);
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setMonth((m) => {
        const max = policy?.phases?.[policy.phases.length - 1]?.monthEnd || 60;
        if (m >= max) {
          setPlaying(false);
          clearInterval(timerRef.current);
          return m;
        }
        return m + 1;
      });
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [playing, policy]);

  useEffect(() => {
    if (!policy) return;
    const ph = policy.phases?.findIndex((p) => month >= p.monthStart && month <= p.monthEnd);
    if (ph >= 0) setActivePhase(ph);
  }, [month, policy]);

  useEffect(() => {
    if (!sliderRef.current || !policy) return;
    const max = policy?.phases?.[policy.phases.length - 1]?.monthEnd || 60;
    sliderRef.current.style.setProperty('--pct', `${(month / Math.max(max, 1)) * 100}%`);
  }, [month, policy]);

  useEffect(() => {
    if (!comparisonIds.length) {
      setComparisonPolicies([]);
      return;
    }

    const ids = comparisonIds.join(',');
    api.get(`/policies?ids=${ids}&limit=10`)
      .then((res) => {
        const fetched = res.data?.policies || [];
        return Promise.all(fetched.map((p) => api.get(`/policies/${p._id}/simulation`).then((r) => ({ ...r.data, _id: p._id, title: p.title }))));
      })
      .then((withImpact) => setComparisonPolicies(withImpact))
      .catch(() => setComparisonPolicies([]));
  }, [comparisonIds]);

  useEffect(() => {
    if (!policy?.impactData?.length) return;
    const point = policy.impactData[Math.min(month, policy.impactData.length - 1)];
    const maxNegative = Math.max(...(point.negativeEffects || []).map((n) => n.value || 0), 0);

    if (maxNegative > 70 && !alertedMonthsRef.current.has(month)) {
      alertedMonthsRef.current.add(month);
      const idToast = `${Date.now()}-${month}`;
      setToasts((s) => [...s, {
        id: idToast,
        type: 'warn',
        text: `Negative effects exceeded 70% at month ${month}`
      }]);

      setTimeout(() => {
        setToasts((s) => s.filter((t) => t.id !== idToast));
      }, 3200);
    }
  }, [month, policy]);

  const addToast = (text, type = 'ok') => {
    const idToast = `${Date.now()}-${Math.random()}`;
    setToasts((s) => [...s, { id: idToast, type, text }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== idToast)), 2800);
  };

  const chartData = useMemo(() => {
    const rows = (policy?.impactData || []).map((d) => ({
      month: d.month,
      economic: d.economic,
      social: d.social,
      environmental: d.environmental
    }));

    comparisonPolicies.forEach((cp) => {
      (cp.impactData || []).forEach((d, idx) => {
        if (!rows[idx]) rows[idx] = { month: d.month };
        rows[idx][`${cp._id}-economic`] = d.economic;
        rows[idx][`${cp._id}-social`] = d.social;
        rows[idx][`${cp._id}-environmental`] = d.environmental;
      });
    });

    return rows;
  }, [policy, comparisonPolicies]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!policy) return null;

  const maxMonth = policy?.phases?.[policy.phases.length - 1]?.monthEnd || 60;
  const catColor = CAT_COLORS[policy.category] || '#f97316';
  const phaseColors = { 0: '#eab308', 1: '#22c55e', 2: '#ef4444', 3: '#3b82f6', 4: '#8b5cf6' };
  const currentPhase = policy?.phases?.[activePhase];

  const impactAt = (axis) => {
    const d = policy.impactData?.[Math.min(month, (policy.impactData?.length || 1) - 1)];
    return d ? d[axis] : 0;
  };

  const toggleBookmark = async () => {
    try {
      setBusyAction('bookmark');
      const res = await api.post(`/users/saved-policies/${id}`);
      const saved = !!res.data?.saved;
      setIsSavedPolicy(saved);
      addToast(saved ? 'Policy bookmarked' : 'Policy removed from bookmarks');
    } catch (e) {
      addToast('Could not update bookmarks', 'warn');
    } finally {
      setBusyAction('');
    }
  };

  const saveSimulationRun = async () => {
    try {
      setBusyAction('save');
      const d = policy.impactData?.[Math.min(month, (policy.impactData?.length || 1) - 1)] || {};
      const negativePeak = Math.max(...(d.negativeEffects || []).map((n) => n.value || 0), 0);
      await api.post('/users/saved-simulations', {
        policyId: id,
        month,
        snapshot: {
          economic: d.economic || 0,
          social: d.social || 0,
          environmental: d.environmental || 0,
          negativePeak
        }
      });
      addToast('Simulation run saved to profile');
    } catch (e) {
      addToast('Could not save simulation', 'warn');
    } finally {
      setBusyAction('');
    }
  };

  const exportPdf = async () => {
    try {
      if (!reportRef.current) return;
      setBusyAction('pdf');
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#0d1018', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min((pageWidth - 40) / canvas.width, (pageHeight - 80) / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;

      pdf.setFillColor(13, 16, 24);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setTextColor(232, 237, 245);
      pdf.setFontSize(14);
      pdf.text(`${policy.title} - Simulation Report`, 20, 26);
      pdf.addImage(imgData, 'PNG', 20, 40, w, h);
      pdf.save(`${policy.title.replace(/\s+/g, '_')}_report.pdf`);
      addToast('PDF report exported');
    } catch (e) {
      addToast('PDF export failed', 'warn');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="sim-page">
      <div className="sim-canvas">
        <PolicyScene3D policy={policy} month={month} activePhase={activePhase} />
      </div>

      <div className="sim-topbar">
        <button className="sim-back" onClick={() => navigate('/app/policies')}>← Back</button>
        <div className="sim-id">
          <span className="sim-icon">{policy.icon || '⬡'}</span>
          <div>
            <div className="sim-title">{policy.title}</div>
            <div className="sim-subtitle" style={{ color: catColor }}>{policy.category}</div>
          </div>
        </div>
        <div className="top-actions">
          <button className="top-btn" onClick={toggleBookmark} disabled={busyAction === 'bookmark'}>{isSavedPolicy ? '★ Saved' : '☆ Save Policy'}</button>
          <button className="top-btn" onClick={saveSimulationRun} disabled={busyAction === 'save'}>{busyAction === 'save' ? 'Saving...' : 'Save Run'}</button>
          <button className="top-btn" onClick={exportPdf} disabled={busyAction === 'pdf'}>{busyAction === 'pdf' ? 'Exporting...' : 'Export PDF'}</button>
        </div>
        <div
          className="phase-pill"
          style={{ background: `${phaseColors[activePhase]}18`, borderColor: `${phaseColors[activePhase]}40`, color: phaseColors[activePhase] }}
        >
          <span className="phase-dot" style={{ background: phaseColors[activePhase] }} />
          {currentPhase?.name}
        </div>
      </div>

      <div className="sim-left">
        <div className="sim-ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Timeline</span>
            <span className="ctrl-month">{month}<small>mo</small></span>
          </div>
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max={maxMonth}
            value={month}
            className="sim-slider"
            onChange={(e) => { setMonth(clampMonth(e.target.value, maxMonth)); setPlaying(false); }}
          />
          <div className="ctrl-btns">
            <button className={`play-btn ${playing ? 'active' : ''}`} onClick={() => { if (month >= maxMonth) setMonth(0); setPlaying(!playing); }}>
              {playing ? '■ Stop' : '▶ Simulate'}
            </button>
            <button className="reset-btn" onClick={() => { setPlaying(false); setMonth(0); alertedMonthsRef.current = new Set(); }}>↺</button>
          </div>
        </div>

        <div className="comparison-panel">
          <div className="comp-head">Policy Comparison</div>
          <p>Overlay 2 to 3 policy curves for side-by-side analysis.</p>
          <select value={comparisonAxis} onChange={(e) => setComparisonAxis(e.target.value)}>
            <option value="economic">Overlay Economic Curves</option>
            <option value="social">Overlay Social Curves</option>
            <option value="environmental">Overlay Environmental Curves</option>
          </select>
          <select
            value=""
            onChange={(e) => {
              const next = e.target.value;
              if (!next || comparisonIds.includes(next) || comparisonIds.length >= 2) return;
              setComparisonIds((s) => [...s, next]);
            }}
          >
            <option value="">Add policy...</option>
            {allPolicies.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          <div className="comp-tags">
            {comparisonPolicies.map((p) => (
              <button key={p._id} className="comp-tag" onClick={() => setComparisonIds((s) => s.filter((idItem) => idItem !== p._id))}>
                {p.icon || '⬡'} {p.title} ×
              </button>
            ))}
          </div>
        </div>

        <div className="phases-list">
          {policy.phases?.map((ph, i) => (
            <button
              key={ph.phase}
              className={`phase-item ${activePhase === i ? 'active' : ''}`}
              style={{ '--phc': phaseColors[i] }}
              onClick={() => { setMonth(ph.monthStart); setPlaying(false); }}
            >
              <div className="pi-dot" />
              <div className="pi-body">
                <div className="pi-name">{ph.name}</div>
                <div className="pi-range">Month {ph.monthStart}–{ph.monthEnd}</div>
                {activePhase === i && <div className="pi-desc">{ph.description}</div>}
              </div>
            </button>
          ))}
        </div>

        {currentPhase?.sceneDescription && (
          <div className="scene-desc">
            <div className="sd-label">What's happening in 3D</div>
            <div className="sd-text">{currentPhase.sceneDescription}</div>
          </div>
        )}
      </div>

      <div className="sim-right" ref={reportRef}>
        <div className="ir-header">Live Impact Metrics</div>

        <div className="chart-card">
          <div className="chart-title">Impact Arc Over Timeline</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(99,179,237,0.14)" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#8fa3bf" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#8fa3bf" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111520', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="economic" stroke="#f59e0b" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="social" stroke="#ec4899" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="environmental" stroke="#22c55e" dot={false} strokeWidth={2} />
                {comparisonPolicies.map((cp, idx) => (
                  <Line
                    key={`${cp._id}-line`}
                    type="monotone"
                    dataKey={`${cp._id}-${comparisonAxis}`}
                    stroke={['#60a5fa', '#f472b6'][idx % 2]}
                    dot={false}
                    strokeDasharray="6 4"
                    name={`${cp.title} (${comparisonAxis.slice(0, 3).toUpperCase()})`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="axes-section">
          {AXES.map((ax) => {
            const val = impactAt(ax.key);
            return (
              <div key={ax.key} className="axis-row">
                <div className="ax-head">
                  <span className="ax-icon">{ax.icon}</span>
                  <span className="ax-label">{ax.label}</span>
                  <span className="ax-val" style={{ color: ax.color }}>{val.toFixed(0)}</span>
                </div>
                <div className="ax-bar-bg"><div className="ax-bar" style={{ width: `${val}%`, background: ax.color }} /></div>
              </div>
            );
          })}
        </div>

        <div className="ir-divider" />

        <div className="ir-section-label" style={{ color: 'var(--green)' }}>✓ Positive Effects</div>
        {policy.positiveImpacts?.map((imp) => {
          const d = policy.impactData?.[Math.min(month, (policy.impactData?.length || 1) - 1)];
          const pos = d?.positiveEffects?.find((p) => p.label === imp.label);
          const val = pos?.value || 0;
          return (
            <div key={imp.label} className="effect-row">
              <span className="ef-icon">{imp.icon}</span>
              <div className="ef-body">
                <div className="ef-label">{imp.label}</div>
                <div className="ef-bar-bg"><div className="ef-bar" style={{ width: `${val}%`, background: '#22c55e' }} /></div>
              </div>
              <span className="ef-val" style={{ color: 'var(--green)' }}>{val}</span>
            </div>
          );
        })}

        <div className="ir-divider" />

        <div className="ir-section-label" style={{ color: 'var(--red)' }}>✗ Negative Effects</div>
        {policy.negativeImpacts?.map((imp) => {
          const d = policy.impactData?.[Math.min(month, (policy.impactData?.length || 1) - 1)];
          const neg = d?.negativeEffects?.find((n) => n.label === imp.label);
          const val = neg?.value || 0;
          return (
            <div key={imp.label} className="effect-row">
              <span className="ef-icon">{imp.icon}</span>
              <div className="ef-body">
                <div className="ef-label">{imp.label}</div>
                <div className="ef-bar-bg"><div className="ef-bar" style={{ width: `${val}%`, background: '#ef4444' }} /></div>
              </div>
              <span className="ef-val" style={{ color: 'var(--red)' }}>{val}</span>
            </div>
          );
        })}

        <div className="ir-divider" />

        <div className="net-score-row">
          <div className="ns-label">Net Policy Score</div>
          <div className="ns-val" style={{ color: policy.netScore >= 30 ? 'var(--green)' : 'var(--red)' }}>
            {policy.netScore >= 0 ? '+' : ''}{policy.netScore}<span>/100</span>
          </div>
        </div>
        <div className="ns-bar-bg">
          <div className="ns-bar" style={{ width: `${Math.abs(policy.netScore)}%`, background: policy.netScore >= 30 ? 'var(--green)' : policy.netScore >= 0 ? 'var(--yellow)' : 'var(--red)' }} />
        </div>
      </div>

      <div className="toast-stack">
        {toasts.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.text}</div>)}
      </div>
    </div>
  );
}
