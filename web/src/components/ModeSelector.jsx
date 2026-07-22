const MODES = [
  {
    id: 'AUTO',
    label: 'Auto',
    desc: 'LDR controls both lights automatically',
    icon: '🤖',
  },
  {
    id: 'MANUAL',
    label: 'Manual',
    desc: 'Override lights from this dashboard',
    icon: '🕹️',
  },
  {
    id: 'SCHEDULE',
    label: 'Schedule',
    desc: 'Photoperiod based on chick age',
    icon: '📅',
  },
];

export default function ModeSelector({ mode, onModeChange, disabled }) {
  return (
    <div className="card">
      <div className="card-label">
        <div className="card-icon" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>⚙️</div>
        System Mode
      </div>

      <div className="mode-options">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-btn ${mode === m.id ? 'active' : ''}`}
            onClick={() => onModeChange(m.id)}
            disabled={disabled}
            id={`mode-btn-${m.id.toLowerCase()}`}
          >
            <div className="mode-radio">
              <div className="mode-radio-dot" />
            </div>
            <div style={{ fontSize: '1.1rem' }}>{m.icon}</div>
            <div className="mode-info">
              <div className="mode-name">{m.label}</div>
              <div className="mode-desc">{m.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {disabled && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 12, textAlign: 'center' }}>
          Connect to MQTT to change mode
        </div>
      )}
    </div>
  );
}
