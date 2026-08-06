function formatRuntime(seconds) {
  if (seconds == null) return '0.0h';
  const h = seconds / 3600;
  return h < 10 ? `${h.toFixed(1)}h` : `${Math.round(h)}h`;
}

export default function ChannelsPage({ data, onToggle, onModeChange, disabled }) {
  const { mode, light1Status, light2Status, l1Runtime, l2Runtime, l1Cycles, l2Cycles } = data;

  const RATED_SWITCHING_LIMIT = 10000;

  const isManual = mode === 'MANUAL';

  const channels = [
    { id: 1, name: 'Light Relay 1 (CH1)', sub: 'Auxiliary Lighting Channel', icon: '💡',
      state: light1Status, runtime: l1Runtime, cycles: l1Cycles || 0, pin: 'GPIO 26 Relay (LED GPIO 4)',
      remainingSwitches: Math.max(0, RATED_SWITCHING_LIMIT - (l1Cycles || 0)) },
    { id: 2, name: 'Light Relay 2 (CH2)', sub: 'Main Facility Lighting Channel', icon: '💡',
      state: light2Status, runtime: l2Runtime, cycles: l2Cycles || 0, pin: 'GPIO 27 Relay (LED GPIO 5)',
      remainingSwitches: Math.max(0, RATED_SWITCHING_LIMIT - (l2Cycles || 0)) },
  ];

  const MODES = [
    { id: 'AUTO', label: 'Auto (LDR)', desc: 'Photocell ambient sensor automation', icon: '🤖' },
    { id: 'MANUAL', label: 'Manual Control', desc: 'Direct dashboard override', icon: '🕹️' },
    { id: 'SCHEDULE', label: 'Time Schedule', desc: 'Custom ON/OFF daily timer', icon: '⏰' },
  ];

  return (
    <div className="page">
      <div className="section-title">Active Facility Control Mode</div>
      <div className="page-grid-3">
        {MODES.map(m => (
          <button
            key={m.id}
            id={`mode-btn-${m.id.toLowerCase()}`}
            className={`mode-option ${mode === m.id ? 'active' : ''}`}
            onClick={() => onModeChange(m.id)}
            disabled={disabled}
          >
            <div className="mode-radio"><div className="mode-radio-dot" /></div>
            <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
            <div style={{ flex: 1 }}>
              <div className="mode-name">{m.label}</div>
              <div className="mode-desc">{m.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="section-title">Relay Output Control (10,000 Rated Switch Limit)</div>
      <div className="page-grid-2">
        {channels.map(ch => {
          const isOn = ch.state;
          const healthPct = ((ch.remainingSwitches / RATED_SWITCHING_LIMIT) * 100).toFixed(1);
          return (
            <div className="card" key={ch.id}>
              <div className="card-header">
                <div className="card-label">
                  <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>{ch.icon}</div>
                  {ch.name}
                </div>
                <div className="card-badge" style={{
                  background: isManual ? 'var(--accent-dim)' : 'var(--blue-dim)',
                  borderColor: isManual ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)',
                  color: isManual ? 'var(--accent)' : 'var(--blue)',
                }}>
                  {isManual ? 'MANUAL OVERRIDE' : `AUTOMATIC (${mode})`}
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 12 }}>
                {ch.sub} · {ch.pin}
              </div>

              {/* Status Display */}
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div className={`relay-card-indicator ${isOn ? 'on' : ''}`}>{ch.icon}</div>
                <div className={`relay-state-label ${isOn ? 'on' : 'off'}`}>
                  {isOn ? 'OUTPUT ENERGIZED' : 'OUTPUT DE-ENERGIZED'}
                </div>
              </div>

              {/* Control Action Button */}
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <button
                  id={`relay-toggle-${ch.id}`}
                  className="btn"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '12px',
                    fontSize: '0.95rem',
                    background: isOn ? 'var(--red-dim)' : 'var(--green-dim)',
                    border: `1px solid ${isOn ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                    color: isOn ? 'var(--red)' : 'var(--green)',
                  }}
                  onClick={() => onToggle(ch.id, isOn)}
                  disabled={disabled}
                >
                  {isOn ? '🔴 De-energize Output (OFF)' : '🟢 Energize Output (ON)'}
                </button>
              </div>

              {/* Switching Lifespan Stats */}
              <div className="relay-stats-row">
                <div className="stat-cell">
                  <div className="stat-cell-label">Total Runtime</div>
                  <div className="stat-cell-value">{formatRuntime(ch.runtime)}</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-cell-label">Switches Used</div>
                  <div className="stat-cell-value" style={{ color: 'var(--accent)' }}>{ch.cycles}</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-cell-label">Switches Left</div>
                  <div className="stat-cell-value" style={{ color: 'var(--green)' }}>{ch.remainingSwitches.toLocaleString()}</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-cell-label">Remaining Health</div>
                  <div className="stat-cell-value">{healthPct}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
