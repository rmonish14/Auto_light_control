function getTempColor(t) {
  if (t == null) return { cls: '', label: '—', status: 'No data' };
  if (t === -100) return { cls: 'red', label: '❌', status: 'Sensor Error' };
  if (t < 20)   return { cls: 'blue', label: '❄️', status: 'Cold' };
  if (t < 33)   return { cls: 'green', label: '✅', status: 'Optimal' };
  if (t < 36)   return { cls: 'amber', label: '⚠️', status: 'Elevated' };
  if (t < 39)   return { cls: 'orange', label: '🌡️', status: 'High' };
  return { cls: 'red', label: '🔥', status: 'Critical Alarm' };
}

const colorMap = {
  blue: '#3b82f6', green: '#22c55e', amber: '#f59e0b', orange: '#f97316', red: '#ef4444',
};

export default function HomePage({ data }) {
  const { temperature, environment, lightIntensity, wifiRSSI,
          light2Status, mode,
          l2Runtime, l2Cycles,
          highTempAlert } = data;

  const RATED_SWITCHING_LIMIT = 10000;

  const temp = getTempColor(temperature);
  const isDark = environment === 'DARK';
  const pct = temperature != null ? Math.min(100, Math.round((temperature / 50) * 100)) : 0;
  const l2Hrs = ((l2Runtime || 0) / 3600).toFixed(1);

  const ch2Remaining = Math.max(0, RATED_SWITCHING_LIMIT - (l2Cycles || 0));

  return (
    <div className="page">
      {highTempAlert && (
        <div className="alert-strip" style={{ marginBottom: 20, borderRadius: 'var(--radius-sm)' }}>
          ⚠️ HIGH TEMPERATURE ALARM — Ambient temperature exceeds safety threshold!
        </div>
      )}

      <div className="section-title">Facility Live Telemetry</div>
      <div className="page-grid-3">
        {/* Temperature Card */}
        <div className="card">
          <div className="card-label">
            <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>🌡️</div>
            Facility Ambient Temperature
          </div>
          <div className="metric-value" style={{ color: colorMap[temp.cls] || 'var(--text-1)', fontSize: temperature === -100 ? '2.2rem' : '3.2rem' }}>
            {temperature != null ? (temperature === -100 ? 'ERROR' : temperature.toFixed(1)) : '—'}
            {temperature !== -100 && <span className="metric-unit">°C</span>}
          </div>
          <div className="status-badge" style={{
            background: `${colorMap[temp.cls]}12`,
            borderColor: `${colorMap[temp.cls]}30`,
            color: colorMap[temp.cls],
          }}>
            {temp.label} {temp.status}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%`, background: colorMap[temp.cls] }} />
          </div>
        </div>

        {/* Ambient Light Sensor (LDR) */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-label" style={{ justifyContent: 'center' }}>
            <div className="card-icon" style={{ background: environment ? 'var(--accent-dim)' : 'var(--bg-3)', color: environment ? 'var(--accent)' : 'var(--text-3)' }}>
              {environment ? (isDark ? '🌑' : '☀️') : '❔'}
            </div>
            Ambient Light Sensor (LDR)
          </div>
          <div className="relay-card-indicator" style={{
            margin: '10px auto',
            borderColor: environment ? (isDark ? 'var(--accent-2)' : 'var(--accent)') : 'var(--border-2)',
            background: environment ? (isDark ? 'rgba(139, 92, 246, 0.08)' : 'var(--accent-dim)') : 'var(--bg-2)',
            fontSize: '2.4rem',
          }}>
            {environment ? (isDark ? '🌙' : '☀️') : '—'}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '1.3rem',
            fontWeight: 700,
            color: environment ? (isDark ? 'var(--accent-2)' : 'var(--accent)') : 'var(--text-3)',
            letterSpacing: '0.05em',
          }}>
            {environment ?? 'NO DATA'}
          </div>
          {lightIntensity != null && (
            <div style={{ marginTop: 10 }}>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${lightIntensity}%`, background: 'var(--accent)' }} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '0.78rem', color: 'var(--text-2)', marginTop: 4 }}>
                Intensity: {lightIntensity}%
              </div>
            </div>
          )}
        </div>

        {/* System Active Mode */}
        <div className="card">
          <div className="card-label">
            <div className="card-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>📡</div>
            Control Mode & Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Active Mode</span>
              <span className="status-badge" style={{
                background: 'var(--accent-dim)', borderColor: 'rgba(245,158,11,0.2)', color: 'var(--accent)',
              }}>{mode}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Lighting Relay (GPIO 27)</span>
              <span className="status-badge" style={{
                background: light2Status ? 'var(--green-dim)' : 'var(--bg-3)',
                borderColor: light2Status ? 'rgba(34,197,94,0.2)' : 'var(--border-2)',
                color: light2Status ? 'var(--green)' : 'var(--text-3)',
              }}>{light2Status ? '● ENERGIZED' : '○ OFF'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>WiFi Signal</span>
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '0.82rem', color: 'var(--text-1)' }}>
                {wifiRSSI ?? '—'} dBm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Summary */}
      <div className="section-title">Channel Switching Lifespan Overview (10,000 Rated Limit)</div>
      <div style={{ maxWidth: 600 }}>
        {/* Channel 2 Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-label">
              <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>💡</div>
              Main Lighting Output (CH2 / GPIO 27)
            </div>
            <div className="card-badge" style={{
              background: light2Status ? 'var(--green-dim)' : 'var(--bg-3)',
              borderColor: light2Status ? 'rgba(34,197,94,0.3)' : 'var(--border-2)',
              color: light2Status ? 'var(--green)' : 'var(--text-3)',
            }}>{light2Status ? '● ENERGIZED' : '○ OFF'}</div>
          </div>
          <div className="relay-stats-row">
            <div className="stat-cell">
              <div className="stat-cell-label">Runtime</div>
              <div className="stat-cell-value">{l2Hrs}h</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Switches Used</div>
              <div className="stat-cell-value" style={{ color: 'var(--accent)' }}>{l2Cycles ?? 0}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Switches Remaining</div>
              <div className="stat-cell-value" style={{ color: 'var(--green)' }}>{ch2Remaining.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
