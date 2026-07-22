import { useState } from 'react';

export default function SchedulePage({ data, publish, disabled }) {
  const [schedule, setSchedule] = useState({
    onTime: data.scheduleOnTime || '07:00',
    offTime: data.scheduleOffTime || '19:00',
    ch1Enabled: true,
    ch2Enabled: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    publish({
      scheduleConfig: {
        onTime: schedule.onTime,
        offTime: schedule.offTime,
        ch1Enabled: schedule.ch1Enabled,
        ch2Enabled: schedule.ch2Enabled,
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

        {/* Channels Schedule Assignment */}
        <div className="card">
          <div className="card-header">
            <div className="card-label">
              <div className="card-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>💡</div>
              Channel Assignment
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-1)',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>Channel 1 — Primary Bay Lighting</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>GPIO 26 Relay Output</div>
              </div>
              <input
                type="checkbox"
                checked={schedule.ch1Enabled}
                onChange={e => setSchedule({ ...schedule, ch1Enabled: e.target.checked })}
                style={{ width: 20, height: 20, cursor: 'pointer' }}
              />
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-1)',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>Channel 2 — Auxiliary Lighting</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>GPIO 27 Relay Output</div>
              </div>
              <input
                type="checkbox"
                checked={schedule.ch2Enabled}
                onChange={e => setSchedule({ ...schedule, ch2Enabled: e.target.checked })}
                style={{ width: 20, height: 20, cursor: 'pointer' }}
              />
            </div>

            <div style={{
              padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-2)', fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5,
            }}>
              ℹ️ In <strong>Schedule Mode</strong>, assigned channels will energize at <strong style={{ color: 'var(--accent)' }}>{schedule.onTime}</strong> and de-energize at <strong style={{ color: 'var(--accent)' }}>{schedule.offTime}</strong> using RTC / NTP synchronized hardware time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
