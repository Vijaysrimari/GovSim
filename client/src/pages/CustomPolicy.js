import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './CustomPolicy.css';

const CATEGORIES = ['Education', 'Healthcare', 'Environment', 'Economic', 'Infrastructure', 'Social', 'Agriculture'];

const CATEGORY_SCENE = {
  Education: 'digital_classroom',
  Healthcare: 'universal_health',
  Environment: 'solar_rooftop',
  Economic: 'startup_india',
  Infrastructure: 'smart_city',
  Social: 'pension_scheme',
  Agriculture: 'e_nam'
};

function clamp(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function buildImpactData(duration, cfg) {
  const rows = [];
  for (let month = 0; month <= duration; month += 1) {
    const t = month / Math.max(duration, 1);
    const ramp = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const negativePulse = t < 0.7 ? (t / 0.7) : (1 - (t - 0.7) / 0.3);

    rows.push({
      month,
      economic: clamp(cfg.economicBase + cfg.economicPeak * ramp),
      social: clamp(cfg.socialBase + cfg.socialPeak * ramp),
      environmental: clamp(cfg.environmentalBase + cfg.environmentalPeak * ramp),
      positiveEffects: [
        { label: 'Adoption', value: clamp(cfg.adoption * ramp) },
        { label: 'Public Benefit', value: clamp(cfg.benefit * ramp) }
      ],
      negativeEffects: [
        { label: 'Operational Risk', value: clamp(cfg.risk * Math.max(0, negativePulse)) },
        { label: 'Cost Pressure', value: clamp(cfg.costPressure * Math.max(0, negativePulse)) }
      ]
    });
  }
  return rows;
}

function buildPhases(duration) {
  const quarter = Math.max(1, Math.floor(duration / 4));
  return [
    { phase: 0, name: 'Setup', monthStart: 0, monthEnd: quarter - 1, description: 'Policy setup and rollout planning', color: '#eab308' },
    { phase: 1, name: 'Positive Wave', monthStart: quarter, monthEnd: quarter * 2 - 1, description: 'Adoption accelerates and outcomes improve', color: '#22c55e' },
    { phase: 2, name: 'Negative Emergence', monthStart: quarter * 2, monthEnd: quarter * 3 - 1, description: 'Friction and side-effects emerge', color: '#ef4444' },
    { phase: 3, name: 'Equilibrium', monthStart: quarter * 3, monthEnd: duration, description: 'Controls and optimization stabilize outcomes', color: '#3b82f6' }
  ];
}

export default function CustomPolicy() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Education',
    targetPopulation: '',
    budget: '',
    duration: 48,
    economicBase: 5,
    economicPeak: 50,
    socialBase: 5,
    socialPeak: 60,
    environmentalBase: 5,
    environmentalPeak: 35,
    adoption: 80,
    benefit: 70,
    risk: 45,
    costPressure: 35
  });

  const impactPreview = useMemo(() => buildImpactData(Number(form.duration), form), [form]);

  const update = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const duration = Number(form.duration);
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        category: form.category,
        icon: '🧪',
        targetPopulation: form.targetPopulation.trim(),
        budget: form.budget.trim(),
        duration,
        sceneType: CATEGORY_SCENE[form.category] || 'default',
        phases: buildPhases(duration),
        impactData: impactPreview,
        positiveImpacts: [
          { label: 'Adoption', icon: '📈', description: 'Program uptake across target population' },
          { label: 'Public Benefit', icon: '✅', description: 'Policy benefits reaching beneficiaries' }
        ],
        negativeImpacts: [
          { label: 'Operational Risk', icon: '⚠️', description: 'Implementation and delivery risk over time' },
          { label: 'Cost Pressure', icon: '💸', description: 'Budget and procurement pressure during rollout' }
        ],
        netScore: Math.round((form.economicPeak + form.socialPeak + form.environmentalPeak - form.risk - form.costPressure) / 2),
        peakMonth: duration
      };

      const res = await api.post('/policies', payload);
      navigate(`/app/simulate/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create policy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="custom-page fade-in">
      <div className="custom-head">
        <div>
          <h1>Create <em>Custom Policy</em></h1>
          <p>This adds a new policy only. Existing seeded policies stay unchanged.</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/app/policies')}>Back to library</button>
      </div>

      <form className="custom-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            Policy Title
            <input required value={form.title} onChange={(e) => update('title', e.target.value)} />
          </label>
          <label>
            Subtitle
            <input value={form.subtitle} onChange={(e) => update('subtitle', e.target.value)} />
          </label>
          <label>
            Category
            <select value={form.category} onChange={(e) => update('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Duration (months)
            <input type="number" min="12" max="120" value={form.duration} onChange={(e) => update('duration', Number(e.target.value))} />
          </label>
          <label>
            Budget
            <input placeholder="e.g. INR 1200 Crore" value={form.budget} onChange={(e) => update('budget', e.target.value)} />
          </label>
          <label>
            Target Population
            <input placeholder="e.g. 30 million households" value={form.targetPopulation} onChange={(e) => update('targetPopulation', e.target.value)} />
          </label>
        </div>

        <label>
          Description
          <textarea rows="3" value={form.description} onChange={(e) => update('description', e.target.value)} />
        </label>

        <div className="sliders-grid">
          {[
            ['economicPeak', 'Economic Peak'],
            ['socialPeak', 'Social Peak'],
            ['environmentalPeak', 'Environmental Peak'],
            ['adoption', 'Adoption Strength'],
            ['benefit', 'Public Benefit'],
            ['risk', 'Operational Risk'],
            ['costPressure', 'Cost Pressure']
          ].map(([key, label]) => (
            <label key={key} className="range-row">
              <div>
                <span>{label}</span>
                <strong>{form[key]}</strong>
              </div>
              <input type="range" min="0" max="100" value={form[key]} onChange={(e) => update(key, Number(e.target.value))} />
            </label>
          ))}
        </div>

        <div className="preview-box">
          <div className="preview-title">Curve Preview Snapshot</div>
          <div className="preview-values">
            <div>Month 0: E {impactPreview[0]?.economic} | S {impactPreview[0]?.social} | Env {impactPreview[0]?.environmental}</div>
            <div>Midpoint: E {impactPreview[Math.floor(impactPreview.length / 2)]?.economic} | S {impactPreview[Math.floor(impactPreview.length / 2)]?.social} | Env {impactPreview[Math.floor(impactPreview.length / 2)]?.environmental}</div>
            <div>Last Month: E {impactPreview[impactPreview.length - 1]?.economic} | S {impactPreview[impactPreview.length - 1]?.social} | Env {impactPreview[impactPreview.length - 1]?.environmental}</div>
          </div>
        </div>

        {error && <div className="custom-error">{error}</div>}

        <button className="submit-btn" disabled={saving}>{saving ? 'Creating...' : 'Create Policy & Simulate'}</button>
      </form>
    </div>
  );
}
