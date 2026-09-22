import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'fleet.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seed initial fleet if file does not exist
const SEED_DATA = [
  // Madras (S33)
  { id: 'plane-49191', tailNumber: '49191', type: '152', location: 'Madras', status: 'Up', hoursRemaining: 65.4, totalHobbs: 4120.6, notes: 'Tie-down row B', updatedAt: new Date().toISOString() },
  { id: 'plane-5318M', tailNumber: '5318M', type: '152', location: 'Madras', status: 'Up-Low Hours', hoursRemaining: 3.8, totalHobbs: 3892.4, notes: 'Low hours before 100hr MX. Priority for local flights.', updatedAt: new Date().toISOString() },
  { id: 'plane-606GS', tailNumber: '606GS', type: '152', location: 'Madras', status: 'Up', hoursRemaining: 42.1, totalHobbs: 5214.0, notes: 'Clean runup, oil topped', updatedAt: new Date().toISOString() },
  { id: 'plane-6342L', tailNumber: '6342L', type: '152', location: 'Madras', status: 'Up', hoursRemaining: 78.5, totalHobbs: 2980.2, notes: 'Parked near fuel island', updatedAt: new Date().toISOString() },
  { id: 'plane-68713', tailNumber: '68713', type: '152', location: 'Madras', status: 'Up', hoursRemaining: 51.0, totalHobbs: 4610.8, notes: 'Ready for pattern work', updatedAt: new Date().toISOString() },
  { id: 'plane-18AC', tailNumber: '18AC', type: '172', location: 'Madras', status: 'Up', hoursRemaining: 34.2, totalHobbs: 6105.3, notes: 'G1000 equipped, IFR current', updatedAt: new Date().toISOString() },
  { id: 'plane-3555L', tailNumber: '3555L', type: '172', location: 'Madras', status: 'Up-Enroute', hoursRemaining: 18.5, totalHobbs: 3412.7, enrouteTo: 'Sky Service', eta: '18:15', notes: 'Cross-country returning from Madras to RDM', updatedAt: new Date().toISOString() },
  { id: 'plane-436SP', tailNumber: '436SP', type: '172', location: 'Madras', status: 'Up-Enroute', hoursRemaining: 22.0, totalHobbs: 4890.1, enrouteTo: 'Sky Service', eta: '18:30', notes: 'Commercial training stage check flight', updatedAt: new Date().toISOString() },

  // Sky Service (RDM FBO)
  { id: 'plane-24373', tailNumber: '24373', type: '152', location: 'Sky Service', status: 'Up', hoursRemaining: 88.0, totalHobbs: 3205.5, notes: 'Fresh 100hr inspection signed off', updatedAt: new Date().toISOString() },
  { id: 'plane-48521', tailNumber: '48521', type: '152', location: 'Sky Service', status: 'Up', hoursRemaining: 14.5, totalHobbs: 4402.1, notes: 'Inspection scheduled later this week', updatedAt: new Date().toISOString() },
  { id: 'plane-6400Q', tailNumber: '6400Q', type: '152', location: 'Sky Service', status: 'Up-Enroute', hoursRemaining: 19.3, totalHobbs: 5120.9, enrouteTo: 'Madras', eta: '18:45', notes: 'Transit flight to Madras practice area', updatedAt: new Date().toISOString() },
  { id: 'plane-54477', tailNumber: '54477', type: '172', location: 'Sky Service', status: 'Down', hoursRemaining: 0.0, totalHobbs: 5800.0, squawks: ['100-Hour Inspection Due', 'Awaiting spark plug replacement'], notes: 'AOG - Do not dispatch until MX signoff', updatedAt: new Date().toISOString() },
  { id: 'plane-403SP', tailNumber: '403SP', type: '172', location: 'Sky Service', status: 'Up', hoursRemaining: 45.0, totalHobbs: 3950.4, notes: 'Parked spot 4', updatedAt: new Date().toISOString() },
  { id: 'plane-4203P', tailNumber: '4203P', type: '172', location: 'Sky Service', status: 'Up', hoursRemaining: 62.4, totalHobbs: 4310.2, notes: 'Full fuel tanks', updatedAt: new Date().toISOString() },
  { id: 'plane-52013', tailNumber: '52013', type: '172', location: 'Sky Service', status: 'Up', hoursRemaining: 31.8, totalHobbs: 4780.0, notes: 'Available for instrument dual', updatedAt: new Date().toISOString() },
  { id: 'plane-589SP', tailNumber: '589SP', type: '172', location: 'Sky Service', status: 'Up', hoursRemaining: 57.2, totalHobbs: 3670.3, notes: 'Spot 7 north ramp', updatedAt: new Date().toISOString() },
  { id: 'plane-125MG', tailNumber: '125MG', type: 'PA44', location: 'Sky Service', status: 'Up', hoursRemaining: 71.6, totalHobbs: 2150.5, notes: 'Multi-engine commercial / MEI training ready', updatedAt: new Date().toISOString() },
  { id: 'plane-446PA', tailNumber: '446PA', type: 'PA44', location: 'Sky Service', status: 'Down', hoursRemaining: 0.0, totalHobbs: 2890.0, squawks: ['Left engine cylinder inspection', 'Right cowl flap link adjustment'], notes: 'Down for scheduled engine work', updatedAt: new Date().toISOString() },
  { id: 'plane-552MD', tailNumber: '552MD', type: 'PA44', location: 'Sky Service', status: 'Down', hoursRemaining: 0.0, totalHobbs: 3100.0, squawks: ['100-Hour Inspection in progress'], notes: 'Hangar staging, MX underway', updatedAt: new Date().toISOString() },

  // HAA Campus (Main Base & MX)
  { id: 'plane-52371', tailNumber: '52371', type: '172', location: 'HAA Campus', status: 'Down', hoursRemaining: 0.0, totalHobbs: 6240.0, squawks: ['100-Hour Inspection & Avionics check'], notes: 'Inside main maintenance bay', updatedAt: new Date().toISOString() },
  { id: 'plane-5366M', tailNumber: '5366M', type: '152', location: 'HAA Campus', status: 'Up', hoursRemaining: 82.5, totalHobbs: 4190.2, notes: 'Campus ramp ready for dispatch', updatedAt: new Date().toISOString() },
];

