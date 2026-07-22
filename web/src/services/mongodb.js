// MongoDB Atlas Data API client for direct frontend storage & querying

export function getMongoConfig() {
  const url = localStorage.getItem('mongo-api-url') || '';
  const apiKey = localStorage.getItem('mongo-api-key') || '';
  const cluster = localStorage.getItem('mongo-cluster') || 'Cluster0';
  const database = localStorage.getItem('mongo-database') || 'poultrycore';
  
  return { url, apiKey, cluster, database, isConfigured: !!(url && apiKey) };
}

export function saveMongoConfig(config) {
  localStorage.setItem('mongo-api-url', config.url || '');
  localStorage.setItem('mongo-api-key', config.apiKey || '');
  localStorage.setItem('mongo-cluster', config.cluster || 'Cluster0');
  localStorage.setItem('mongo-database', config.database || 'poultrycore');
}

async function request(action, collection, payload = {}) {
  const config = getMongoConfig();
  if (!config.isConfigured) {
    throw new Error('MongoDB Data API credentials not configured in Settings.');
  }

  const endpoint = `${config.url.replace(/\/$/, '')}/action/${action}`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Request-Headers': '*',
      'api-key': config.apiKey,
    },
    body: JSON.stringify({
      dataSource: config.cluster,
      database: config.database,
      collection,
      ...payload
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[MongoDB Atlas] ${response.statusText}: ${errText}`);
  }

  return response.json();
}

// 1. Insert Telemetry Status Document
export async function dbSaveTelemetry(statusData) {
  try {
    const doc = {
      ...statusData,
      deviceId: 'poultry_esp32_client',
      timestamp: { $date: new Date().toISOString() }, // MongoDB extended JSON date format
    };
    return await request('insertOne', 'telemetry', { document: doc });
  } catch (err) {
    console.warn('[MongoDB Client] Failed to store telemetry:', err.message);
    throw err;
  }
}

// 2. Insert Event Log Document
export async function dbSaveEvent(eventData) {
  try {
    const doc = {
      ...eventData,
      deviceId: 'poultry_esp32_client',
      timestamp: { $date: new Date().toISOString() },
    };
    return await request('insertOne', 'events', { document: doc });
  } catch (err) {
    console.warn('[MongoDB Client] Failed to store event:', err.message);
    throw err;
  }
}

// 3. Fetch Telemetry History (sorted chronologically)
export async function dbFetchTelemetryHistory(limit = 100) {
  const result = await request('find', 'telemetry', {
    sort: { timestamp: -1 },
    limit: limit
  });
  
  if (!result.documents) return [];
  // Return in chronological order
  return result.documents.reverse();
}

// 4. Fetch Event Logs
export async function dbFetchEvents(limit = 50) {
  const result = await request('find', 'events', {
    sort: { timestamp: -1 },
    limit: limit
  });
  return result.documents || [];
}

// 5. Aggregate 24h Insights
export async function dbFetchInsights() {
  const config = getMongoConfig();
  if (!config.isConfigured) return null;

  try {
    // A. Get latest status document for cycles and health
    const latestResult = await request('find', 'telemetry', {
      sort: { timestamp: -1 },
      limit: 1
    });

    const currentStatus = latestResult.documents?.[0] || null;

    // B. Get last 24h readings for temperature min/max/avg
    const oneDayAgoStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const historyResult = await request('find', 'telemetry', {
      filter: {
        timestamp: { $gte: { $date: oneDayAgoStr } },
        'status.temperature': { $ne: -100.0 }
      },
      sort: { timestamp: -1 },
      limit: 1000
    });

    const recentRecords = historyResult.documents || [];

    let averageTemp = null;
    let minTemp = null;
    let maxTemp = null;

    if (recentRecords.length > 0) {
      const temps = recentRecords.map(r => r.status?.temperature).filter(t => t != null);
      if (temps.length > 0) {
        const sum = temps.reduce((acc, v) => acc + v, 0);
        averageTemp = sum / temps.length;
        minTemp = Math.min(...temps);
        maxTemp = Math.max(...temps);
      }
    }

    const l1Cycles = currentStatus?.maintenance?.light1OnCount || 0;
    const l2Cycles = currentStatus?.maintenance?.light2OnCount || 0;
    const l1Runtime = currentStatus?.maintenance?.totalLight1OnTime || 0;
    const l2Runtime = currentStatus?.maintenance?.totalLight2OnTime || 0;

    const RATED_SWITCHING_LIMIT = 10000;
    const l1Remaining = Math.max(0, RATED_SWITCHING_LIMIT - l1Cycles);
    const l2Remaining = Math.max(0, RATED_SWITCHING_LIMIT - l2Cycles);
    const l1Health = Math.max(0, (l1Remaining / RATED_SWITCHING_LIMIT) * 100);
    const l2Health = Math.max(0, (l2Remaining / RATED_SWITCHING_LIMIT) * 100);

    return {
      averageTemperature: averageTemp != null ? parseFloat(averageTemp.toFixed(1)) : null,
      minTemperature: minTemp,
      maxTemperature: maxTemp,
      totalRecordCount: recentRecords.length,
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
    };
  } catch (err) {
    console.warn('[MongoDB Client] Failed to calculate insights:', err.message);
    throw err;
  }
}
