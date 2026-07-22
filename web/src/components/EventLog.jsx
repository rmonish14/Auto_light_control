export default function EventLog({ events }) {
  const getEventClass = (level) => {
    if (!level) return 'info';
    const l = level.toLowerCase();
    if (l === 'error' || l === 'critical' || l === 'alert') return 'alert';
    if (l === 'warn' || l === 'warning') return 'warn';
    return 'info';
  };

  return (
    <div className="card event-log">
      <div className="card-label">
        <div className="card-icon" style={{ background: 'rgba(0, 212, 255, 0.1)', color: 'var(--cyan)' }}>📋</div>
        Live Event Logs
      </div>

      <div className="event-list">
        {events && events.length > 0 ? (
          events.map((evt) => (
            <div className="event-item" key={evt.id}>
              <div className={`event-dot ${getEventClass(evt.level)}`} />
              <div className="event-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="event-time">{evt.receivedAt}</span>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    color: getEventClass(evt.level) === 'alert' ? 'var(--red)' : getEventClass(evt.level) === 'warn' ? 'var(--amber)' : 'var(--cyan)'
                  }}>
                    {evt.level || 'info'}
                  </span>
                </div>
                <div className="event-message">{evt.message}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="event-empty">
            <div className="event-empty-icon">🔔</div>
            No events registered yet. Listening for MQTT logs...
          </div>
        )}
      </div>
    </div>
  );
}
