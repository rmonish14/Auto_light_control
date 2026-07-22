export default function MaintenanceCard({ l1Runtime, l2Runtime, l1Cycles, l2Cycles }) {
  // Assume a relay lifetime of 100,000 cycles and bulb lifetime of 5,000 hours (18,000,000 seconds)
  const MAX_HOURS = 5000;
  const MAX_CYCLES = 100000;

  const l1RuntimeHrs = (l1Runtime || 0) / 3600;
  const l2RuntimeHrs = (l2Runtime || 0) / 3600;

  const l1Health = Math.max(0, Math.round(100 - (l1RuntimeHrs / MAX_HOURS) * 100 - ((l1Cycles || 0) / MAX_CYCLES) * 100));
  const l2Health = Math.max(0, Math.round(100 - (l2RuntimeHrs / MAX_HOURS) * 100 - ((l2Cycles || 0) / MAX_CYCLES) * 100));

  const systemHealth = Math.round((l1Health + l2Health) / 2);

  const getHealthClass = (val) => {
    if (val > 80) return 'good';
    if (val > 50) return 'warn';
    return 'danger';
  };

  const getHealthColor = (val) => {
    if (val > 80) return 'var(--green)';
    if (val > 50) return 'var(--amber)';
    return 'var(--red)';
  };

  return (
    <div className="card">
      <div className="card-label">
        <div className="card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--green)' }}>🔧</div>
        System Health & Maintenance
      </div>

      <div className="health-bar-wrap">
        <div className="health-bar-header">
          <span className="health-bar-label">Overall Bulb & Relay Integrity</span>
          <span className="health-bar-value" style={{ color: getHealthColor(systemHealth) }}>
            {systemHealth}%
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${systemHealth}%`, 
              background: getHealthColor(systemHealth) 
            }} 
          />
        </div>
      </div>

      <div className="runtime-grid">
        <div className="stat-pill">
          <div className="stat-pill-label">L1 Health</div>
          <div className="stat-pill-value" style={{ color: getHealthColor(l1Health) }}>
            {l1Health}%
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 4 }}>
            {(l1RuntimeHrs).toFixed(1)} hrs / {l1Cycles || 0} cycles
          </div>
        </div>

        <div className="stat-pill">
          <div className="stat-pill-label">L2 Health</div>
          <div className="stat-pill-value" style={{ color: getHealthColor(l2Health) }}>
            {l2Health}%
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 4 }}>
            {(l2RuntimeHrs).toFixed(1)} hrs / {l2Cycles || 0} cycles
          </div>
        </div>
      </div>

      <div className={`maintenance-badge ${getHealthClass(systemHealth)}`}>
        {systemHealth > 80 ? '🟢 All Systems Nominal' : systemHealth > 50 ? '🟡 Maintenance Recommended Soon' : '🔴 Urgent Bulb Replacement Needed'}
      </div>
    </div>
  );
}
