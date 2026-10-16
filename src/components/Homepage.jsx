import './Homepage.css';

export default function Homepage({ onGetStarted, onSignIn, onContinueAsGuest }) {
  return (
    <div className="hp-container">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="hp-nav">
        <div className="hp-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="hp-logo-mark">K</div>
          <span className="hp-brand-name">KEYSTONE</span>
        </div>

        <div className="hp-nav-links">
          <button type="button" className="hp-nav-signin" onClick={onSignIn}>
            Sign In
          </button>
          <button type="button" className="hp-nav-cta" onClick={onGetStarted}>
            Get Started
          </button>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <main className="hp-hero">
        <div className="hp-tagline-badge">
          <span>●</span>
          <span>VIRTUAL FACTORY PLANNER & 3D DIGITAL TWIN</span>
        </div>

        <h1 className="hp-headline">
          Build your factory before you build it.
        </h1>

        <p className="hp-subtext">
          Plan your production line, explore equipment, estimate costs, and discover potential bottlenecks before investing in the real world.
        </p>

        <div className="hp-cta-group">
          <button type="button" className="hp-primary-cta" onClick={onGetStarted}>
            <span>Get Started</span>
            <span style={{ fontSize: 16 }}>→</span>
          </button>

          <button type="button" className="hp-guest-link" onClick={onContinueAsGuest}>
            Or explore immediately as guest (Demo)
          </button>
        </div>

        {/* ── Visual Showcase Preview ───────────────────────────────── */}
        <div className="hp-showcase-container">
          <div className="hp-showcase-topbar">
            <div className="hp-showcase-dots">
              <div className="hp-dot" />
              <div className="hp-dot" />
              <div className="hp-dot" />
            </div>
            <span className="hp-showcase-title">KEYSTONE VIRTUAL PLANT CORRIDOR</span>
            <span style={{ fontSize: 10, color: 'var(--accent-orange)' }}>● LIVE TWIN</span>
          </div>

          <div className="hp-showcase-body">
            {/* Left Mock Pane: Conversational Planner */}
            <div className="hp-showcase-pane-left">
              <div className="hp-mock-msg-ai">
                <strong>KEYSTONE Copilot:</strong> What are you planning to manufacture?
              </div>
              <div className="hp-mock-msg-user">
                We need a sequential line for EV battery enclosure trays at 5,000 units/month.
              </div>
              <div className="hp-mock-msg-ai">
                Configured 4-station layout: Cutting (120 u/min) → Welding (95 u/min) → Assembly (110 u/min) → Inspection (130 u/min). Standby redundancy active on welding bottleneck.
              </div>
            </div>

            {/* Right Mock Pane: Sequential Line Overview */}
            <div className="hp-showcase-pane-right">
              <div className="hp-mock-station-pill">
                <span>01. Cutting Station</span>
                <span className="hp-station-status-good">120 u/min · Active</span>
              </div>
              <div className="hp-mock-station-pill">
                <span>02. Welding Station</span>
                <span className="hp-station-status-bottle">95 u/min · Bottleneck</span>
              </div>
              <div className="hp-mock-station-pill">
                <span>03. Assembly Station</span>
                <span className="hp-station-status-good">110 u/min · Active</span>
              </div>
              <div className="hp-mock-station-pill">
                <span>04. Inspection Station</span>
                <span className="hp-station-status-good">130 u/min · Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3 Value Pillars ────────────────────────────────────────── */}
        <section className="hp-pillars">
          <div className="hp-pillar-card">
            <div className="hp-pillar-icon">💬</div>
            <h3 className="hp-pillar-title">Conversational Planning</h3>
            <p className="hp-pillar-desc">
              Describe your production target in plain language. Keystone automatically structures the machine stages and calculates required line rates.
            </p>
          </div>

          <div className="hp-pillar-card">
            <div className="hp-pillar-icon">⚙</div>
            <h3 className="hp-pillar-title">Equipment Catalogue</h3>
            <p className="hp-pillar-desc">
              Browse realistic industrial machinery with indicative INR pricing and technical specifications to budget capital expenditure with confidence.
            </p>
          </div>

          <div className="hp-pillar-card">
            <div className="hp-pillar-icon">🧊</div>
            <h3 className="hp-pillar-title">3D Bottleneck Simulation</h3>
            <p className="hp-pillar-desc">
              Test failure scenarios and verify standby backup redundancy in an interactive 3D digital twin before ordering hardware.
            </p>
          </div>
        </section>
      </main>

      {/* ── Clean Footer ─────────────────────────────────────────────── */}
      <footer className="hp-footer">
        <div>© KEYSTONE Industrial Simulation Suite. All rights reserved.</div>
        <div>Built for Modern Factory Planners</div>
      </footer>
    </div>
  );
}
