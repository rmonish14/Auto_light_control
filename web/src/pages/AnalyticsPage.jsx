import { useState, useEffect } from 'react';
import { dbFetchInsights } from '../services/mongodb';

export default function AnalyticsPage({ history, data }) {
  const { l1Cycles = 0, l2Cycles = 0, temperature } = data;
  const [insights, setInsights] = useState(null);
  const [dbStatus, setDbStatus] = useState('connecting');

  useEffect(() => {
    dbFetchInsights()
      .then(data => {
        if (!data) {
          setDbStatus('error');
          return;
        }
        setInsights(data);
        setDbStatus('connected');
      })
      .catch(err => {
        console.warn('[MongoDB Client] Failed to load historical insights from DB.', err.message);
        setDbStatus('error');
      });
  }, []);

  const RATED_SWITCHING_LIMIT = 10000;


  // Channel 2 Switching Calculations
  const ch2SwitchesUsed = l2Cycles;
  const ch2SwitchesRemaining = Math.max(0, RATED_SWITCHING_LIMIT - ch2SwitchesUsed);
  const ch2SwitchingHealthPct = Math.max(0, Math.min(100, (ch2SwitchesRemaining / RATED_SWITCHING_LIMIT) * 100));

  // SVG Chart path builder for Temperature
  const buildSvgPath = (dataArr, key, minVal, maxVal, width = 600, height = 160) => {
    if (!dataArr || dataArr.length < 2) return '';
    const range = (maxVal - minVal) || 1;
    const stepX = width / (dataArr.length - 1);
    
    return dataArr.map((d, idx) => {
      const val = d[key] ?? minVal;
      const x = (idx * stepX).toFixed(1);
      const y = (height - ((val - minVal) / range) * (height - 20) - 10).toFixed(1);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const buildAreaPath = (dataArr, key, minVal, maxVal, width = 600, height = 160) => {
    const linePath = buildSvgPath(dataArr, key, minVal, maxVal, width, height);
    if (!linePath) return '';
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
  };

  const recentData = history && history.length > 0 ? history : [
    { time: '10:00', temperature: temperature ?? 28.5 },
    { time: '10:05', temperature: (temperature ?? 28.5) + 0.2 },
    { time: '10:10', temperature: (temperature ?? 28.5) - 0.1 },
    { time: '10:15', temperature: (temperature ?? 28.5) + 0.3 },
  ];

  const temps = recentData.map(d => d.temperature ?? 28.5);
  const minTemp = Math.floor(Math.min(...temps, 15));
  const maxTemp = Math.ceil(Math.max(...temps, 45));
  const latestTemp = temps[temps.length - 1];

  return (
    <div className="page">
      <div className="section-title">Bulb Switching Lifespan & Thermal Analytics</div>

      {/* KPI Cards — Focused on 10,000 Switching Limit */}
      <div className="page-grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-label">
            <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>🌡️</div>
            Live Temperature
          </div>
          <div className="metric-value" style={{ color: 'var(--accent)', fontSize: latestTemp === -100 ? '2.2rem' : '3.2rem' }}>
            {latestTemp != null ? (latestTemp === -100 ? 'ERROR' : latestTemp.toFixed(1)) : '—'}
            {latestTemp !== -100 && <span className="metric-unit">°C</span>}
          </div>
          <div className="metric-sub">{latestTemp === -100 ? 'Sensor Error' : 'Real-Time Sensor Readout'}</div>
        </div>

        <div className="card">
          <div className="card-label">
            <div className="card-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>🔄</div>
            Relay Remaining Switches
          </div>
          <div className="metric-value" style={{ color: 'var(--green)' }}>
            {ch2SwitchesRemaining.toLocaleString()}
            <span className="metric-unit"> / 10k</span>
          </div>
          <div className="metric-sub">{ch2SwitchingHealthPct.toFixed(1)}% Useful Life Remaining</div>
        </div>
      </div>

      {/* Database Analytics & Insights */}
      <div className="section-title">MongoDB 24-Hour Database Insights</div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-2)', paddingBottom: 12, marginBottom: 16 }}>
          <div className="card-label">
            <div className="card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>🍃</div>
            MongoDB Server Aggregations
          </div>
          <div className="card-badge" style={{
            background: dbStatus === 'connected' ? 'var(--green-dim)' : 'var(--red-dim)',
            color: dbStatus === 'connected' ? 'var(--green)' : 'var(--red)',
            borderColor: dbStatus === 'connected' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
          }}>
            {dbStatus === 'connected' ? '🟢 DATABASE ACTIVE' : dbStatus === 'connecting' ? '🟡 CONNECTING...' : '🔴 DATABASE OFFLINE'}
          </div>
        </div>

        <div className="relay-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          <div className="stat-cell" style={{ textAlign: 'center' }}>
            <div className="stat-cell-label" style={{ fontSize: '0.75rem' }}>24h Average Temp</div>
            <div className="stat-cell-value" style={{ color: 'var(--accent)', fontSize: '1.8rem', marginTop: 4 }}>
              {insights?.averageTemperature != null ? `${insights.averageTemperature.toFixed(1)}°C` : '—'}
            </div>
          </div>
          <div className="stat-cell" style={{ textAlign: 'center' }}>
            <div className="stat-cell-label" style={{ fontSize: '0.75rem' }}>24h Peak Temp (Max)</div>
            <div className="stat-cell-value" style={{ color: 'var(--red)', fontSize: '1.8rem', marginTop: 4 }}>
              {insights?.maxTemperature != null ? `${insights.maxTemperature.toFixed(1)}°C` : '—'}
            </div>
          </div>
          <div className="stat-cell" style={{ textAlign: 'center' }}>
            <div className="stat-cell-label" style={{ fontSize: '0.75rem' }}>24h Lowest Temp (Min)</div>
            <div className="stat-cell-value" style={{ color: 'var(--blue)', fontSize: '1.8rem', marginTop: 4 }}>
              {insights?.minTemperature != null ? `${insights.minTemperature.toFixed(1)}°C` : '—'}
            </div>
          </div>
          <div className="stat-cell" style={{ textAlign: 'center' }}>
            <div className="stat-cell-label" style={{ fontSize: '0.75rem' }}>Stored Telemetry Logs</div>
            <div className="stat-cell-value" style={{ color: 'var(--text-1)', fontSize: '1.8rem', marginTop: 4 }}>
              {insights?.totalRecordCount != null ? insights.totalRecordCount.toLocaleString() : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Switching Lifespan Analytics Gauges */}
      <div className="section-title">Switching Cycle Capacity Analytics (10,000 Max Rating)</div>
      <div className="page-grid-2" style={{ marginBottom: 24 }}>
        {/* Channel 1 Switching Analysis */}
        <div className="card">
          <div className="card-header">
            <div className="card-label">
              <div className="card-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>💡</div>
              Channel 1 — Bulb Switching Health
            </div>
            <div className="card-badge" style={{
              background: ch1SwitchingHealthPct > 20 ? 'var(--green-dim)' : 'var(--red-dim)',
              color: ch1SwitchingHealthPct > 20 ? 'var(--green)' : 'var(--red)',
              borderColor: ch1SwitchingHealthPct > 20 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
            }}>
              {ch1SwitchingHealthPct > 20 ? 'HEALTHY' : 'REPLACE BULB SOON'}
            </div>
          </div>

          <div style={{ margin: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-2)' }}>Remaining Switching Capacity</span>
              <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: 'var(--green)' }}>
                {ch1SwitchesRemaining.toLocaleString()} / 10,000 switches
              </span>
            </div>
            <div className="progress-track" style={{ height: 10 }}>
              <div className="progress-fill" style={{
                width: `${ch1SwitchingHealthPct}%`,
                background: ch1SwitchingHealthPct > 50 ? 'var(--green)' : ch1SwitchingHealthPct > 20 ? 'var(--accent)' : 'var(--red)',
              }} />
            </div>
          </div>

          <div className="relay-stats-row">
            <div className="stat-cell">
              <div className="stat-cell-label">Switches Used</div>
              <div className="stat-cell-value" style={{ color: 'var(--accent)' }}>{ch1SwitchesUsed}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Max Rated Limit</div>
              <div className="stat-cell-value">10,000</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Life Remaining</div>
              <div className="stat-cell-value" style={{ color: 'var(--green)' }}>{ch1SwitchingHealthPct.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Channel 2 Switching Analysis */}
        <div className="card">
          <div className="card-header">
            <div className="card-label">
              <div className="card-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>💡</div>
              Channel 2 — Bulb Switching Health
            </div>
            <div className="card-badge" style={{
              background: ch2SwitchingHealthPct > 20 ? 'var(--green-dim)' : 'var(--red-dim)',
              color: ch2SwitchingHealthPct > 20 ? 'var(--green)' : 'var(--red)',
              borderColor: ch2SwitchingHealthPct > 20 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
            }}>
              {ch2SwitchingHealthPct > 20 ? 'HEALTHY' : 'REPLACE BULB SOON'}
            </div>
          </div>

          <div style={{ margin: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-2)' }}>Remaining Switching Capacity</span>
              <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: 'var(--blue)' }}>
                {ch2SwitchesRemaining.toLocaleString()} / 10,000 switches
              </span>
            </div>
            <div className="progress-track" style={{ height: 10 }}>
              <div className="progress-fill" style={{
                width: `${ch2SwitchingHealthPct}%`,
                background: ch2SwitchingHealthPct > 50 ? 'var(--blue)' : ch2SwitchingHealthPct > 20 ? 'var(--accent)' : 'var(--red)',
              }} />
            </div>
          </div>

          <div className="relay-stats-row">
            <div className="stat-cell">
              <div className="stat-cell-label">Switches Used</div>
              <div className="stat-cell-value" style={{ color: 'var(--accent)' }}>{ch2SwitchesUsed}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Max Rated Limit</div>
              <div className="stat-cell-value">10,000</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Life Remaining</div>
              <div className="stat-cell-value" style={{ color: 'var(--blue)' }}>{ch2SwitchingHealthPct.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Chart: Temperature History */}
      <div className="card">
        <div className="card-header">
          <div className="card-label">
            <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>📈</div>
            Live Temperature Analytics (°C)
          </div>
          <div className="card-badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', borderColor: 'rgba(245,158,11,0.2)' }}>
            LIVE SENSOR STREAM
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          <svg viewBox="0 0 600 160" style={{ width: '100%', height: 200, display: 'block' }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 40, 80, 120, 150].map(y => (
              <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="var(--border-1)" strokeDasharray="4 4" />
            ))}

            {/* Area & Line */}
            <path d={buildAreaPath(recentData, 'temperature', minTemp, maxTemp)} fill="url(#tempGrad)" />
            <path d={buildSvgPath(recentData, 'temperature', minTemp, maxTemp)} fill="none" stroke="#f59e0b" strokeWidth="3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
