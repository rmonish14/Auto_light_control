import { useState, useEffect } from 'react';
import { useMQTT } from './hooks/useMQTT';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ChannelsPage from './pages/ChannelsPage';
import SchedulePage from './pages/SchedulePage';
import MaintenancePage from './pages/MaintenancePage';
import LogsPage from './pages/LogsPage';
import ConfigPage from './pages/ConfigPage';
import SettingsPage from './pages/SettingsPage';

function get(obj, path, fallback = null) {
  if (!obj) return fallback;
  
  // Direct property check
  if (obj[path] !== undefined && obj[path] !== null) return obj[path];

  // Slash path split
  const parts = path.split('/');
  let curr = obj;
  let found = true;
  for (const p of parts) {
    if (curr && curr[p] !== undefined && curr[p] !== null) {
      curr = curr[p];
    } else {
      found = false;
      break;
    }
  }
  if (found && curr !== undefined && curr !== null) return curr;

  // Last key check
  const lastKey = parts[parts.length - 1];
  if (obj[lastKey] !== undefined && obj[lastKey] !== null) return obj[lastKey];

  return fallback;
}

const PAGE_TITLES = {
  home: 'Facility Dashboard',
  analytics: 'Switching Lifespan & Thermal Analytics',
  channels: 'Multi-Channel Control (10k Switch Limit)',
  schedule: 'Time Scheduler Configuration',
  maintenance: 'Facility Maintenance & Lifetime',
  logs: 'System Event Logs',
  config: 'Facility Threshold Configuration',
  settings: 'System & Database Integration',
};

