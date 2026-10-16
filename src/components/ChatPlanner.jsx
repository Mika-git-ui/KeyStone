import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MACHINE_CATALOGUE,
  DEFAULT_CATALOGUE_SELECTIONS,
  getMachinesByCategory,
  calculateTotalEstimate,
  formatInrCurrency,
} from '../data/machineCatalogue';
import './ChatPlanner.css';

// Friendly suggestion chips for factory owners and planners
const STARTER_SUGGESTION_CHIPS = [
  {
    title: 'Plan a sheet-metal production line',
    subtitle: 'Precision laser cutting & automated welding',
    prompt: 'I want to plan a sheet-metal bracket production line for 10,000 units per month.',
  },
  {
    title: 'Explore machinery costs',
    subtitle: 'Compare equipment specs & indicative INR pricing',
    prompt: 'What are the machinery costs and specs for a complete 4-station assembly line?',
  },
  {
    title: 'Set up an EV battery assembly line',
    subtitle: 'Enclosure trays with standby redundancy',
    prompt: 'I want to set up an EV battery enclosure tray manufacturing line for 5,000 units/month.',
  },
  {
    title: 'Precision conveyor frame fabrication',
    subtitle: 'Heavy structural cutting & arc welding',
    prompt: 'Plan an industrial conveyor frame fabrication line with a ₹1.2 Crore machinery budget.',
  },
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
  'Yes, equip standby redundancy on critical bottlenecks',
  'Standard single line without standby backup',
];

