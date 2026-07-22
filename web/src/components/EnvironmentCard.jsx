export default function EnvironmentCard({ environment, lightIntensity }) {
  const isDark = environment === 'DARK';

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="card-label" style={{ justifyContent: 'center' }}>
        <div className="card-icon" style={{ background: 'var(--cat-yellow-dim)', color: 'var(--cat-yellow)' }}>
          {isDark ? '🌑' : '☀️'}
        </div>
        Environment
      </div>

      <div className={`env-glow ${isDark ? 'dark' : 'bright'}`}>
        {isDark ? '🌙' : '☀️'}
      </div>

      <div className={`env-value ${isDark ? 'dark' : 'bright'}`}>
        {environment ?? '—'}
      </div>

      <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-3)' }}>
        {isDark ? 'SYSTEM IN NIGHT MODE (LIGHTS ACTIVE)' : 'SYSTEM IN DAYTIME MODE (LIGHTS DEACTIVE)'}
      </div>

      {lightIntensity != null && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 6 }}>
            LIGHT LEVEL INTENSITY
          </div>
          <div className="temp-bar">
            <div
              className="temp-bar-fill"
              style={{
                width: `${Math.min(100, lightIntensity)}%`,
                background: 'var(--cat-yellow)',
              }}
            />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace', fontWeight: 'bold' }}>
            {lightIntensity}%
          </div>
        </div>
      )}
    </div>
  );
}
