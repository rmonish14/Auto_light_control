# MongoDB Schema Reference — PoultryCore IoT

> **For**: Backend developer integrating MongoDB with the MQTT broker  
> **MQTT Broker**: `broker.hivemq.com:1883` (WebSocket: port `8000`)  
> **Topics**: `poultry/status`, `poultry/events`, `poultry/commands`

---

## 1. Collection: `telemetry`

Every 2 seconds the ESP32 publishes a JSON payload to `poultry/status`.  
Your MQTT-to-MongoDB bridge should subscribe to this topic and insert each message as a document.

### Schema

```json
{
  "_id": "ObjectId",
  "deviceId": "poultry_esp32_client",
  "timestamp": "ISODate",

  "status": {
    "temperature": 28.5,
    "environment": "DARK",
    "lightIntensity": 12,
    "light1Status": true,
    "light2Status": true,
    "wifiRSSI": -62
  },

  "settings": {
    "mode": "AUTO",
    "chickAgeDays": 5,
    "light2OnTemp": 34.0,
    "light2OffTemp": 30.0
  },

  "maintenance": {
    "light1OnCount": 142,
    "light2OnCount": 98,
    "totalLight1OnTime": 45230,
    "totalLight2OnTime": 23100,
    "bulbHealth": 96.2,
    "alerts": {
      "highTemp": false,
      "replaceSoon": false,
      "endOfLife": false
    }
  }
}
```

### Field Details

| Path | Type | Unit | Description |
|---|---|---|---|
| `status.temperature` | `float` | °C | DS18B20 sensor reading. `-100` means sensor error |
| `status.environment` | `string` | — | `"DARK"` or `"BRIGHT"` from LDR module |
| `status.lightIntensity` | `int` | % | Analog light percentage (0–100) |
| `status.light1Status` | `boolean` | — | Relay 1 state (`true` = ON) |
| `status.light2Status` | `boolean` | — | Relay 2 state (`true` = ON) |
| `status.wifiRSSI` | `int` | dBm | WiFi signal strength |
| `settings.mode` | `string` | — | `"AUTO"`, `"MANUAL"`, or `"SCHEDULE"` |
| `settings.chickAgeDays` | `int` | days | Age of chicks (1–999) |
| `settings.light2OnTemp` | `float` | °C | Threshold to turn ON Light 2 |
| `settings.light2OffTemp` | `float` | °C | Threshold to turn OFF Light 2 |
| `maintenance.light1OnCount` | `int` | — | Total ON/OFF cycles for Relay 1 |
| `maintenance.light2OnCount` | `int` | — | Total ON/OFF cycles for Relay 2 |
| `maintenance.totalLight1OnTime` | `int` | seconds | Cumulative runtime of Relay 1 |
| `maintenance.totalLight2OnTime` | `int` | seconds | Cumulative runtime of Relay 2 |
| `maintenance.bulbHealth` | `float` | % | Estimated bulb health (0–100) |
| `maintenance.alerts.highTemp` | `boolean` | — | `true` when temp > 38°C |
| `maintenance.alerts.replaceSoon` | `boolean` | — | `true` when bulb health < 20% |
| `maintenance.alerts.endOfLife` | `boolean` | — | `true` when runtime exceeds rated hours |

### Suggested Indexes

```javascript
db.telemetry.createIndex({ "timestamp": -1 });
db.telemetry.createIndex({ "deviceId": 1, "timestamp": -1 });
db.telemetry.createIndex({ "status.temperature": 1 });
```

---

## 2. Collection: `events`

The ESP32 publishes event logs to `poultry/events` when significant state changes occur.

### Schema

```json
{
  "_id": "ObjectId",
  "deviceId": "poultry_esp32_client",
  "timestamp": "ISODate",
  "message": "ALERT: Dangerous High Temperature of 39.2 C inside poultry house!",
  "level": "alert"
}
```

### Event Types Published by ESP32