export default function App() {
  const { connected, telemetry, events, lastSeen, publish } = useMQTT();
  const [page, setPage] = useState('home');
  const [theme, setTheme] = useState(() => localStorage.getItem('lumi-theme') || 'dark');
  const [isSimulator, setIsSimulator] = useState(false);

  // Local state for immediate UI responsiveness
  const [localMode, setLocalMode] = useState(null);
  const [localL1, setLocalL1] = useState(null);
  const [localL2, setLocalL2] = useState(null);
  const [scheduleOnTime, setScheduleOnTime] = useState('07:00');
  const [scheduleOffTime, setScheduleOffTime] = useState('19:00');

  // Telemetry History buffer for Analytics Charts (up to 40 samples)
  const [history, setHistory] = useState([]);

  // Mock telemetry for simulator
  const [mockTelemetry, setMockTelemetry] = useState({
    status: { temperature: 28.5, environment: 'BRIGHT', lightIntensity: 85, light1Status: false, light2Status: false, wifiRSSI: -62 },
    settings: { mode: 'AUTO', scheduleOnTime: '07:00', scheduleOffTime: '19:00', light2OnTemp: 34.0, light2OffTemp: 30.0 },
    maintenance: { installationDate: '2024-01-15', light1OnCount: 142, light2OnCount: 98, totalLight1OnTime: 45200, totalLight2OnTime: 23100, bulbHealth: 98.5, alerts: { highTemp: false, replaceSoon: false, endOfLife: false } },
  });
  const [mockEvents, setMockEvents] = useState([
    { id: '1', level: 'info', message: 'LumiCore System Initialized.', receivedAt: new Date().toLocaleTimeString() },
  ]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lumi-theme', theme);
  }, [theme]);

  // Fetch initial telemetry history from backend on mount
  useEffect(() => {
    if (isSimulator) return;
    fetch('http://localhost:5000/api/telemetry/history?limit=120')
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(data => {
        const formatted = data.map(item => {
          const d = new Date(item.timestamp);
          const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          return {
            time: timeStr,
            temperature: get(item, 'status/temperature', 28.5)
          };
        }).filter(t => t.temperature !== -100);
        setHistory(formatted);
      })
      .catch(err => {
        console.warn('[Backend] Telemetry history fetch failed, using local buffer.', err);
      });
  }, [isSimulator]);

  // Telemetry historical logger for Temperature SVG chart (live messages)
  useEffect(() => {
    const rawTemp = get(telemetry || mockTelemetry, 'status/temperature', 28.5);
    const timeLabel = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (rawTemp != null && rawTemp !== -100) {
      setHistory(prev => {
        // Prevent duplicate entries for the same timestamp
        if (prev.length > 0 && prev[prev.length - 1].time === timeLabel) return prev;
        return [
          ...prev,
          { time: timeLabel, temperature: rawTemp }
        ].slice(-120);
      });
    }
  }, [telemetry, mockTelemetry]);

  // Sync state when new telemetry arrives from hardware
  useEffect(() => {
    if (telemetry && !isSimulator) {
      const hwMode = get(telemetry, 'settings/mode');
      const hwL1 = get(telemetry, 'status/light1Status');
      const hwL2 = get(telemetry, 'status/light2Status');
      const hwOn = get(telemetry, 'settings/scheduleOnTime');
      const hwOff = get(telemetry, 'settings/scheduleOffTime');

      if (hwMode) setLocalMode(hwMode);
      if (hwL1 !== null) setLocalL1(hwL1);
      if (hwL2 !== null) setLocalL2(hwL2);
      if (hwOn) setScheduleOnTime(hwOn);
      if (hwOff) setScheduleOffTime(hwOff);
    }
  }, [telemetry, isSimulator]);

  // Simulator background drift
  useEffect(() => {
    if (!isSimulator) return;
    const interval = setInterval(() => {
      setMockTelemetry(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.status.temperature = Math.max(15, Math.min(45, next.status.temperature + (Math.random() - 0.5) * 0.4));
        
        if (Math.random() < 0.04) {
          const newEnv = next.status.environment === 'BRIGHT' ? 'DARK' : 'BRIGHT';
          next.status.environment = newEnv;
          next.status.lightIntensity = newEnv === 'BRIGHT' ? 80 + Math.floor(Math.random() * 20) : Math.floor(Math.random() * 15);
          if (next.settings.mode === 'AUTO') {
            next.status.light1Status = newEnv === 'DARK';
            next.status.light2Status = newEnv === 'DARK';
          }
        }
        next.maintenance.alerts.highTemp = next.status.temperature > 38;
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isSimulator]);

  const addMockEvent = (level, message) => {
    setMockEvents(prev => [{ id: `${Date.now()}`, level, message, receivedAt: new Date().toLocaleTimeString() }, ...prev].slice(0, 100));
  };

  // Derived state
  const activeData = isSimulator ? mockTelemetry : telemetry;
  const activeEvents = isSimulator ? mockEvents : events;
  const activeConnected = isSimulator ? true : connected;

  const mode = localMode ?? get(activeData, 'settings/mode', 'AUTO');
  const light1Status = localL1 ?? get(activeData, 'status/light1Status', false);
  const light2Status = localL2 ?? get(activeData, 'status/light2Status', false);

  const dataBundle = {
    temperature: get(activeData, 'status/temperature'),
    environment: get(activeData, 'status/environment', null),
    lightIntensity: get(activeData, 'status/lightIntensity'),
    wifiRSSI: get(activeData, 'status/wifiRSSI'),
    light1Status,
    light2Status,
    mode,
    scheduleOnTime: get(activeData, 'settings/scheduleOnTime', scheduleOnTime),
    scheduleOffTime: get(activeData, 'settings/scheduleOffTime', scheduleOffTime),
    installationDate: get(activeData, 'maintenance/installationDate', '2024-01-15'),
    light2OnTemp: get(activeData, 'settings/light2OnTemp', 34),
    light2OffTemp: get(activeData, 'settings/light2OffTemp', 30),
    l1Cycles: get(activeData, 'maintenance/light1OnCount', 0),
    l2Cycles: get(activeData, 'maintenance/light2OnCount', 0),
    l1Runtime: get(activeData, 'maintenance/totalLight1OnTime', 0),
    l2Runtime: get(activeData, 'maintenance/totalLight2OnTime', 0),
    bulbHealth: get(activeData, 'maintenance/bulbHealth', 100),
    highTempAlert: get(activeData, 'maintenance/alerts/highTemp', false),
  };

  // Handlers
  const handleModeChange = (newMode) => {
    setLocalMode(newMode);
    if (isSimulator) {
      setMockTelemetry(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next.settings.mode = newMode;
        if (newMode !== 'MANUAL') {
          const dark = next.status.environment === 'DARK';
          next.status.light1Status = dark;
          next.status.light2Status = dark;
          setLocalL1(dark);
          setLocalL2(dark);
        }
        return next;
      });
      addMockEvent('info', `Mode changed to ${newMode}`);
    } else {
      publish({ mode: newMode });
    }
  };

  const handleToggle = (relayNum, currentVal) => {
    const newVal = !currentVal;
    if (mode !== 'MANUAL') {
      setLocalMode('MANUAL');
      if (!isSimulator) publish({ mode: 'MANUAL' });
    }

    if (relayNum === 1) {
      setLocalL1(newVal);
      if (isSimulator) {
        setMockTelemetry(prev => { 
          const n = JSON.parse(JSON.stringify(prev)); 
          n.status.light1Status = newVal; 
          if (newVal) n.maintenance.light1OnCount = (n.maintenance.light1OnCount || 0) + 1;
          return n; 
        });
        addMockEvent('info', `Channel 1 toggled ${newVal ? 'ON' : 'OFF'}`);
      } else {
        publish({ light1Override: newVal });
      }
    } else {
      setLocalL2(newVal);
      if (isSimulator) {
        setMockTelemetry(prev => { 
          const n = JSON.parse(JSON.stringify(prev)); 
          n.status.light2Status = newVal; 
          if (newVal) n.maintenance.light2OnCount = (n.maintenance.light2OnCount || 0) + 1;
          return n; 
        });
        addMockEvent('info', `Channel 2 toggled ${newVal ? 'ON' : 'OFF'}`);
      } else {
        publish({ light2Override: newVal });
      }
    }
  };

  const rssi = dataBundle.wifiRSSI;
  const bars = rssi == null ? 0 : rssi > -50 ? 4 : rssi > -65 ? 3 : rssi > -75 ? 2 : 1;
  const hasNoData = !telemetry && !connected && !isSimulator;

  return (
    <>
      <Sidebar
        activePage={page}
        onNavigate={setPage}
        connected={activeConnected}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />

      <div className="main-content">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-title">{PAGE_TITLES[page]}</div>
          <div className="topbar-right">
            {!isSimulator && (
              <button 
                className="sim-badge" 
                style={{ background: isSimulator ? 'var(--blue-dim)' : 'var(--bg-2)', borderColor: 'var(--border-2)', color: 'var(--text-1)' }}
                onClick={() => setIsSimulator(true)}
              >
                🧪 Sandbox Simulator Mode
              </button>
            )}
            {isSimulator && (
              <button className="sim-badge" onClick={() => { setIsSimulator(false); setMockEvents([]); }}>
                📡 Live Hardware Mode — Connect
              </button>
            )}
            {lastSeen && !isSimulator && (
              <span className="topbar-meta">
                Updated {lastSeen.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            {activeConnected && rssi != null && (
              <div className="rssi-display">
                <div className="rssi-bars">
                  {[1,2,3,4].map(i => <div key={i} className={`rssi-bar ${i <= bars ? 'active' : ''}`} />)}
                </div>
                {rssi} dBm
              </div>
            )}
          </div>
        </div>

        {/* Alert strip */}
        {dataBundle.highTempAlert && (
          <div className="alert-strip">
            ⚠️ HIGH TEMPERATURE ALARM — Ambient temperature exceeds safe threshold!
          </div>
        )}

        {/* Page content */}
        {hasNoData ? (
          <div className="loading-screen">
            <div className="spinner" />
            <div style={{ color: 'var(--text-1)', fontSize: '1rem', fontWeight: 600 }}>Connecting to MQTT Broker (broker.hivemq.com)...</div>
            <div style={{ color: 'var(--text-3)', fontSize: '0.8rem', maxWidth: 450, textAlign: 'center' }}>
              Listening for ESP32 telemetry on topic <code style={{ color: 'var(--accent)' }}>poultry/status</code>. Make sure your ESP32 is powered ON.
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setIsSimulator(true)}>
              🧪 Launch Simulator Mode
            </button>
          </div>
        ) : (
          <>
            {page === 'home' && <HomePage data={dataBundle} />}
            {page === 'analytics' && <AnalyticsPage history={history} data={dataBundle} />}
            {page === 'channels' && (
              <ChannelsPage
                data={dataBundle}
                onToggle={handleToggle}
                onModeChange={handleModeChange}
                disabled={false}
              />
            )}
            {page === 'schedule' && <SchedulePage data={dataBundle} publish={publish} disabled={false} />}
            {page === 'maintenance' && <MaintenancePage data={dataBundle} />}
            {page === 'logs' && <LogsPage events={activeEvents} />}
            {page === 'config' && <ConfigPage data={dataBundle} publish={publish} disabled={false} />}
            {page === 'settings' && <SettingsPage />}
          </>
        )}
      </div>
    </>
  );
}