export default function ChatPlanner({
  user,
  existingPlan,
  onSimulateFactory,
  onQuickJumpToFactory,
  onBackToHome,
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
        text: `Welcome to KEYSTONE. What are you planning to manufacture?\n\nTell me about your product, expected output volume, or budget. I will help you configure the 4-station sequential line (Cutting → Welding → Assembly → Inspection), select machinery, and test for production bottlenecks in the 3D digital twin.`,
        step: 'product',
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(existingPlan?.step || 'product');
  const [productType, setProductType] = useState(existingPlan?.productType || '');
  const [targetVolume, setTargetVolume] = useState(existingPlan?.targetVolume || '');
  const [targetBudget, setTargetBudget] = useState(existingPlan?.targetBudget || '');
  const [redundancyPreference, setRedundancyPreference] = useState(
    existingPlan?.redundancyPreference || ''
  );
  const [selections, setSelections] = useState(
    existingPlan?.selections || DEFAULT_CATALOGUE_SELECTIONS
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleSelectMachine = useCallback((category, machineId) => {
    setSelections((prev) => ({
      ...prev,
      [category]: machineId,
    }));
  }, []);

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
    }, 600);
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

    if (step === 'product') {
      setProductType(text);
      replyWithDelay(
        `Great — let's plan the line for **${text}**.\n\nWhat is your **target production volume and operating schedule**? For instance: 5,000 units/month on an 8-hour shift, or 100 units/hour continuous operation.`,
        'volume',
        { suggestions: VOLUME_SUGGESTIONS }
      );
    } else if (step === 'volume') {
      setTargetVolume(text);
      replyWithDelay(
        `Production target registered: **${text}**.\n\nWhat is your approximate **machinery capital expenditure (CapEx) budget** in Indian Rupees (INR)? This helps ensure we choose equipment with the right balance of automation and cost.`,
        'budget',
        { suggestions: BUDGET_SUGGESTIONS }
      );
    } else if (step === 'budget') {
      setTargetBudget(text);
      replyWithDelay(
        `Budget envelope set at **${text}**.\n\nIn a continuous sequential line, a machine breakdown halts downstream output. Do you want **standby backup machines** prepared for critical stations like cutting or welding?`,
        'redundancy',
        { suggestions: REDUNDANCY_SUGGESTIONS }
      );
    } else if (step === 'redundancy') {
      const isRedundant = !text.toLowerCase().includes('no standby');
      setRedundancyPreference(isRedundant ? 'Standby redundancy enabled' : 'Single line (No standby)');

      replyWithDelay(
        `Specifications compiled for **${productType || 'Your Production Line'}** at **${targetVolume || 'target rate'}**.\n\n` +
          `Here is the proposed 4-station sequential workflow:\n` +
          `1. Cutting → 2. Welding → 3. Assembly → 4. Inspection\n\n` +
          `Review our recommended equipment choices from the machinery catalogue below. You can compare specs and indicative pricing in INR, or switch models:`,
        'catalogue',
        { showCatalogue: true }
      );
    } else if (step === 'catalogue' || step === 'review') {
      replyWithDelay(
        `Feedback noted: "${text}". Your machinery lineup is summarized below with live indicative totals. When you are ready, launch the **Simulate Factory** twin to test bottlenecks and verify failure scenarios.`,
        'review',
        { showReview: true }
      );
    }
  };

  const handleConfirmSelections = () => {
    replyWithDelay(
      `Your machinery selections are saved.\n\n` +
        `Ready to transition into the **3D Interactive Factory** to inspect your layout, test simulated breakdowns, and verify line throughput:`,
      'review',
      { showReview: true }
    );
  };

  const handleStartSimulation = () => {
    const planContext = {
      productType: productType || 'Custom Assembly Line',
      targetVolume: targetVolume || '5,000 units/month',
      targetBudget: targetBudget || '₹1.0 Crore',
      redundancyPreference: redundancyPreference || 'Standby redundancy active',
      selections,
      totalEstimateInr: formatInrCurrency(calculateTotalEstimate(selections)),
      step,
      messages,
    };
    onSimulateFactory(planContext);
  };

  const handleResetSession = () => {
    if (window.confirm('Start a new factory planning session?')) {
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
          text: `What are you planning to manufacture?\n\nTell me about your product, expected output volume, or budget. I'll help you configure the 4-station sequential line and test for bottlenecks in 3D.`,
          step: 'product',
        },
      ]);
    }
  };

  const totalEstimate = calculateTotalEstimate(selections);
  const isStartScreen = messages.length <= 1 && step === 'product';

  return (
    <div className="gpt-shell">
      {/* ── Left Sidebar (ChatGPT Style) ───────────────────────────── */}
      <aside className={`gpt-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="gpt-sidebar-header">
          <div className="gpt-sidebar-brand">
            <div className="gpt-brand-logo">K</div>
            <span className="gpt-brand-title">KEYSTONE</span>
          </div>
          <button
            type="button"
            className="gpt-close-sidebar-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* + New Chat Button */}
        <button type="button" className="gpt-new-chat-btn" onClick={handleResetSession}>
          <span>+</span>
          <span>New Planning Session</span>
        </button>

        {/* Recent / Active Conversations */}
        <div className="gpt-sessions-container">
          <div className="gpt-sessions-label">Current Session</div>
          <button type="button" className="gpt-session-item active">
            <span className="gpt-session-icon">💬</span>
            <span className="gpt-session-text">
              {productType || 'Factory Planning Chat'}
            </span>
          </button>

          <div className="gpt-sessions-label" style={{ marginTop: 12 }}>
            Demo Templates
          </div>
          <button
            type="button"
            className="gpt-session-item"
            onClick={() => {
              handleResetSession();
              setTimeout(() => {
                handleSendMessage('Plan an EV battery enclosure tray assembly line for 5,000 units/month');
              }, 150);
            }}
          >
            <span className="gpt-session-icon">⚙</span>
            <span className="gpt-session-text">EV Battery Enclosures</span>
          </button>
          <button
            type="button"
            className="gpt-session-item"
            onClick={() => {
              handleResetSession();
              setTimeout(() => {
                handleSendMessage('Sheet-metal bracket production line for 10,000 units/month');
              }, 150);
            }}
          >
            <span className="gpt-session-icon">✂</span>
            <span className="gpt-session-text">Sheet-Metal Brackets</span>
          </button>
        </div>

        {/* Sidebar Footer */}
        <div className="gpt-sidebar-footer">
          <div className="gpt-user-badge">
            <span className="gpt-user-dot" />
            <span>{user?.name || 'Demo Engineer'}</span>
          </div>

          <button
            type="button"
            className="gpt-sidebar-link-btn"
            onClick={onQuickJumpToFactory}
            title="Inspect 3D factory directly"
          >
            <span>Open 3D Factory Twin</span>
            <span>→</span>
          </button>

          {onBackToHome && (
            <button
              type="button"
              className="gpt-sidebar-link-btn"
              onClick={onBackToHome}
              title="Return to Keystone homepage"
            >
              <span>← Back to Homepage</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── Central Main Chat Area ─────────────────────────────────── */}
      <div className="gpt-main">
        {/* Top Header Bar */}
        <header className="gpt-topbar">
          <div className="gpt-topbar-left">
            <button
              type="button"
              className="gpt-hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation sidebar"
            >
              ☰
            </button>
            <span className="gpt-chat-title">
              {productType ? `Plan: ${productType}` : 'KEYSTONE AI Factory Copilot'}
            </span>
          </div>

          <div className="gpt-topbar-right">
            <button
              type="button"
              className="gpt-factory-direct-btn"
              onClick={onQuickJumpToFactory}
              title="Jump to 3D simulation twin"
            >
              <span>3D Factory Twin</span>
              <span>→</span>
            </button>
          </div>
        </header>

        {/* Conversation Stream */}
        <main className="gpt-stream">
          {/* Friendly Welcome Screen on Clean Session */}
          {isStartScreen && (
            <div className="gpt-welcome-hero">
              <div className="gpt-welcome-logo">K</div>
              <h2 className="gpt-welcome-title">What are you planning to manufacture?</h2>
              <p className="gpt-welcome-subtitle">
                Describe your component or assembly goal. Keystone will configure a 4-station sequential line, recommend machinery with indicative INR pricing, and simulate bottlenecks in 3D.
              </p>

              <div className="gpt-chips-grid">
                {STARTER_SUGGESTION_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="gpt-chip-card"
                    onClick={() => handleSendMessage(chip.prompt)}
                  >
                    <span className="gpt-chip-title">{chip.title}</span>
                    <span className="gpt-chip-sub">{chip.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`gpt-row ${msg.sender}`}>
              <div className="gpt-avatar">
                {msg.sender === 'assistant' ? 'K' : 'YOU'}
              </div>

              <div className="gpt-msg-container">
                <div className="gpt-msg-header">
                  <span>{msg.sender === 'assistant' ? 'KEYSTONE' : user?.name || 'YOU'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="gpt-msg-body">
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

                  {/* Contextual Suggestions Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                      {msg.suggestions.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          className="gpt-mcard-select-btn"
                          style={{
                            background: 'var(--bg-panel-elevated)',
                            padding: '6px 12px',
                            borderRadius: 14,
                            cursor: 'pointer',
                            color: '#e6edf3',
                          }}
                          onClick={() => handleSendMessage(suggestion)}
                          disabled={isTyping}
                        >
                          › {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Inline Equipment Catalogue Cards */}
                  {msg.showCatalogue && (
                    <div className="gpt-catalogue-block">
                      {['cutting', 'welding', 'assembly', 'inspection'].map((category) => {
                        const machines = getMachinesByCategory(category);
                        const selectedMachineId = selections[category];
                        const categoryLabels = {
                          cutting: 'Stage 1: Cutting Station',
                          welding: 'Stage 2: Arc & Robotic Welding',
                          assembly: 'Stage 3: Automated Fastening & Assembly',
                          inspection: 'Stage 4: Optical & CMM Metrology',
                        };

                        return (
                          <div key={category} className="gpt-cat-section">
                            <div className="gpt-cat-header">
                              <span className="gpt-cat-title">{categoryLabels[category]}</span>
                              <span className="gpt-cat-selected-badge">
                                Active: {machines.find((m) => m.id === selectedMachineId)?.name}
                              </span>
                            </div>

                            <div className="gpt-cards-row">
                              {machines.map((machine) => {
                                const isSelected = selectedMachineId === machine.id;
                                return (
                                  <div
                                    key={machine.id}
                                    className={`gpt-machine-card ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSelectMachine(category, machine.id)}
                                  >
                                    <div>
                                      <div className="gpt-mcard-name">{machine.name}</div>
                                      <div className="gpt-mcard-price">
                                        {machine.priceInr}{' '}
                                        <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                                          ({machine.verificationLabel})
                                        </span>
                                      </div>

                                      <div className="gpt-mcard-specs">
                                        {Object.entries(machine.specs).slice(0, 3).map(([k, v]) => (
                                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{k}:</span>
                                            <span style={{ color: '#fff' }}>{v}</span>
                                          </div>
                                        ))}
                                      </div>

                                      <div className="gpt-mcard-notes">
                                        * {machine.notes}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      className="gpt-mcard-select-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectMachine(category, machine.id);
                                      }}
                                    >
                                      {isSelected ? '✓ Selected Equipment' : 'Select This Machine'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="gpt-factory-direct-btn"
                          style={{ padding: '10px 20px', fontSize: 12.5 }}
                          onClick={handleConfirmSelections}
                        >
                          ✓ Lock Equipment & Review Plan
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Executive Review & Simulate Factory Action */}
                  {msg.showReview && (
                    <div className="gpt-review-box">
                      <div className="gpt-review-title">
                        <span>Factory Plan Summary</span>
                        <span style={{ color: 'var(--status-healthy)', fontFamily: 'var(--font-mono)' }}>
                          Total Est: {formatInrCurrency(totalEstimate)}
                        </span>
                      </div>

                      <div className="gpt-review-stats">
                        <div className="gpt-stat-pill">
                          <span className="gpt-stat-key">Product Line</span>
                          <span className="gpt-stat-val">{productType || 'EV Battery Enclosures'}</span>
                        </div>
                        <div className="gpt-stat-pill">
                          <span className="gpt-stat-key">Target Output</span>
                          <span className="gpt-stat-val">{targetVolume || '5,000 units/mo'}</span>
                        </div>
                        <div className="gpt-stat-pill">
                          <span className="gpt-stat-key">CapEx Envelope</span>
                          <span className="gpt-stat-val">{targetBudget || '₹1.0 - ₹1.5 Cr'}</span>
                        </div>
                        <div className="gpt-stat-pill">
                          <span className="gpt-stat-key">Redundancy Status</span>
                          <span className="gpt-stat-val">{redundancyPreference || 'Armed on critical'}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', lineHeight: 1.45, background: 'var(--bg-panel)', padding: 10, borderRadius: 3 }}>
                        ℹ 3D SIMULATION NOTE: Throughput in the 3D twin runs on the calibrated sequential model (Cutting: 120 u/min, Welding: 95 u/min bottleneck, Assembly: 110 u/min, Inspection: 130 u/min). Your selected equipment is connected as the active planning specification.
                      </div>

                      <button
                        type="button"
                        className="gpt-simulate-cta"
                        onClick={handleStartSimulation}
                      >
                        <span>▶ Simulate Factory in 3D</span>
                        <span style={{ fontSize: 11, opacity: 0.9 }}>
                          (Inspect Geometry · Test Faults · Verify Mitigations)
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="gpt-row assistant">
              <div className="gpt-avatar">K</div>
              <div className="gpt-msg-container">
                <div className="gpt-msg-body">
                  <div className="gpt-typing-dots">
                    <div className="gpt-dot" />
                    <div className="gpt-dot" />
                    <div className="gpt-dot" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={streamEndRef} />
        </main>

        {/* ── Message Composer Bar ─────────────────────────────────── */}
        <footer className="gpt-composer-area">
          <form
            className="gpt-composer-box"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              ref={inputRef}
              className="gpt-input"
              type="text"
              placeholder={
                step === 'product'
                  ? 'Describe what you want to manufacture...'
                  : step === 'volume'
                  ? 'Enter target volume (e.g. 5,000 units/month)...'
                  : step === 'budget'
                  ? 'Enter approximate machinery budget in INR...'
                  : 'Message Keystone Factory Copilot...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTyping}
            />

            <button
              type="submit"
              className="gpt-send-btn"
              disabled={!inputText.trim() || isTyping}
              aria-label="Send message"
            >
              ↑
            </button>
          </form>

          <div className="gpt-composer-disclaimer">
            Keystone deterministic factory planning copilot · Press Enter to send
          </div>
        </footer>
      </div>
    </div>
  );
}
