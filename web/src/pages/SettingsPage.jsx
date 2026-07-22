export default function SettingsPage() {
  return (
    <div className="page">
      <div className="section-title">MQTT Broker</div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-label">
          <div className="card-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>📡</div>
          Connection Details
        </div>
        {[
          { k: 'Broker', v: 'broker.hivemq.com' },
          { k: 'Port (TCP)', v: '1883' },
          { k: 'Port (WebSocket)', v: '8000' },
          { k: 'Client ID Prefix', v: 'poultry_esp32_client' },
          { k: 'Status Topic', v: 'poultry/status' },
          { k: 'Events Topic', v: 'poultry/events' },
          { k: 'Commands Topic', v: 'poultry/commands' },
        ].map(row => (
          <div key={row.k} style={{
            display: 'flex', justifyContent: 'space-between', padding: '10px 0',
            borderBottom: '1px solid var(--border-1)', fontSize: '0.82rem',
          }}>
            <span style={{ color: 'var(--text-2)' }}>{row.k}</span>
            <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, color: 'var(--text-1)' }}>{row.v}</span>
          </div>
        ))}
      </div>

      <div className="section-title">WiFi Configuration (on ESP32)</div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-label">
          <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>📶</div>
          Network
        </div>
        {[
          { k: 'SSID', v: 'MONISH' },
          { k: 'NTP Server', v: 'pool.ntp.org' },
          { k: 'Timezone', v: 'GMT +5:30 (IST)' },
          { k: 'Serial Baud', v: '115200' },
        ].map(row => (
          <div key={row.k} style={{
            display: 'flex', justifyContent: 'space-between', padding: '10px 0',
            borderBottom: '1px solid var(--border-1)', fontSize: '0.82rem',
          }}>
            <span style={{ color: 'var(--text-2)' }}>{row.k}</span>
            <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, color: 'var(--text-1)' }}>{row.v}</span>
          </div>
        ))}
      </div>

      <div className="section-title">Hardware Pin Map</div>
      <div className="card" style={{ maxWidth: 700 }}>
        <div className="card-label">
          <div className="card-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>🔌</div>
          ESP32 DevKit V1 GPIO Assignment
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-2)' }}>
                {['GPIO', 'Device', 'Function'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 12px',
                    fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase',
                    fontSize: '0.68rem', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['18', 'DS18B20', 'Temperature (1-Wire)'],
                ['35', 'LM393 LDR', 'Light detection (digital)'],
                ['26', 'Relay CH1', 'Light 1 control'],
                ['27', 'Relay CH2', 'Light 2 control'],
                ['21', 'LCD', 'I2C SDA'],
                ['22', 'LCD', 'I2C SCL'],
                ['19', 'Button', 'LCD page toggle'],
                ['4', 'LED', 'Light 1 status indicator'],
                ['5', 'LED', 'Light 2 status indicator'],
                ['2', 'LED', 'WiFi status indicator'],
              ].map(([pin, dev, func]) => (
                <tr key={pin} style={{ borderBottom: '1px solid var(--border-1)' }}>
                  <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono'", fontWeight: 700, color: 'var(--accent)' }}>{pin}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-1)' }}>{dev}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-2)' }}>{func}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-title">Database</div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-label">
          <div className="card-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>🗄️</div>
          MongoDB Integration
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
          The backend uses <strong style={{ color: 'var(--text-1)' }}>MongoDB</strong> to persist telemetry, events, and configuration.
          See <code style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem' }}>MONGODB_SCHEMA.md</code> in the web folder for complete collection schemas, indexes, and REST API endpoint specifications.
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['telemetry', 'events', 'commands', 'config'].map(col => (
            <div key={col} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 'var(--radius-xs)',
              fontSize: '0.82rem',
            }}>
              <span style={{ color: 'var(--green)' }}>●</span>
              <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, color: 'var(--text-1)' }}>
                db.{col}
              </span>
              <span style={{ color: 'var(--text-3)', marginLeft: 'auto', fontSize: '0.72rem' }}>
                {col === 'telemetry' ? 'Sensor snapshots (every 2s)'
                : col === 'events' ? 'Alert & state change logs'
                : col === 'commands' ? 'Audit log (optional)'
                : 'System configuration'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
