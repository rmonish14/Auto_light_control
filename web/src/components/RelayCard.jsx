function formatRuntime(seconds) {
  if (seconds == null) return '0.0h';
  const h = seconds / 3600;
  return h < 10 ? `${h.toFixed(1)}h` : `${Math.round(h)}h`;
}

export default function RelayCard({
  title, subtitle, icon, state, override, onToggle,
  onCount, runtime, isManual, disabled,
}) {
  const isOn = isManual ? override : (state ?? false);

  return (
    <div className="card">
      <div className="relay-header">
        <div>
          <div className="relay-title">{icon} {title}</div>
          <div className="relay-subtitle">{subtitle}</div>
        </div>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '3px 9px',
            borderRadius: 999,
            background: isManual ? 'var(--amber-dim)' : 'var(--cyan-dim)',
            color: isManual ? 'var(--amber)' : 'var(--cyan)',
            border: `1px solid ${isManual ? 'rgba(245,158,11,0.3)' : 'rgba(0,212,255,0.3)'}`,
          }}
        >
          {isManual ? 'MANUAL' : 'AUTO'}
        </div>
      </div>

      <div className="relay-state">
        <div className={`relay-indicator ${isOn ? 'on' : 'off'}`}>
          {icon}
        </div>
        <div className={`relay-state-text ${isOn ? 'on' : 'off'}`}>
          {isOn ? 'ON' : 'OFF'}
        </div>

        {isManual && (
          <label
            className={`toggle-wrap ${disabled ? 'disabled' : ''}`}
            onClick={disabled ? undefined : onToggle}
            role="switch"
            aria-checked={override}
            id={`relay-toggle-${title.replace(/\s/g,'').toLowerCase()}`}
          >
            <div className={`toggle ${override ? 'on' : ''}`} />
            <span className="toggle-label">
              {override ? 'Turn OFF' : 'Turn ON'}
            </span>
          </label>
        )}
      </div>

      <div className="relay-stats">
        <div className="stat-pill">
          <div className="stat-pill-label">Runtime</div>
          <div className="stat-pill-value">{formatRuntime(runtime)}</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-label">Cycles</div>
          <div className="stat-pill-value">{onCount ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
