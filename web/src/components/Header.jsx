export default function Header({ connected, rssi, lastSeen }) {
  const bars = rssi == null ? 0
    : rssi > -50 ? 4
    : rssi > -65 ? 3
    : rssi > -75 ? 2
    : 1;

  const formatLastSeen = (d) => {
    if (!d) return '';
    return `Updated ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo">CAT</div>
        <div>
          <div className="header-title">PoultryCore IoT</div>
          <div className="header-subtitle">Industrial Management Console</div>
        </div>
      </div>

      <div className="header-status">
        {lastSeen && (
          <span className="last-seen">{formatLastSeen(lastSeen)}</span>
        )}

        {connected && rssi != null && (
          <div className="rssi-display">
            <div className="rssi-bars">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`rssi-bar ${i <= bars ? 'active' : ''}`} />
              ))}
            </div>
            <span>{rssi} dBm</span>
          </div>
        )}

        <div className={`connection-badge ${connected ? 'online' : 'offline'}`}>
          <div className={`status-dot ${connected ? 'online' : 'offline'}`} />
          {connected ? 'MQTT Connected' : 'Offline'}
        </div>
      </div>
    </header>
  );
}
