import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mqtt from 'mqtt';
import { MongoClient } from 'mongodb';

dotenv.config();

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/poultrycore';
const mqttUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(mongoUri);
let db;

async function initDb() {
  try {
    await client.connect();
    db = client.db();
    console.log('[MongoDB] Connected successfully');

    // Create indexes for optimal querying
    await db.collection('telemetry').createIndex({ "timestamp": -1 });
    await db.collection('telemetry').createIndex({ "status.temperature": 1 });
    await db.collection('events').createIndex({ "timestamp": -1 });
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
  }
}

// Subscribe and listen to MQTT topics
function initMqttBridge() {
  console.log(`[MQTT] Connecting to broker at ${mqttUrl}`);
  const mqttClient = mqtt.connect(mqttUrl, {
    clientId: `lumicore_backend_${Math.random().toString(16).substring(2, 8)}`,
  });

  mqttClient.on('connect', () => {
    console.log('[MQTT] Connected to broker');
    mqttClient.subscribe(['poultry/status', 'poultry/events'], (err) => {
      if (err) {
        console.error('[MQTT] Subscription failed:', err);
      } else {
        console.log('[MQTT] Subscribed to poultry/status and poultry/events');
      }
    });
  });

  mqttClient.on('message', async (topic, payload) => {
    try {
      const payloadStr = payload.toString();
      const parsedData = JSON.parse(payloadStr);
      
      const doc = {
        ...parsedData,
        deviceId: 'poultry_esp32_client',
        timestamp: new Date(),
      };

      if (topic === 'poultry/status') {
        if (db) {
          await db.collection('telemetry').insertOne(doc);
          console.log(`[Bridge] Stored status telemetry: Temp ${parsedData.status?.temperature}°C`);
        }
      } else if (topic === 'poultry/events') {
        if (db) {
          await db.collection('events').insertOne(doc);
          console.log(`[Bridge] Stored event: ${parsedData.message}`);
        }
      }
    } catch (err) {
      console.error('[Bridge] Failed to process message:', err.message);
    }
  });

  mqttClient.on('error', (err) => {
    console.error('[MQTT] Client error:', err);
  });
}

// ------------------------------------------------------------------
// Express API Endpoints
// ------------------------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', databaseConnected: !!db });
});

// Latest Telemetry Status
app.get('/api/telemetry/latest', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  try {
    const latest = await db.collection('telemetry')
      .find()
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (latest.length === 0) {
      return res.status(404).json({ error: 'No telemetry documents found' });
    }
    res.json(latest[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Telemetry History (for charts)
app.get('/api/telemetry/history', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  const limit = parseInt(req.query.limit) || 100;

  try {
    const history = await db.collection('telemetry')
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    // Return in chronological order
    res.json(history.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Event Logs
app.get('/api/events', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  const limit = parseInt(req.query.limit) || 50;

  try {
    const events = await db.collection('events')
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insights Page Aggregations
app.get('/api/insights', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  try {
    // 1. Fetch latest record for current counts/modes
    const latest = await db.collection('telemetry')
      .find()
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (latest.length === 0) {
      return res.status(404).json({ error: 'No data available for insights' });
    }

    const currentStatus = latest[0];

    // 2. Fetch last 24 hours of telemetry for thermal aggregates
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTelemetries = await db.collection('telemetry')
      .find({
        timestamp: { $gte: oneDayAgo },
        'status.temperature': { $ne: -100.0 } // exclude disconnected error values
      })
      .toArray();

    let averageTemp = null;
    let minTemp = null;
    let maxTemp = null;

    if (recentTelemetries.length > 0) {
      const temps = recentTelemetries.map(t => t.status?.temperature).filter(t => t != null);
      if (temps.length > 0) {
        const sum = temps.reduce((acc, v) => acc + v, 0);
        averageTemp = sum / temps.length;
        minTemp = Math.min(...temps);
        maxTemp = Math.max(...temps);
      }
    }

    // 3. Extract metrics
    const l1Cycles = currentStatus.maintenance?.light1OnCount || 0;
    const l2Cycles = currentStatus.maintenance?.light2OnCount || 0;
    const l1Runtime = currentStatus.maintenance?.totalLight1OnTime || 0;
    const l2Runtime = currentStatus.maintenance?.totalLight2OnTime || 0;

    // Remaining useful switching calculations out of 10,000 cycles
    const RATED_SWITCHING_LIMIT = 10000;
    const l1Remaining = Math.max(0, RATED_SWITCHING_LIMIT - l1Cycles);
    const l2Remaining = Math.max(0, RATED_SWITCHING_LIMIT - l2Cycles);
    const l1Health = Math.max(0, (l1Remaining / RATED_SWITCHING_LIMIT) * 100);
    const l2Health = Math.max(0, (l2Remaining / RATED_SWITCHING_LIMIT) * 100);

    res.json({
      averageTemperature: averageTemp != null ? parseFloat(averageTemp.toFixed(1)) : null,
      minTemperature: minTemp,
      maxTemperature: maxTemp,
      totalRecordCount: recentTelemetries.length,
      channels: {
        ch1: {
          cycles: l1Cycles,
          remaining: l1Remaining,
          health: parseFloat(l1Health.toFixed(1)),
          runtimeHours: parseFloat((l1Runtime / 3600.0).toFixed(1))
        },
        ch2: {
          cycles: l2Cycles,
          remaining: l2Remaining,
          health: parseFloat(l2Health.toFixed(1)),
          runtimeHours: parseFloat((l2Runtime / 3600.0).toFixed(1))
        }
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`[Express] Listening on port ${port}`);
  initDb().then(() => {
    initMqttBridge();
  });
});
