import { useState, useEffect } from 'react';

export default function SchedulePage({ data, publish, disabled }) {
  const [schedule, setSchedule] = useState({
    onTime: data.scheduleOnTime || localStorage.getItem('lumi-sched-on') || '18:00',
    offTime: data.scheduleOffTime || localStorage.getItem('lumi-sched-off') || '06:00',
    ch1Enabled: true,
    ch2Enabled: true,
  });

  const [scopeType, setScopeType] = useState('always'); // 'always', 'days', 'months'
  const [scopeValue, setScopeValue] = useState(30);
  const [saved, setSaved] = useState(false);

  // Sync state whenever external telemetry updates or props change
  useEffect(() => {
    const savedOn = localStorage.getItem('lumi-sched-on');
    const savedOff = localStorage.getItem('lumi-sched-off');
    setSchedule(prev => ({
      ...prev,
      onTime: data.scheduleOnTime || savedOn || prev.onTime,
      offTime: data.scheduleOffTime || savedOff || prev.offTime,
    }));
  }, [data.scheduleOnTime, data.scheduleOffTime]);

  const handleSave = () => {
    let computedDays = 0;
    if (scopeType === 'days') {
      computedDays = parseInt(scopeValue) || 1;
    } else if (scopeType === 'months') {
      computedDays = (parseInt(scopeValue) || 1) * 30;
    }

    localStorage.setItem('lumi-sched-on', schedule.onTime);
    localStorage.setItem('lumi-sched-off', schedule.offTime);

    publish({
      mode: 'SCHEDULE',
      scheduleConfig: {
        onTime: schedule.onTime,
        offTime: schedule.offTime,
        ch1Enabled: schedule.ch1Enabled,
        ch2Enabled: schedule.ch2Enabled,
        durationDays: computedDays,
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page">
      <div className="section-title">Automated Time Scheduler</div>

      <div className="page-grid-2">
        {/* Schedule Inputs */}
        <div className="card">
          <div className="card-header">
            <div className="card-label">
              <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>⏰</div>
              Daily Automated Schedule
            </div>
            <div className="card-badge" style={{ background: 'var(--blue-dim)', color: 'var(--blue)', borderColor: 'rgba(59,130,246,0.2)' }}>
              SCHEDULE MODE
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Turn ON Time</label>
            <input
              className="form-input"
              type="time"
              value={schedule.onTime}
              onChange={e => setSchedule({ ...schedule, onTime: e.target.value })}
              disabled={disabled}
            />
            <div className="form-hint">Time when channels automatically energize each day</div>
          </div>

          <div className="form-group">
            <label className="form-label">Turn OFF Time</label>
            <input
              className="form-input"
              type="time"
              value={schedule.offTime}
              onChange={e => setSchedule({ ...schedule, offTime: e.target.value })}
              disabled={disabled}
            />
            <div className="form-hint">Time when channels automatically de-energize each day</div>
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Target Lighting Channels</label>
            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-1)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={schedule.ch1Enabled}
                  onChange={e => setSchedule({ ...schedule, ch1Enabled: e.target.checked })}
                  disabled={disabled}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Light Relay 1 (CH1)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-1)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={schedule.ch2Enabled}
                  onChange={e => setSchedule({ ...schedule, ch2Enabled: e.target.checked })}
                  disabled={disabled}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Light Relay 2 (CH2)
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 18 }}>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Schedule Duration Scope</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-1)', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="scopeType" 
                  value="always" 
                  checked={scopeType === 'always'} 
                  onChange={() => setScopeType('always')} 
                  disabled={disabled}
                  style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
                Always Run Indefinitely (Daily Routine)
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-1)', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="scopeType" 
                  value="days" 
                  checked={scopeType === 'days'} 
                  onChange={() => setScopeType('days')} 
                  disabled={disabled}
                  style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
                Run for a Specific Number of Days
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-1)', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="scopeType" 
                  value="months" 
                  checked={scopeType === 'months'} 
                  onChange={() => setScopeType('months')} 
                  disabled={disabled}
                  style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
                Run for a Specific Number of Months
              </label>
            </div>

            {scopeType !== 'always' && (
              <div style={{ marginTop: 14, animation: 'fadeIn 0.2s ease-in-out' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                  Enter Number of {scopeType === 'days' ? 'Days' : 'Months'}
                </label>
                <input 
                  type="number" 
                  min="1" 
                  className="form-input" 
                  value={scopeValue} 
                  onChange={e => setScopeValue(e.target.value)} 
                  disabled={disabled}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={disabled}>
              💾 Apply Schedule
            </button>
            {saved && (
              <span style={{ color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600, alignSelf: 'center' }}>
                ✅ Schedule Saved!
              </span>
            )}
          </div>
        </div>

        {/* Schedule Target Details */}
        <div className="card">
          <div className="card-header">
            <div className="card-label">
              <div className="card-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>💡</div>
              Target Lighting Channel
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-1)',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>Main Lighting Output (CH2)</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>GPIO 27 Relay Pin · LED Pin 5</div>
              </div>
              <span className="status-badge" style={{ background: 'var(--green-dim)', color: 'var(--green)', borderColor: 'rgba(34,197,94,0.2)' }}>
                ACTIVE TARGET
              </span>
            </div>

            <div style={{
              padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-2)', fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5,
            }}>
              ℹ️ In <strong>Schedule Mode</strong>, the main lighting channel will automatically energize at <strong style={{ color: 'var(--accent)' }}>{schedule.onTime}</strong> and de-energize at <strong style={{ color: 'var(--accent)' }}>{schedule.offTime}</strong> using RTC / NTP synchronized hardware time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