| Event Message Pattern | Level | Trigger |
|---|---|---|
| `"ALERT: Dangerous High Temperature of XX.X C..."` | `alert` | Temp > 38°C |
| `"Alert cleared: Temperature returned to normal..."` | `info` | Temp drops back below 38°C |
| `"Bulb replacement recommended..."` | `warn` | Bulb health < 20% |
| `"System mode changed to AUTO/MANUAL/SCHEDULE"` | `info` | Mode change via MQTT command |
| `"Light 1/2 manually toggled ON/OFF"` | `info` | Manual override from dashboard |

### Suggested Indexes

```javascript
db.events.createIndex({ "timestamp": -1 });
db.events.createIndex({ "level": 1, "timestamp": -1 });
```

---

## 3. Collection: `commands` (Optional Audit Log)

When the web dashboard sends a command, it publishes to `poultry/commands`.  
You can optionally log these for auditing.

### Schema

```json
{
  "_id": "ObjectId",
  "timestamp": "ISODate",
  "source": "web_dashboard",
  "command": {
    "mode": "MANUAL",
    "light1Override": true,
    "light2Override": false,
    "chickAgeDays": 12
  }
}
```

> **Note**: Not all fields are present in every command. The ESP32 only processes fields that exist in the JSON.

---

## 4. Collection: `config` (Single Document)

Store the system's live configuration. The web dashboard reads this on load and writes changes back.

### Schema

```json
{
  "_id": "poultry_config",
  "thresholds": {
    "highTempAlert": 38.0,
    "light2OnTemp": 34.0,
    "light2OffTemp": 30.0
  },
  "bulbRatings": {
    "ratedHours": 25000,
    "ratedCycles": 50000,
    "relayRatedCycles": 100000
  },
  "channels": [
    {
      "id": 1,
      "name": "Light 1 — Main Day/Night Lamp",
      "relayPin": 26,
      "ledPin": 4,
      "enabled": true
    },
    {
      "id": 2,
      "name": "Light 2 — Auxiliary Heat Lamp",
      "relayPin": 27,
      "ledPin": 5,
      "enabled": true
    }
  ],
  "mqtt": {
    "broker": "broker.hivemq.com",
    "port": 1883,
    "topicStatus": "poultry/status",
    "topicEvents": "poultry/events",
    "topicCommands": "poultry/commands"
  },
  "updatedAt": "ISODate"
}
```

---

## 5. MQTT Bridge Setup (Node.js Example)

```javascript
const mqtt = require('mqtt');
const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'poultrycore';

async function main() {
  const mongo = await MongoClient.connect(MONGO_URI);
  const db = mongo.db(DB_NAME);

  const client = mqtt.connect('mqtt://broker.hivemq.com:1883');

  client.on('connect', () => {
    client.subscribe(['poultry/status', 'poultry/events']);
    console.log('[Bridge] Subscribed to MQTT topics');
  });

  client.on('message', async (topic, payload) => {
    const data = JSON.parse(payload.toString());
    const doc = {
      ...data,
      deviceId: 'poultry_esp32_client',
      timestamp: new Date(),
    };

    if (topic === 'poultry/status') {
      await db.collection('telemetry').insertOne(doc);
    } else if (topic === 'poultry/events') {
      await db.collection('events').insertOne(doc);
    }
  });
}

main().catch(console.error);
```

---

## 6. REST API Endpoints (Recommended)

Your friend's backend should expose these endpoints for the web dashboard:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/telemetry/latest` | Returns the most recent telemetry document |
| `GET` | `/api/telemetry/history?hours=24` | Returns telemetry array for charting |
| `GET` | `/api/events?limit=50` | Returns latest event logs |
| `GET` | `/api/config` | Returns current system config |
| `PUT` | `/api/config/thresholds` | Updates threshold values |
| `PUT` | `/api/config/channels/:id` | Updates a specific channel config |
| `POST` | `/api/commands` | Sends a command to MQTT and logs it |
