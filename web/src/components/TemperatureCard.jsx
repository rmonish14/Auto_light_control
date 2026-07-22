function getTempMeta(t) {
  if (t == null) return { color: 'green', label: '—', status: 'No data', pct: 0 };
  if (t < 20)   return { color: 'blue',   label: '❄️', status: 'Too Cold',  pct: Math.round((t / 50) * 100) };
  if (t < 33)   return { color: 'green',  label: '✅', status: 'Normal',    pct: Math.round((t / 50) * 100) };
  if (t < 36)   return { color: 'amber',  label: '⚠️', status: 'Warm',      pct: Math.round((t / 50) * 100) };
  if (t < 39)   return { color: 'orange', label: '🌡️', status: 'Hot',       pct: Math.round((t / 50) * 100) };
  return         { color: 'red',    label: '🔥', status: 'Critical',  pct: Math.min(100, Math.round((t / 50) * 100)) };
}

const barColors = {
  blue: '#3b82f6', 
  green: 'var(--cat-green)', 
  amber: 'var(--cat-yellow)', 
  orange: '#f97316', 
  red: 'var(--cat-red)',
};
const badgeColors = {
  blue:   { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  text: '#3b82f6' },
  green:  { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', text: 'var(--cat-green)' },
  amber:  { bg: 'var(--cat-yellow-dim)', border: 'rgba(255,195,0,0.25)', text: 'var(--cat-yellow)' },
  orange: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', text: '#f97316' },
  red:    { bg: 'var(--cat-red-dim)',   border: 'rgba(230,0,0,0.25)',   text: 'var(--cat-red)' },
};

export default function TemperatureCard({ temperature }) {
  const meta = getTempMeta(temperature);
  const badge = badgeColors[meta.color];

  return (
    <div className="card">
      <div className="card-label">
        <div className="card-icon" style={{ background: 'var(--cat-yellow-dim)', color: 'var(--cat-yellow)' }}>🌡️</div>
        Temperature Monitor
      </div>

      <div className={`temp-value ${meta.color}`}>
        {temperature != null ? temperature.toFixed(1) : '—'}
        <span className="temp-unit">°C</span>
      </div>

      <div
        className="temp-status-label"
        style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.text }}
      >
        {meta.label} {meta.status}
      </div>

      <div className="temp-bar">
        <div
          className="temp-bar-fill"
          style={{ width: `${meta.pct}%`, background: barColors[meta.color] }}
        />
      </div>
    </div>
  );
}
