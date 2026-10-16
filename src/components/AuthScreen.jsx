import { useState } from 'react';
import './AuthScreen.css';

export default function AuthScreen({ onAuthenticate, onBackToHome }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [authNotice, setAuthNotice] = useState(null);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Please enter your corporate email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Please enter your password';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Honest communication: External cloud auth provider (Supabase / Firebase) is not configured in this demo build
    setAuthNotice(
      'Cloud authentication is pending configuration for this evaluation build. Please use the "Continue as guest" option below to immediately test the full factory planner.'
    );
  };

  const handleGuestEntry = () => {
    onAuthenticate({
      isGuest: true,
      user: {
        id: `guest_${Date.now()}`,
        name: 'Demo Engineer',
        role: 'Virtual Factory Planner',
        facility: 'Pilot Plant Alpha',
      },
    });
  };

  return (
    <div className="auth-viewport-wrapper">
      <div className="auth-card">
        {/* Top Navbar Cluster */}
        <div className="auth-card-topbar">
          <button type="button" className="auth-back-link" onClick={onBackToHome}>
            <span>←</span>
            <span>Back to Keystone</span>
          </button>

          <div className="auth-brand">
            <div className="auth-logo-mark">K</div>
            <span className="auth-title">KEYSTONE</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="auth-card-body">
          <div className="auth-welcome-block">
            <h2 className="auth-headline">
              {mode === 'signin' ? 'Sign in to Keystone' : 'Create your account'}
            </h2>
            <p className="auth-subhead">
              {mode === 'signin'
                ? 'Access your factory planning sessions and 3D digital twins.'
                : 'Start designing and simulating production lines in minutes.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="auth-mode-tabs" role="tablist">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setMode('signin');
                setErrors({});
                setAuthNotice(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setErrors({});
                setAuthNotice(null);
              }}
            >
              Create Account
            </button>
          </div>

          {/* Email / Password Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email-input">
                <span>Corporate Email</span>
                {errors.email && <span className="auth-field-error">{errors.email}</span>}
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="auth-email-input"
                  className={`auth-input ${errors.email ? 'has-error' : ''}`}
                  type="email"
                  placeholder="engineer@plant.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password-input">
                <span>Password</span>
                {errors.password && <span className="auth-field-error">{errors.password}</span>}
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="auth-password-input"
                  className={`auth-input ${errors.password ? 'has-error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {authNotice && (
              <div className="auth-feedback-alert">
                {authNotice}
              </div>
            )}

            <button type="submit" className="auth-submit-btn">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Subtle Guest Option for Demo */}
          <div className="auth-guest-section">
            <button type="button" className="auth-guest-btn" onClick={handleGuestEntry}>
              Continue as guest →
            </button>
            <span className="auth-guest-note">
              Instant evaluation session for hackathon demo · No registration required
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