function loadFleet() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading fleet.json, initializing default:', err);
  }
  saveFleet(SEED_DATA);
  return SEED_DATA;
}

function saveFleet(fleet) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(fleet, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fleet.json:', err);
  }
}

let fleet = loadFleet();

const app = express();
app.use(cors());
app.use(express.json());

// Serve production build if available
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket. Total clients:', wss.clients.size);
  ws.send(JSON.stringify({ type: 'INIT_FLEET', payload: fleet }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (e) {
      console.error('Invalid message from client:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected. Remaining clients:', wss.clients.size);
  });
});

// REST API Endpoints

// GET /api/fleet
app.get('/api/fleet', (req, res) => {
  res.json(fleet);
});

// POST /api/aircraft
app.post('/api/aircraft', (req, res) => {
  const newPlane = {
    id: req.body.id || `plane-${Date.now()}`,
    tailNumber: String(req.body.tailNumber || '').toUpperCase().trim(),
    type: req.body.type || '172',
    location: req.body.location || 'Sky Service',
    status: req.body.status || 'Up',
    hoursRemaining: Number(req.body.hoursRemaining) || 100.0,
    totalHobbs: req.body.totalHobbs ? Number(req.body.totalHobbs) : undefined,
    enrouteTo: req.body.enrouteTo || undefined,
    eta: req.body.eta || undefined,
    notes: req.body.notes || '',
    squawks: Array.isArray(req.body.squawks) ? req.body.squawks : [],
    updatedAt: new Date().toISOString(),
    updatedBy: req.body.updatedBy || 'Dispatch',
  };

  fleet.push(newPlane);
  saveFleet(fleet);
  broadcast({ type: 'AIRCRAFT_ADDED', payload: newPlane });
  res.status(201).json(newPlane);
});

