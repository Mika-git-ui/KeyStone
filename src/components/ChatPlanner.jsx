import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MACHINE_CATALOGUE,
  DEFAULT_CATALOGUE_SELECTIONS,
  getMachinesByCategory,
  calculateTotalEstimate,
  formatInrCurrency,
} from '../data/machineCatalogue';
import './ChatPlanner.css';

// Suggestion options for quick entry
const PRODUCT_SUGGESTIONS = [
  'EV Battery Enclosure Trays',
  'Precision Sheet-Metal Brackets',
  'Industrial Heavy Conveyor Frames',
  'Custom Hydraulic Valve Manifolds',
];

const VOLUME_SUGGESTIONS = [
  '5,000 units / month (Single shift)',
  '12,000 units / month (Two shifts)',
  '25,000 units / month (High volume)',
];

const BUDGET_SUGGESTIONS = [
  '₹60 Lakhs – ₹90 Lakhs',
  '₹1.0 Crore – ₹1.5 Crores',
  '₹2.0+ Crores (Turnkey line)',
];

const REDUNDANCY_SUGGESTIONS = [
  'Enable Standby Redundancy for High-Risk Stations',
  'Standard Single-Line Configuration (No Standby)',
];

export default function ChatPlanner({
  user,
  existingPlan,
  onSimulateFactory,
  onQuickJumpToFactory,
  onSwitchProfile,
}) {
  const [messages, setMessages] = useState(() => {
    if (existingPlan?.messages && existingPlan.messages.length > 0) {
      return existingPlan.messages;
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Welcome to KEYSTONE Factory Planner. I am your autonomous line engineering copilot. We will configure your 4-station sequential manufacturing line (Cutting → Welding → Assembly → Inspection) and evaluate bottleneck resilience in the 3D twin.\n\nTo begin, what product or component line are you planning to manufacture?`,
        step: 'product',
        suggestions: PRODUCT_SUGGESTIONS,
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(existingPlan?.step || 'product'); // product | volume | budget | redundancy | catalogue | review
  const [productType, setProductType] = useState(existingPlan?.productType || '');
  const [targetVolume, setTargetVolume] = useState(existingPlan?.targetVolume || '');
  const [targetBudget, setTargetBudget] = useState(existingPlan?.targetBudget || '');
  const [redundancyPreference, setRedundancyPreference] = useState(
    existingPlan?.redundancyPreference || ''
  );
  const [selections, setSelections] = useState(
    existingPlan?.selections || DEFAULT_CATALOGUE_SELECTIONS
  );

  const streamEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  // Handle changing a machine option
  const handleSelectMachine = useCallback((category, machineId) => {
    setSelections((prev) => ({
      ...prev,
      [category]: machineId,
    }));
  }, []);

  // Dispatch an assistant response with realistic typing delay
  const replyWithDelay = (text, nextStep, extraProps = {}) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text,
          step: nextStep,
          ...extraProps,
        },
      ]);
      setStep(nextStep);
    }, 650);
  };

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Sequential scripted conversation state machine
    if (step === 'product') {
      setProductType(text);
      replyWithDelay(
        `Production target identified: **${text}**.\n\nNext, what is your planned **output volume and production period**? (e.g. 10,000 units/month on two 8-hour shifts, or target units per hour)`,
        'volume',
        { suggestions: VOLUME_SUGGESTIONS }
      );
    } else if (step === 'volume') {
      setTargetVolume(text);
      replyWithDelay(
        `Target throughput set to **${text}**.\n\nWhat is your estimated **machinery capital expenditure (CapEx) budget** in Indian Rupees (INR)? This helps evaluate suitable automation grades across the 4 stages.`,
        'budget',
        { suggestions: BUDGET_SUGGESTIONS }
      );
    } else if (step === 'budget') {
      setTargetBudget(text);
      replyWithDelay(
        `CapEx envelope noted: **${text}**.\n\nIn our sequential 4-station architecture (Cutting → Welding → Assembly → Inspection), any unmitigated station failure causes downstream starvation.\n\nDo you want to plan for **redundant standby backups** on critical bottlenecks (such as automated cutting or welding stations)?`,
        'redundancy',
        { suggestions: REDUNDANCY_SUGGESTIONS }
      );
    } else if (step === 'redundancy') {
      const isRedundant = !text.toLowerCase().includes('no standby');
      setRedundancyPreference(isRedundant ? 'Standby redundancy enabled' : 'Single line (No standby)');

      replyWithDelay(
        `Configuration requirements compiled for **${productType || 'Industrial Workpiece'}**.\n\n` +
          `Below is our recommended 4-station equipment line based on your budget (**${targetBudget || text}**) and target rate (**${targetVolume || '5,000 units/month'}**).\n\n` +
          `You can compare machine specifications and indicative pricing in INR directly below, and customize selections for each station:`,
        'catalogue',
        { showCatalogue: true }
      );
    } else if (step === 'catalogue' || step === 'review') {
      // General feedback or updates from user
      replyWithDelay(
        `Update noted: "${text}". Your equipment line setup is summarized below with live indicative totals. When you are ready, launch the **Simulate Factory in 3D** twin to test bottleneck behavior and run failure stress testing.`,
        'review',
        { showReview: true }
      );
    }
  };

  const handleConfirmSelections = () => {
    replyWithDelay(
      `Your factory configuration is locked and verified against the 4-station sequential model.\n\n` +
        `Ready to transition into the **3D Interactive Digital Twin** to inspect machine geometry, test simulated breakdowns, and evaluate mitigations:`,
      'review',
      { showReview: true }
    );
  };

  const handleStartSimulation = () => {
    const planContext = {
      productType: productType || 'Custom Assembly Line',
      targetVolume: targetVolume || '5,000 units/month',
      targetBudget: targetBudget || '₹1.0 Crore',
      redundancyPreference: redundancyPreference || 'Standby redundancy ready',
      selections,
      totalEstimateInr: formatInrCurrency(calculateTotalEstimate(selections)),
      step,
      messages,
    };
    onSimulateFactory(planContext);
  };

  const handleResetSession = () => {
    if (window.confirm('Start a new factory planning session? Current conversation will be reset.')) {
      setProductType('');
      setTargetVolume('');
      setTargetBudget('');
      setRedundancyPreference('');
      setSelections(DEFAULT_CATALOGUE_SELECTIONS);
      setStep('product');
      setMessages([
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Starting new planning session. What industrial product or component line are you planning to manufacture?`,
          step: 'product',
          suggestions: PRODUCT_SUGGESTIONS,
        },
      ]);
    }
  };

  const totalEstimate = calculateTotalEstimate(selections);

  return (
    <div className="chat-container">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <header className="chat-header">
        <div className="chat-header-left">
          <div className="chat-logo-cluster">
            <div className="chat-logo-mark">K</div>
            <span className="chat-header-title">KEYSTONE</span>
          </div>
          <span className="chat-badge-copilot">AI FACTORY PLANNER</span>
        </div>

        <div className="chat-header-right">
          <div
            className="chat-user-chip"
            title="Temporary demo session · Click to customize profile"
            onClick={onSwitchProfile}
            style={{ cursor: onSwitchProfile ? 'pointer' : 'default' }}
          >
            <span className="chat-user-dot" />
            <span>{user?.name || 'Demo Engineer'}</span>
          </div>

          {onSwitchProfile && (
            <button
              className="chat-header-btn"
              onClick={onSwitchProfile}
              title="Customize demo display name"
            >
              ✎ Profile
            </button>
          )}

          <button
            className="chat-header-btn"
            onClick={handleResetSession}
            title="Clear conversation and begin a new factory plan"
          >
            ↻ New Plan
          </button>

          <button
            className="chat-header-btn primary"
            onClick={onQuickJumpToFactory}
            title="Inspect 3D factory workbench directly"
          >
            3D Factory Twin →
          </button>
        </div>
      </header>

      {/* ── Conversation Stream ───────────────────────────────────── */}
      <main className="chat-stream-wrapper">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg ${msg.sender}`}>
            <div className="chat-avatar">
              {msg.sender === 'assistant' ? 'AI' : 'ENG'}
            </div>

            <div className="chat-bubble-container">
              <div className="chat-sender-label">
                <span>{msg.sender === 'assistant' ? 'KEYSTONE COPILOT' : user?.name || 'PLANNER'}</span>
                <span>{msg.timestamp}</span>
              </div>

              <div className="chat-bubble">
                {msg.text.split('\n\n').map((paragraph, idx) => (
                  <p
                    key={idx}
                    dangerouslySetInnerHTML={{
                      __html: paragraph.replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong>$1</strong>'
                      ),
                    }}
                  />
                ))}

                {/* Inline Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="chat-suggestions">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        className="chat-chip-btn"
                        onClick={() => handleSendMessage(suggestion)}
                        disabled={isTyping}
                      >
                        <span>›</span>
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Inline Machine Catalogue Cards */}
                {msg.showCatalogue && (
                  <div>
                    {['cutting', 'welding', 'assembly', 'inspection'].map((category) => {
                      const machines = getMachinesByCategory(category);
                      const selectedMachineId = selections[category];
                      const categoryTitles = {
                        cutting: 'Stage 1: Cutting Station (Primary & Redundancy)',
                        welding: 'Stage 2: Arc / Robotic Welding Station',
                        assembly: 'Stage 3: Automated Fastening & Assembly',
                        inspection: 'Stage 4: Optical & CMM Metrology',
                      };

                      return (
                        <div key={category} className="catalogue-station-section">
                          <div className="catalogue-station-header">
                            <span className="catalogue-station-title">
                              <span>●</span>
                              <span>{categoryTitles[category]}</span>
                            </span>
                            <span className="catalogue-station-status">
                              Selected: {machines.find((m) => m.id === selectedMachineId)?.name}
                            </span>
                          </div>

                          <div className="catalogue-cards-grid">
                            {machines.map((machine) => {
                              const isSelected = selectedMachineId === machine.id;
                              return (
                                <div
                                  key={machine.id}
                                  className={`machine-option-card ${isSelected ? 'selected' : ''}`}
                                  onClick={() => handleSelectMachine(category, machine.id)}
                                >
                                  <div>
                                    <div className="machine-card-head">
                                      <span className="machine-card-name">{machine.name}</span>
                                      <span className="machine-card-badge">{machine.badge}</span>
                                    </div>

                                    <div className="machine-card-pricing">
                                      <span className="machine-price-inr">{machine.priceInr}</span>
                                      <span className="machine-price-type">
                                        ({machine.verificationLabel})
                                      </span>
                                    </div>

                                    <div className="machine-specs-list">
                                      {Object.entries(machine.specs).map(([k, v]) => (
                                        <div key={k} className="machine-spec-row">
                                          <span className="machine-spec-key">{k}:</span>
                                          <span className="machine-spec-val">{v}</span>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="machine-card-notes">
                                      * {machine.notes}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    className="machine-select-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectMachine(category, machine.id);
                                    }}
                                  >
                                    {isSelected ? '✓ SELECTED FOR LINE' : 'SELECT MACHINE'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="chat-header-btn primary"
                        style={{ padding: '9px 18px', fontSize: 11.5 }}
                        onClick={handleConfirmSelections}
                      >
                        ✓ Confirm Machinery Selections & Review Plan
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Plan Review & Simulate Factory CTA */}
                {msg.showReview && (
                  <div className="plan-summary-box">
                    <div className="plan-summary-header">
                      <span className="plan-summary-title">Executive Plan Summary</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--status-healthy)' }}>
                        TOTAL ESTIMATE: {formatInrCurrency(totalEstimate)}
                      </span>
                    </div>

                    <div className="plan-summary-grid">
                      <div className="plan-summary-stat">
                        <span className="plan-stat-label">Product Program</span>
                        <span className="plan-stat-value">{productType || 'EV Battery Enclosures'}</span>
                      </div>
                      <div className="plan-summary-stat">
                        <span className="plan-stat-label">Target Volume</span>
                        <span className="plan-stat-value">{targetVolume || '5,000 units/mo'}</span>
                      </div>
                      <div className="plan-summary-stat">
                        <span className="plan-stat-label">CapEx Range</span>
                        <span className="plan-stat-value">{targetBudget || '₹1.0 - ₹1.5 Cr'}</span>
                      </div>
                      <div className="plan-summary-stat">
                        <span className="plan-stat-label">Redundancy Status</span>
                        <span className="plan-stat-value">{redundancyPreference || 'Armed on critical'}</span>
                      </div>
                    </div>

                    {/* Machine selections list */}
                    <div className="plan-equipment-summary">
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)' }}>
                        SELECTED MACHINERY LINE (4 STATIONS):
                      </div>
                      {['cutting', 'welding', 'assembly', 'inspection'].map((cat) => {
                        const m = MACHINE_CATALOGUE.find((x) => x.id === selections[cat]);
                        return (
                          <div key={cat} className="plan-station-row">
                            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', width: 90 }}>
                              {cat}:
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                              {m?.name || 'Selected Unit'}
                            </span>
                            <span style={{ color: 'var(--status-healthy)', fontWeight: 600 }}>
                              {m?.priceInr}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Simulation Link Disclaimer */}
                    <div className="plan-disclaimer-alert">
                      ℹ SIMULATION ENGINE NOTICE: In the 3D twin, line throughput uses the deterministic
                      calibrated model (Cutting: 120 u/min, Welding: 95 u/min bottleneck, Assembly: 110 u/min,
                      Inspection: 130 u/min). Your selected catalogue units are mapped as the active planning
                      specification.
                    </div>

                    {/* Big Simulate Factory Action */}
                    <div className="plan-action-container">
                      <button
                        type="button"
                        className="simulate-factory-cta"
                        onClick={handleStartSimulation}
                      >
                        <span>▶ SIMULATE FACTORY IN 3D TWIN</span>
                        <span style={{ fontSize: 10, opacity: 0.85 }}>
                          (Inspect Geometry · Inject Faults · Verify Mitigations)
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Live Typing Feedback */}
        {isTyping && (
          <div className="chat-msg assistant">
            <div className="chat-avatar">AI</div>
            <div className="chat-bubble-container">
              <div className="chat-sender-label">
                <span>KEYSTONE COPILOT</span>
                <span>Calculating response…</span>
              </div>
              <div className="chat-bubble" style={{ padding: '10px 14px' }}>
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={streamEndRef} />
      </main>

      {/* ── Bottom Input Bar ──────────────────────────────────────── */}
      <footer className="chat-input-bar">
        <form
          className="chat-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            ref={inputRef}
            className="chat-text-input"
            type="text"
            placeholder={
              step === 'product'
                ? 'Type your product or manufacturing requirement…'
                : step === 'volume'
                ? 'Enter target units per month or units per hour…'
                : step === 'budget'
                ? 'Enter machinery CapEx budget in INR…'
                : 'Message Keystone AI Copilot…'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!inputText.trim() || isTyping}
          >
            Send ↵
          </button>
        </form>
        <div className="chat-input-helper">
          Press Enter to send · Keystone Deterministic Factory Planning Engine
        </div>
      </footer>
    </div>
  );
}
