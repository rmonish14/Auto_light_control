import { useState } from 'react';

export default function ConfigPage({ data, publish, disabled }) {
  const [thresholds, setThresholds] = useState({
    highTempAlert: 38.0,
    light2OnTemp: data.light2OnTemp ?? 34.0,
    light2OffTemp: data.light2OffTemp ?? 30.0,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (key, value) => {
    setThresholds(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    setSaved(false);
  };

  const handleSave = () => {
    publish({
      configUpdate: {
        highTempAlert: thresholds.highTempAlert,
        light2OnTemp: thresholds.light2OnTemp,
        light2OffTemp: thresholds.light2OffTemp,
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page">
      <div className="section-title">Temperature Thresholds</div>
      <div className="page-grid-2">
        <div className="card">
          <div className="card-label">
            <div className="card-icon" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>🔥</div>
            Alert Thresholds
          </div>

          <div className="form-group">
            <label className="form-label">High Temperature Alert (°C)</label>
            <input
              className="form-input"
              type="number"
              step="0.5"
              value={thresholds.highTempAlert}
              onChange={e => handleChange('highTempAlert', e.target.value)}
              disabled={disabled}
            />
            <div className="form-hint">Triggers LCD interrupt + MQTT alert when exceeded</div>
          </div>

          <div className="form-group">
            <label className="form-label">Light 2 ON Temperature (°C)</label>
            <input
              className="form-input"
              type="number"
              step="0.5"
              value={thresholds.light2OnTemp}
              onChange={e => handleChange('light2OnTemp', e.target.value)}
              disabled={disabled}
            />
            <div className="form-hint">Light 2 activates when temp rises above this value</div>
          </div>

          <div className="form-group">
            <label className="form-label">Light 2 OFF Temperature (°C)</label>
            <input
              className="form-input"
              type="number"
              step="0.5"
              value={thresholds.light2OffTemp}
              onChange={e => handleChange('light2OffTemp', e.target.value)}
              disabled={disabled}
            />
            <div className="form-hint">Light 2 deactivates when temp drops below this value</div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={disabled}>
              💾 Save Thresholds
            </button>
            {saved && (
              <span style={{ color: 'var(--green)', fontSize: '0.82rem', fontWeight: 600, alignSelf: 'center' }}>
                ✅ Sent to device
              </span>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-label">
            <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>📐</div>
            Bulb & Relay Ratings
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Bulb Rated Hours', value: '25,000 hrs', hint: 'Estimated operational lifespan' },
              { label: 'Bulb Rated Cycles', value: '50,000', hint: 'Max ON/OFF switching count' },
              { label: 'Relay Rated Cycles', value: '100,000', hint: 'Mechanical relay switch lifespan' },
              { label: 'Sensor Read Interval', value: '2,000 ms', hint: 'Telemetry upload frequency' },
              { label: 'NVS Save Interval', value: '300,000 ms', hint: 'Runtime persistence to flash (5 min)' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '10px 0', borderBottom: '1px solid var(--border-1)',
              }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 2 }}>{item.hint}</div>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-title">Channel Configuration</div>
      <div className="page-grid-2">
        {[
          { id: 1, name: 'Light 1 — Main Day/Night Lamp', relay: 'GPIO 26', led: 'GPIO 4', control: 'LDR (Auto) / Manual' },
          { id: 2, name: 'Light 2 — Auxiliary Heat Lamp', relay: 'GPIO 27', led: 'GPIO 5', control: 'Temperature / Manual' },
        ].map(ch => (
          <div className="card" key={ch.id}>
            <div className="card-header">
              <div className="card-label">
                <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>💡</div>
                Channel {ch.id}
              </div>
              <div className="status-badge" style={{
                background: 'var(--green-dim)', borderColor: 'rgba(34,197,94,0.2)', color: 'var(--green)',
              }}>ONLINE</div>
            </div>
            {[
              { k: 'Name', v: ch.name },
              { k: 'Relay Pin', v: ch.relay },
              { k: 'LED Pin', v: ch.led },
              { k: 'Control Logic', v: ch.control },
            ].map(row => (
              <div key={row.k} style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                borderBottom: '1px solid var(--border-1)', fontSize: '0.82rem',
              }}>
                <span style={{ color: 'var(--text-2)' }}>{row.k}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-1)', fontFamily: "'JetBrains Mono'" }}>{row.v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
