import { useState } from 'react';
import './AuthScreen.css';

const DEFAULT_DISPLAY_NAME = 'Demo Engineer';

const ROLE_PRESETS = [
  'Demo Engineer',
  'Lead Process Planner',
  'Plant Operations Specialist',
  'Hackathon Evaluator',
];

export default function AuthScreen({ onAuthenticate, initialName = DEFAULT_DISPLAY_NAME }) {
  const [displayName, setDisplayName] = useState(initialName || DEFAULT_DISPLAY_NAME);

  const effectiveName = displayName.trim() || DEFAULT_DISPLAY_NAME;

  // Generate 2-letter avatar initials from the display name
  const initials = effectiveName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || 'DE';

  const handleEnterWorkspace = () => {
    onAuthenticate({
      isDemo: true,
      user: {
        id: `demo_${Date.now()}`,
        name: effectiveName,
        role: 'Virtual Factory Planner',
        facility: 'Pilot Plant Alpha (Demo Corridor)',
        isTemporary: true,
      },
    });
  };

  return (
    <div className="auth-viewport-wrapper">
      <div className="auth-card">
        {/* Top CAD/CAM Industrial Titlebar */}
        <div className="auth-card-topbar">
          <div className="auth-brand">
            <div className="auth-logo-mark">K</div>
            <div className="auth-title">KEYSTONE</div>
          </div>
          <div className="auth-build-tag">DEMO WORKSPACE · HACKATHON BUILD</div>
        </div>

        {/* Card Body */}
        <div className="auth-card-body">
          {/* Welcome & System Description */}
          <div className="auth-welcome-block">
            <h1 className="auth-headline">Virtual Factory Planning & Simulation</h1>
            <p className="auth-subhead">
              Autonomous line configuration, deterministic bottleneck analysis, and real-time 3D digital twin verification across 4 sequential machine stations (Cutting → Welding → Assembly → Inspection).
            </p>
          </div>

          {/* Demo Identity & Workspace Profile Card */}
          <div className="demo-identity-box">
            <div className="demo-status-pill">
              <span>●</span>
              <span>TEMPORARY DEMO SESSION · NO ACCOUNT REQUIRED</span>
            </div>

            <div className="demo-profile-header">
              <div className="demo-avatar" aria-label={`Avatar for ${effectiveName}`}>
                {initials}
              </div>
              <div className="demo-profile-meta">
                <span className="demo-profile-name-display">{effectiveName}</span>
                <span className="demo-profile-role-display">
                  Virtual Line Planner · Pilot Plant Alpha
                </span>
              </div>
            </div>

            {/* Display Name Customization Field */}
            <div className="demo-name-field">
              <label className="demo-field-label" htmlFor="demo-name-input">
                <span>Engineer Display Name</span>
                <span className="demo-field-helper">Optional: customize for this demo</span>
              </label>

              <div className="demo-input-wrapper">
                <input
                  id="demo-name-input"
                  className="demo-name-input"
                  type="text"
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter custom display name…"
                  autoComplete="off"
                />
              </div>

              {/* Role Preset Quick-Picks */}
              <div className="demo-preset-group" role="group" aria-label="Quick preset titles">
                {ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`demo-preset-btn ${effectiveName === preset ? 'active' : ''}`}
                    onClick={() => setDisplayName(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* High-Impact Primary Entry Button */}
          <button
            type="button"
            className="enter-workspace-btn"
            onClick={handleEnterWorkspace}
            title="Open conversational factory planner directly"
          >
            <span>▶ ENTER MY WORKSPACE</span>
            <span className="enter-workspace-subtext">
              Launch Chat-First Factory Planner as {effectiveName}
            </span>
          </button>

          {/* Feature Highlights Grid */}
          <div className="demo-feature-strip">
            <div className="demo-feature-item">
              <span className="demo-feature-icon">💬</span>
              <span>Conversational Line Planner</span>
            </div>
            <div className="demo-feature-item">
              <span className="demo-feature-icon">⚙</span>
              <span>INR Equipment Catalogue</span>
            </div>
            <div className="demo-feature-item">
              <span className="demo-feature-icon">🧊</span>
              <span>Interactive 3D Factory Twin</span>
            </div>
            <div className="demo-feature-item">
              <span className="demo-feature-icon">🛡</span>
              <span>Failure & Standby Engine</span>
            </div>
          </div>

          {/* Honest Transparency Notice */}
          <div className="demo-notice-box">
            ℹ EVALUATION ENVIRONMENT: You are entering an interactive demonstration workspace. All factory configuration, failure scenario permutation, and 3D simulation run client-side and via the connected FastAPI engine. No real account registration or credentials are required.
          </div>
        </div>

        {/* CAD/CAM Engineering Footer */}
        <div className="auth-footer">
          <span>KEYSTONE WORKSPACE v4.1</span>
          <span>4-STATION DETERMINISTIC DIGITAL TWIN</span>
        </div>
      </div>
    </div>
  );
}