// PUT /api/aircraft/:id
app.put('/api/aircraft/:id', (req, res) => {
  const { id } = req.params;
  const index = fleet.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Aircraft not found' });
  }

  const existing = fleet[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id, // prevent ID change
    hoursRemaining: req.body.hoursRemaining !== undefined ? Number(req.body.hoursRemaining) : existing.hoursRemaining,
    updatedAt: new Date().toISOString(),
  };

  fleet[index] = updated;
  saveFleet(fleet);
  broadcast({ type: 'AIRCRAFT_UPDATED', payload: updated });
  res.json(updated);
});

// DELETE /api/aircraft/:id
app.delete('/api/aircraft/:id', (req, res) => {
  const { id } = req.params;
  const index = fleet.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Aircraft not found' });
  }

  fleet.splice(index, 1);
  saveFleet(fleet);
  broadcast({ type: 'AIRCRAFT_DELETED', payload: { id } });
  res.json({ success: true, id });
});

// POST /api/aircraft/:id/flight-time
app.post('/api/aircraft/:id/flight-time', (req, res) => {
  const { id } = req.params;
  const flightHours = Number(req.body.flightHours) || 0;
  const index = fleet.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Aircraft not found' });
  }

  const plane = fleet[index];
  const newHoursRemaining = Math.max(0, Math.round((plane.hoursRemaining - flightHours) * 10) / 10);
  const newHobbs = plane.totalHobbs ? Math.round((plane.totalHobbs + flightHours) * 10) / 10 : undefined;

  let newStatus = plane.status;
  if (newHoursRemaining <= 0) {
    newStatus = 'Down';
  } else if (newHoursRemaining < 5.0 && (plane.status === 'Up' || plane.status === 'Up-Enroute')) {
    newStatus = 'Up-Low Hours';
  }

  const updated = {
    ...plane,
    hoursRemaining: newHoursRemaining,
    totalHobbs: newHobbs,
    status: newStatus,
    updatedAt: new Date().toISOString(),
    updatedBy: req.body.updatedBy || 'Flight Log',
  };

  fleet[index] = updated;
  saveFleet(fleet);
  broadcast({ type: 'AIRCRAFT_UPDATED', payload: updated });
  res.json(updated);
});

// POST /api/aircraft/:id/complete-100hr
app.post('/api/aircraft/:id/complete-100hr', (req, res) => {
  const { id } = req.params;
  const index = fleet.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Aircraft not found' });
  }

  const plane = fleet[index];
  const cleanedSquawks = (plane.squawks || []).filter(
    (s) => !s.toLowerCase().includes('100-hour') && !s.toLowerCase().includes('100hr')
  );

  const updated = {
    ...plane,
    hoursRemaining: 100.0,
    status: 'Up',
    squawks: cleanedSquawks,
    notes: `100-Hour Inspection Completed & Signed Off by Maintenance on ${new Date().toLocaleDateString()}`,
    updatedAt: new Date().toISOString(),
    updatedBy: req.body.signoffBy || 'HAA Maintenance Shop',
  };

  fleet[index] = updated;
  saveFleet(fleet);
  broadcast({ type: 'AIRCRAFT_UPDATED', payload: updated });
  res.json(updated);
});

// PUT /api/fleet - Full fleet atomic save endpoint
app.put('/api/fleet', (req, res) => {
  const incoming = req.body;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return res.status(400).json({ error: 'Expected non-empty array of aircraft' });
  }

  const nowIso = new Date().toISOString();
  fleet = incoming.map((plane) => ({
    ...plane,
    updatedAt: nowIso,
  }));
  saveFleet(fleet);
  broadcast({ type: 'INIT_FLEET', payload: fleet });
  res.json({ message: 'Fleet successfully saved', fleet, savedAt: nowIso });
});

// POST /api/reset-fleet
app.post('/api/reset-fleet', (req, res) => {
  fleet = JSON.parse(JSON.stringify(SEED_DATA));
  saveFleet(fleet);
  broadcast({ type: 'FLEET_RESET', payload: fleet });
  res.json({ success: true, fleet });
});

server.listen(PORT, () => {
  console.log(`HAA Aircraft Status Server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint at ws://localhost:${PORT}/ws`);
});
