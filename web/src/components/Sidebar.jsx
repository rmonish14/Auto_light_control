const NAV_ITEMS = [
  { id: 'home',        icon: '📊', label: 'Dashboard' },
  { id: 'analytics',   icon: '📈', label: 'Analytics' },
  { id: 'channels',    icon: '💡', label: 'Light Channels' },
  { id: 'schedule',    icon: '⏰', label: 'Time Scheduler' },
  { id: 'maintenance', icon: '🔧', label: 'Maintenance' },
  { id: 'config',      icon: '⚙️', label: 'Configuration' },
  { id: 'settings',    icon: '💻', label: 'System Settings' },
];

export default function Sidebar({ activePage, onNavigate, connected, theme, onThemeToggle }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ background: 'var(--accent)', color: '#000' }}>⚡</div>
          <div>
            <div className="sidebar-logo-text">LumiCore</div>
            <div className="sidebar-logo-sub">Industrial Light & Maintenance</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Facility Control</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className={`conn-status ${connected ? 'online' : 'offline'}`}>
          <div className={`conn-dot ${connected ? 'online' : 'offline'}`} />
          <span>{connected ? 'MQTT System Online' : 'System Offline'}</span>
        </div>

        <button className="theme-toggle" onClick={onThemeToggle}>
          <span className="nav-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
}
