const PHASES = [
  { max: 7,   label: 'Brooding',     hours: '24h light / day', color: 'var(--cat-yellow)' },
  { max: 14,  label: 'Early Growth',  hours: '20h light / day', color: 'var(--cat-green)' },
  { max: 21,  label: 'Mid Growth',    hours: '18h light / day', color: '#3b82f6' },
  { max: 42,  label: 'Grow-out',      hours: '16h light / day', color: '#f97316' },
  { max: 999, label: 'Mature',        hours: '14h light / day', color: 'var(--text-2)' },
];

function getPhase(age) {
  return PHASES.find(p => age <= p.max) ?? PHASES[PHASES.length - 1];
}

export default function ChickAgeCard({ age, onAgeChange, disabled }) {
  const phase = getPhase(age ?? 1);

  const increment = () => onAgeChange(Math.min(999, (age ?? 1) + 1));
  const decrement = () => onAgeChange(Math.max(1,   (age ?? 1) - 1));

  return (
    <div className="card">
      <div className="card-label">
        <div className="card-icon" style={{ background: 'var(--cat-yellow-dim)', color: 'var(--cat-yellow)' }}>🐥</div>
        Chick Age Tracker
      </div>

      <div className="age-display">
        <div className="age-number">{age ?? '—'}</div>
        <div className="age-unit">days old</div>
      </div>

      <div className="age-controls">
        <button className="age-btn" onClick={decrement} disabled={disabled || (age ?? 1) <= 1}>−</button>
        <div
          className="age-phase"
          style={{ color: phase.color, borderColor: phase.color }}
        >
          {phase.label}
        </div>
        <button className="age-btn" onClick={increment} disabled={disabled}>+</button>
      </div>

      <div className="age-recommendation">
        📡 Standard: <strong style={{ color: phase.color }}>{phase.hours}</strong>
      </div>
    </div>
  );
}
