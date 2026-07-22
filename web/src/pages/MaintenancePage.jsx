function formatHours(seconds) {
  if (seconds == null) return '0.0h';
  const h = seconds / 3600;
  return h < 10 ? `${h.toFixed(1)}h` : `${Math.round(h)}h`;
}

export default function MaintenancePage({ data }) {
  const { l1Runtime, l2Runtime, l1Cycles, l2Cycles, bulbHealth, installationDate } = data;

  const RATED_SWITCHING_LIMIT = 10000;
  const RATED_HOURS_LIMIT = 25000;

  const installDateStr = installationDate || '2024-01-15';
  const daysInService = Math.max(1, Math.floor((new Date() - new Date(installDateStr)) / (1000 * 60 * 60 * 24)));

  const ch1SwitchesUsed = l1Cycles || 0;
  const ch2SwitchesUsed = l2Cycles || 0;

  const ch1SwitchesRemaining = Math.max(0, RATED_SWITCHING_LIMIT - ch1SwitchesUsed);
  const ch2SwitchesRemaining = Math.max(0, RATED_SWITCHING_LIMIT - ch2SwitchesUsed);

  const ch1Health = Math.max(0, Math.min(100, (ch1SwitchesRemaining / RATED_SWITCHING_LIMIT) * 100));
  const ch2Health = Math.max(0, Math.min(100, (ch2SwitchesRemaining / RATED_SWITCHING_LIMIT) * 100));

  return (
    <div className="page">
      <div className="section-title">Facility Installation & Maintenance Tracking</div>

      {/* Facility System Overview */}
      <div className="page-grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-label">
            <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>📅</div>
            Installation Date
          </div>
          <div className="metric-value" style={{ fontSize: '2.2rem', color: 'var(--text-1)' }}>
            {installDateStr}
          </div>
          <div className="metric-sub">{daysInService} Days Continuous Operation</div>
        </div>

        <div className="card">
          <div className="card-label">
            <div className="card-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>🛡️</div>
            System Integrity
          </div>
          <div className="metric-value" style={{ color: bulbHealth > 80 ? 'var(--green)' : 'var(--accent)' }}>
            {(bulbHealth ?? 100).toFixed(1)}%
          </div>
          <div className="metric-sub">Calculated Lifespan Health</div>
        </div>

        <div className="card">
          <div className="card-label">
            <div className="card-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>🔄</div>
            Total System Cycles
          </div>
          <div className="metric-value" style={{ color: 'var(--blue)' }}>
            {ch1SwitchesUsed + ch2SwitchesUsed}
          </div>
          <div className="metric-sub">Combined Relay Switch Operations</div>
        </div>
      </div>

      <div className="section-title">Channel Component Lifespan Analytics (10,000 Rated Limit)</div>
      <div className="page-grid-2">
        {/* Channel 1 Maintenance */}
        <div className="card">
          <div className="card-header">
            <div className="card-label">
              <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>💡</div>
              Channel 1 — Primary Lighting
            </div>
            <div className="card-badge" style={{ background: 'var(--green-dim)', color: 'var(--green)', borderColor: 'rgba(34,197,94,0.2)' }}>
              {ch1Health > 20 ? 'HEALTHY' : 'REPLACE SOON'}
            </div>
          </div>

          <div style={{ margin: '12px 0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-2)' }}>Remaining Switching Capacity</span>
              <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: 'var(--accent)' }}>
                {ch1SwitchesRemaining.toLocaleString()} / 10,000 switches ({ch1Health.toFixed(1)}%)
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${ch1Health}%`, background: 'var(--accent)' }} />
            </div>
          </div>

          <div className="relay-stats-row">
            <div className="stat-cell">
              <div className="stat-cell-label">Operating Runtime</div>
              <div className="stat-cell-value">{formatHours(l1Runtime)}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Switches Used</div>
              <div className="stat-cell-value">{ch1SwitchesUsed}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Switches Left</div>
              <div className="stat-cell-value" style={{ color: 'var(--green)' }}>{ch1SwitchesRemaining.toLocaleString()}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Max Rated Limit</div>
              <div className="stat-cell-value">10,000</div>
            </div>
          </div>
        </div>

        {/* Channel 2 Maintenance */}
        <div className="card">
          <div className="card-header">
            <div className="card-label">
              <div className="card-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>💡</div>
              Channel 2 — Auxiliary Lighting
            </div>
            <div className="card-badge" style={{ background: 'var(--green-dim)', color: 'var(--green)', borderColor: 'rgba(34,197,94,0.2)' }}>
              {ch2Health > 20 ? 'HEALTHY' : 'REPLACE SOON'}
            </div>
          </div>

          <div style={{ margin: '12px 0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-2)' }}>Remaining Switching Capacity</span>
              <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: 'var(--blue)' }}>
                {ch2SwitchesRemaining.toLocaleString()} / 10,000 switches ({ch2Health.toFixed(1)}%)
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${ch2Health}%`, background: 'var(--blue)' }} />
            </div>
          </div>

          <div className="relay-stats-row">
            <div className="stat-cell">
              <div className="stat-cell-label">Operating Runtime</div>
              <div className="stat-cell-value">{formatHours(l2Runtime)}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Switches Used</div>
              <div className="stat-cell-value">{ch2SwitchesUsed}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Switches Left</div>
              <div className="stat-cell-value" style={{ color: 'var(--blue)' }}>{ch2SwitchesRemaining.toLocaleString()}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Max Rated Limit</div>
              <div className="stat-cell-value">10,000</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
