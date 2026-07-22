import { useEffect, useState, useCallback, useRef } from 'react';
import mqtt from 'mqtt';

// Try WSS (Secure WebSocket) first, fallback to WS (Unencrypted WebSocket)
const BROKER_URLS = [
  'wss://broker.hivemq.com:8884/mqtt',
  'ws://broker.hivemq.com:8000/mqtt'
];

const TOPIC_STATUS   = 'poultry/status';
const TOPIC_EVENTS   = 'poultry/events';
const TOPIC_COMMANDS = 'poultry/commands';

export function useMQTT() {
  const [connected, setConnected]   = useState(false);
  const [telemetry, setTelemetry]   = useState(null);
  const [events,    setEvents]      = useState([]);
  const [lastSeen,  setLastSeen]    = useState(null);
  const clientRef = useRef(null);

  // Fetch initial logs from database on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/events')
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(data => {
        const formatted = data.map(item => ({
          ...item,
          id: item._id,
          receivedAt: new Date(item.timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          })
        }));
        setEvents(formatted);
      })
      .catch(err => {
        console.warn('[Backend] Failed to load event logs from DB, running in memory.', err);
      });
  }, []);

  useEffect(() => {
    const clientId = `poultry_web_${Math.random().toString(16).slice(2, 10)}`;
    let currentUrlIdx = 0;
    let client = null;

    const connectToBroker = (urlIndex) => {
      const url = BROKER_URLS[urlIndex % BROKER_URLS.length];
      console.log(`[MQTT] Trying connection to: ${url}`);

      if (client) {
        client.end(true);
      }

      client = mqtt.connect(url, {
        clientId,
        clean: true,
        keepalive: 60,
        reconnectPeriod: 4000,
        connectTimeout: 10000,
      });

      clientRef.current = client;

      client.on('connect', () => {
        console.log(`[MQTT] Connected to ${url}`);
        setConnected(true);
        client.subscribe([TOPIC_STATUS, TOPIC_EVENTS], { qos: 0 });
      });

      client.on('reconnect', () => {
        console.log('[MQTT] Reconnecting...');
      });

      client.on('close', () => {
        setConnected(false);
      });

      client.on('error', (err) => {
        console.warn(`[MQTT] Connection error on ${url}:`, err);
        setConnected(false);
        // If the first connection method fails, retry using the next fallback URL
        if (urlIndex === 0) {
          setTimeout(() => connectToBroker(1), 1000);
        }
      });

      client.on('message', (topic, payload) => {
        try {
          const rawStr = payload.toString();
          console.log(`[MQTT Message] ${topic}:`, rawStr);
          const data = JSON.parse(rawStr);

          if (topic === TOPIC_STATUS) {
            setTelemetry(data);
            setLastSeen(new Date());
          } else if (topic === TOPIC_EVENTS) {
            const entry = {
              ...data,
              id: `${Date.now()}-${Math.random()}`,
              receivedAt: new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              }),
            };
            setEvents(prev => [entry, ...prev].slice(0, 100));
          }
        } catch (e) {
          console.warn('[MQTT] JSON parse error:', e);
        }
      });
    };

    connectToBroker(0);

    return () => {
      if (client) {
        client.end(true);
      }
    };
  }, []);

  const publish = useCallback((payload) => {
    if (clientRef.current?.connected) {
      const payloadStr = JSON.stringify(payload);
      console.log(`[MQTT Publish] Sending:`, payloadStr);
      clientRef.current.publish(TOPIC_COMMANDS, payloadStr, { qos: 0 });
    } else {
      console.warn('[MQTT Publish Failed] Client not connected');
    }
  }, []);

  return { connected, telemetry, events, lastSeen, publish };
}
