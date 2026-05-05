import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/users/profile')
      .then((res) => setProfile(res.data))
      .catch((err) => {
        // Backend may be down; log and continue with empty profile to avoid crashes
        // eslint-disable-next-line no-console
        console.error('Profile fetch error:', err?.response || err.message || err);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const savedPolicies = profile?.savedPolicies || [];
  const savedSimulations = profile?.savedSimulations || [];

  return (
    <div className="profile-page fade-in">
      <div className="profile-head">
        <h1>Your <em>Profile</em></h1>
        <div className="profile-meta">
          <span>{profile?.user?.name}</span>
          <span>{profile?.user?.email}</span>
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <div className="pc-title">Saved Policies</div>
          {savedPolicies.length === 0 && <div className="empty-note">No bookmarked policies yet.</div>}
          {savedPolicies.map((p) => (
            <button key={p._id} className="saved-item" onClick={() => navigate(`/app/simulate/${p._id}`)}>
              <div className="si-top">
                <span>{p.icon || '⬡'}</span>
                <strong>{p.title}</strong>
              </div>
              <div className="si-sub">{p.category} • {p.duration} months</div>
            </button>
          ))}
        </section>

        <section className="profile-card">
          <div className="pc-title">Simulation History</div>
          {savedSimulations.length === 0 && <div className="empty-note">No saved simulation runs yet.</div>}
          {savedSimulations.map((run) => (
            <div key={run._id} className="history-item">
              <div className="hi-line">
                <strong>{run.policyId?.icon} {run.policyId?.title || 'Policy'}</strong>
                <span>Month {run.month}</span>
              </div>
              <div className="hi-sub">
                E {run.snapshot?.economic ?? '-'} • S {run.snapshot?.social ?? '-'} • Env {run.snapshot?.environmental ?? '-'}
              </div>
              <div className="hi-time">{new Date(run.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
