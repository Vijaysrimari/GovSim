import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const STATS = [
  { val: '35', label: 'Policy Simulations', unit: '+' },
  { val: '7', label: 'Policy Categories', unit: '' },
  { val: '120', label: 'Month Projections', unit: '' },
  { val: '3D', label: 'Story-driven Models', unit: '' },
];

const FEATURED = [
  { icon: 'wifi', title: 'Free WiFi for Schools', cat: 'Education', desc: 'Watch WiFi signals activate, students connect, and see both positive learning gains and negative distraction effects unfold.' },
  { icon: 'bolt', title: 'EV Mission', cat: 'Environment', desc: 'Electric vehicles flood city roads, charging pods activate, air quality rises — then battery waste crisis emerges.' },
  { icon: 'rocket', title: 'Startup India', cat: 'Economic', desc: 'Incubators bloom, unicorns rise, investor winter hits — see the full boom-bust-stable arc of entrepreneurship policy.' },
];

const Icon = ({ name }) => {
  switch (name) {
    case 'wifi':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M2 8.5C6 5 12 5 18 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4.5 11C7 9 11 9 14.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7.5 14C9 13 11 13 12.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="18" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'bolt':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M13 2L3 14h7l-1 8L21 10h-7l-1-8z" fill="currentColor" />
        </svg>
      );
    case 'rocket':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M14.5 3c-1.6 0-3.2.6-4.4 1.8L4 11.9c-.6.6-.9 1.4-.8 2.1l.7 5.2 5.2.7c.7.1 1.5-.2 2.1-.8L19.2 13c1.2-1.2 1.8-2.8 1.8-4.4 0-2.9-2.4-5.3-5.3-5.3z" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Animated background */}
      <div className="landing-bg">
        <div className="bg-orb orb1" />
        <div className="bg-orb orb2" />
        <div className="bg-orb orb3" />
        <div className="grid-overlay" />
      </div>

      <nav className="landing-nav">
        <div className="nav-brand">
          <span className="nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>GovSim</span>
        </div>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="badge-dot" />
              <span>3D Policy Intelligence Platform</span>
            </div>
            <h1 className="hero-title">
              See How Government<br />
              <em>Policies Actually Work</em>
            </h1>
            <p className="hero-sub">
              35 real Indian policies. Story-driven 3D simulations that reveal
              deployment, benefits and trade-offs month by month — designed for
              research, teaching and policy prototyping.
            </p>
            <div className="hero-actions">
              <button className="btn-primary btn-lg" onClick={() => navigate('/register')}>
                Start Simulating
              </button>
              <button className="btn-ghost btn-lg" onClick={() => navigate('/login')}>
                Sign In
              </button>
            </div>

            <div className="stats-row">
              {STATS.map(s => (
                <div key={s.label} className="stat-item">
                  <div className="stat-val">{s.val}<span>{s.unit}</span></div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="hero-visual" aria-hidden>
            <div className="mini-feature-grid">
              {FEATURED.map(f => (
                <div key={f.title} className="mini-card">
                  <div className="mini-icon"><Icon name={f.icon} /></div>
                  <div className="mini-title">{f.title}</div>
                  <div className="mini-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="about-section">
        <div className="section-label">About GovSim</div>
        <h2 className="about-title">A lightweight policy simulation lab</h2>
        <p className="about-desc">
          GovSim is a compact research platform that lets analysts, students and
          policymakers explore the long-term effects of real government policies
          through story-driven 3D simulations. Each policy is represented as a
          deployable program in a simulated city — infrastructure, services,
          budgets and social reactions are modeled over months and years so
          you can inspect benefits, trade-offs and unintended consequences.
        </p>
        <p className="about-desc">
          The project ships with seeded, editable policies and an offline
          developer mode so you can run, bookmark and share simulations even
          when a database is not available. Use GovSim to prototype policy
          reforms, teach systems thinking, or validate impact assumptions.
        </p>
      </section>

      <section className="featured-section">
        <div className="section-label">Featured Simulations</div>
        <div className="featured-grid">
          {FEATURED.map(f => (
            <div key={f.title} className="featured-card">
              <div className="card-icon"><Icon name={f.icon} /></div>
              <div className="card-cat">{f.cat}</div>
              <div className="card-title">{f.title}</div>
              <div className="card-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="how-section">
        <div className="how-left">
          <div className="section-label">How It Works</div>
          <div className="how-intro">A simple, repeatable process — choose, run, monitor and adapt.</div>
        </div>

        <div className="how-right">
          <div className="steps-row">
            {[
              { n: '01', t: 'Choose a Policy', d: 'Browse 35 real government policies across 7 categories', icon: 'search' },
              { n: '02', t: 'Run Simulation', d: 'Watch the 3D story-driven model show how the policy deploys', icon: 'play' },
              { n: '03', t: 'Track Impact', d: 'See positive AND negative effects emerge over 36–96 months', icon: 'chart' },
              { n: '04', t: 'Analyse Equilibrium', d: 'Understand the net outcome and policy corrections needed', icon: 'settings' },
            ].map((s, idx) => (
              <div key={s.n} className="step-card">
                <div className="step-meta">
                  <div className="step-num">{s.n}</div>
                  <div className="step-icon">
                    {s.icon === 'search' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {s.icon === 'play' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M5 3v18l15-9L5 3z" fill="currentColor" />
                      </svg>
                    )}
                    {s.icon === 'chart' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7 13v-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 17v-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 9v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {s.icon === 'settings' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19.4 15a1.8 1.8 0 0 0 .34 1.94l.06.06a1 1 0 0 1-1.42 1.42l-.06-.06a1.8 1.8 0 0 0-1.94-.34 1.8 1.8 0 0 0-.94 1.64V20a1 1 0 0 1-2 0v-.39c0-.73-.5-1.38-1.2-1.6a1.8 1.8 0 0 0-1.64.34l-.06.06a1 1 0 0 1-1.42-1.42l.06-.06a1.8 1.8 0 0 0 .34-1.94 1.8 1.8 0 0 0-1.64-.94H4a1 1 0 0 1 0-2h.39c.73 0 1.38-.5 1.6-1.2a1.8 1.8 0 0 0-.34-1.64l-.06-.06A1 1 0 0 1 6.7 6.1l.06.06c.47.47 1.12.72 1.79.72.4 0 .78-.09 1.13-.25.58-.27 1.02-.77 1.22-1.38L11 4a1 1 0 0 1 2 0l.08.35c.2.61.64 1.11 1.22 1.38.35.16.73.25 1.13.25.67 0 1.32-.25 1.79-.72l.06-.06a1 1 0 0 1 1.42 1.42l-.06.06c-.47.47-.72 1.12-.72 1.79 0 .4.09.78.25 1.13.27.58.77 1.02 1.38 1.22L20 11a1 1 0 0 1 0 2h-.35c-.61.2-1.11.64-1.38 1.22-.16.35-.25.73-.25 1.13 0 .67.25 1.32.72 1.79l.06.06a1 1 0 0 1-1.42 1.42l-.06-.06c-.47-.47-1.12-.72-1.79-.72-.4 0-.78.09-1.13.25-.58.27-1.02.77-1.22 1.38L13 20a1 1 0 0 1-2 0l-.08-.35c-.2-.61-.64-1.11-1.22-1.38-.35-.16-.73-.25-1.13-.25-.67 0-1.32.25-1.79.72l-.06.06A1 1 0 0 1 4.1 18.3l.06-.06c.47-.47 1.12-.72 1.79-.72.4 0 .78.09 1.13.25.58.27 1.02.77 1.22 1.38L11 20l1 .5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="brand-text">GovSim</span>
            </div>
            <div className="footer-text">Policy Intelligence · Built for analysts, researchers and policymakers</div>
          </div>

          <div className="footer-col about-col">
            <div className="footer-heading">About</div>
            <div className="footer-desc">GovSim models real-world policy deployments in a compact 3D environment so teams can explore impact, trade-offs and long-term outcomes without heavy infrastructure.</div>
          </div>

          <div className="footer-col links-col">
            <div className="footer-heading">Resources</div>
            <ul className="footer-links">
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Policy Library</a></li>
              <li><a href="#">Simulation Gallery</a></li>
            </ul>
          </div>

          <div className="footer-col contact-col">
            <div className="footer-heading">Contact</div>
            <div className="footer-desc">hello@govsim.in</div>
            <div className="footer-desc">Follow us: <a href="https://www.linkedin.com/in/vijaysrimari-s-5460a2315/" target="_blank" rel="noopener noreferrer">LinkedIn</a> · <a href="https://github.com/Vijaysrimari" target="_blank" rel="noopener noreferrer">GitHub</a></div>
          </div>
        </div>

        <div className="footer-bottom">© 2026 GovSim — Built for research, teaching and policy design</div>
      </footer>
    </div>
  );
}
