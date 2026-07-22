import { useState } from 'react';
import { getMongoConfig, saveMongoConfig } from '../services/mongodb';

export default function SettingsPage() {
  const [mongoConfig, setMongoConfig] = useState(() => getMongoConfig());
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    saveMongoConfig(mongoConfig);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };
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

      <div className="section-title">MongoDB Integration (Direct Frontend)</div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-label" style={{ marginBottom: 12 }}>
          <div className="card-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>🗄️</div>
          MongoDB Atlas Data API Settings
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
          LumiCore connects directly to your MongoDB database from the browser using the **MongoDB Atlas Data API**. 
          To enable direct uploads, paste your Data API Endpoint and API Key below.
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase' }}>Data API URL Endpoint</label>
            <input 
              type="text" 
              placeholder="https://ap-south-1.aws.data.mongodb-api.com/app/data-xxxx/endpoint/data/v1" 
              value={mongoConfig.url} 
              onChange={e => setMongoConfig(prev => ({ ...prev, url: e.target.value }))}
              style={{
                background: 'var(--bg-3)', border: '1px solid var(--border-1)', color: 'var(--text-1)',
                padding: '10px 12px', borderRadius: 'var(--radius-xs)', fontSize: '0.82rem', width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase' }}>Atlas API Key</label>
            <input 
              type="password" 
              placeholder="••••••••••••••••••••••••••••••••" 
              value={mongoConfig.apiKey} 
              onChange={e => setMongoConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              style={{
                background: 'var(--bg-3)', border: '1px solid var(--border-1)', color: 'var(--text-1)',
                padding: '10px 12px', borderRadius: 'var(--radius-xs)', fontSize: '0.82rem', width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase' }}>Cluster Name</label>
              <input 
                type="text" 
                value={mongoConfig.cluster} 
                onChange={e => setMongoConfig(prev => ({ ...prev, cluster: e.target.value }))}
                style={{
                  background: 'var(--bg-3)', border: '1px solid var(--border-1)', color: 'var(--text-1)',
                  padding: '10px 12px', borderRadius: 'var(--radius-xs)', fontSize: '0.82rem', width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase' }}>Database Name</label>
              <input 
                type="text" 
                value={mongoConfig.database} 
                onChange={e => setMongoConfig(prev => ({ ...prev, database: e.target.value }))}
                style={{
                  background: 'var(--bg-3)', border: '1px solid var(--border-1)', color: 'var(--text-1)',
                  padding: '10px 12px', borderRadius: 'var(--radius-xs)', fontSize: '0.82rem', width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.82rem', fontWeight: 600 }}
            >
              💾 Save Connection Settings
            </button>
            {savedMsg && (
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--green)' }}>
                ✓ MongoDB Settings Saved!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
