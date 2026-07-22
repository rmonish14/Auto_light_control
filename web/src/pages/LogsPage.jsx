export default function LogsPage({ events }) {
  const getLevel = (l) => {
    if (!l) return 'info';
    const s = l.toLowerCase();
    if (s === 'error' || s === 'critical' || s === 'alert') return 'alert';
    if (s === 'warn' || s === 'warning') return 'warn';
    return 'info';
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 900 }}>
        <div className="card-header">
          <div className="card-label">
            <div className="card-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>📋</div>
            Live Event Stream
          </div>
          <div className="card-badge" style={{
            background: 'var(--green-dim)', borderColor: 'rgba(34,197,94,0.2)', color: 'var(--green)',
          }}>
            {events.length} Events
          </div>
        </div>

        <div className="event-list">
          {events.length > 0 ? events.map(evt => (
            <div className="event-row" key={evt.id}>
              <div className={`event-dot ${getLevel(evt.level)}`} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="event-time">{evt.receivedAt}</span>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: getLevel(evt.level) === 'alert' ? 'var(--red)' : getLevel(evt.level) === 'warn' ? 'var(--accent)' : 'var(--text-3)',
                  }}>
                    {evt.level || 'info'}
                  </span>
                </div>
                <div className="event-msg">{evt.message}</div>
              </div>
            </div>
          )) : (
            <div className="event-empty">
              <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.3 }}>🔔</div>
              No events recorded yet. Listening for MQTT events...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
