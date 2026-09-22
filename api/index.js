import express from 'express';
import cors from 'cors';

// Initial seed fleet data (21 aircraft across Madras, Sky Service, HAA Campus)
const SEED_DATA = [
  // Madras (S33)
  { id: 'plane-49191', tailNumber: '49191', type: '152', location: 'Madras', status: 'Up', hoursRemaining: 65.4, totalHobbs: 4120.6, notes: 'Tie-down row B', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-5318M', tailNumber: '5318M', type: '152', location: 'Madras', status: 'Up-Low Hours', hoursRemaining: 3.8, totalHobbs: 3892.4, notes: 'Low hours before 100hr MX. Priority for local flights.', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-606GS', tailNumber: '606GS', type: '152', location: 'Madras', status: 'Up', hoursRemaining: 42.1, totalHobbs: 5214.0, notes: 'Clean runup, oil topped', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-6342L', tailNumber: '6342L', type: '152', location: 'Madras', status: 'Up', hoursRemaining: 78.5, totalHobbs: 2980.2, notes: 'Parked near fuel island', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-68713', tailNumber: '68713', type: '152', location: 'Madras', status: 'Up', hoursRemaining: 51.0, totalHobbs: 4610.8, notes: 'Ready for pattern work', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-18AC', tailNumber: '18AC', type: '172', location: 'Madras', status: 'Up', hoursRemaining: 34.2, totalHobbs: 6105.3, notes: 'G1000 equipped, IFR current', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-3555L', tailNumber: '3555L', type: '172', location: 'Madras', status: 'Up-Enroute', hoursRemaining: 18.5, totalHobbs: 3412.7, enrouteTo: 'Sky Service', eta: '18:15', notes: 'Cross-country returning from Madras to RDM', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-436SP', tailNumber: '436SP', type: '172', location: 'Madras', status: 'Up-Enroute', hoursRemaining: 22.0, totalHobbs: 4890.1, enrouteTo: 'Sky Service', eta: '18:30', notes: 'Commercial training stage check flight', updatedAt: '2026-01-01T00:00:00.000Z' },

  // Sky Service (RDM FBO)
  { id: 'plane-24373', tailNumber: '24373', type: '152', location: 'Sky Service', status: 'Up', hoursRemaining: 88.0, totalHobbs: 3205.5, notes: 'Fresh 100hr inspection signed off', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-48521', tailNumber: '48521', type: '152', location: 'Sky Service', status: 'Up', hoursRemaining: 14.5, totalHobbs: 4402.1, notes: 'Inspection scheduled later this week', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-6400Q', tailNumber: '6400Q', type: '152', location: 'Sky Service', status: 'Up-Enroute', hoursRemaining: 19.3, totalHobbs: 5120.9, enrouteTo: 'Madras', eta: '18:45', notes: 'Transit flight to Madras practice area', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-54477', tailNumber: '54477', type: '172', location: 'Sky Service', status: 'Down', hoursRemaining: 0.0, totalHobbs: 5800.0, squawks: ['100-Hour Inspection Due', 'Awaiting spark plug replacement'], notes: 'AOG - Do not dispatch until MX signoff', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-403SP', tailNumber: '403SP', type: '172', location: 'Sky Service', status: 'Up', hoursRemaining: 45.0, totalHobbs: 3950.4, notes: 'Parked spot 4', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-4203P', tailNumber: '4203P', type: '172', location: 'Sky Service', status: 'Up', hoursRemaining: 62.4, totalHobbs: 4310.2, notes: 'Full fuel tanks', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-52013', tailNumber: '52013', type: '172', location: 'Sky Service', status: 'Up', hoursRemaining: 31.8, totalHobbs: 4780.0, notes: 'Available for instrument dual', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-589SP', tailNumber: '589SP', type: '172', location: 'Sky Service', status: 'Up', hoursRemaining: 57.2, totalHobbs: 3670.3, notes: 'Spot 7 north ramp', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-125MG', tailNumber: '125MG', type: 'PA44', location: 'Sky Service', status: 'Up', hoursRemaining: 71.6, totalHobbs: 2150.5, notes: 'Multi-engine commercial / MEI training ready', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-446PA', tailNumber: '446PA', type: 'PA44', location: 'Sky Service', status: 'Down', hoursRemaining: 0.0, totalHobbs: 2890.0, squawks: ['Left engine cylinder inspection', 'Right cowl flap link adjustment'], notes: 'Down for scheduled engine work', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-552MD', tailNumber: '552MD', type: 'PA44', location: 'Sky Service', status: 'Down', hoursRemaining: 0.0, totalHobbs: 3100.0, squawks: ['100-Hour Inspection in progress'], notes: 'Hangar staging, MX underway', updatedAt: '2026-01-01T00:00:00.000Z' },

  // HAA Campus (Main Base & MX)
  { id: 'plane-52371', tailNumber: '52371', type: '172', location: 'HAA Campus', status: 'Down', hoursRemaining: 0.0, totalHobbs: 6240.0, squawks: ['100-Hour Inspection & Avionics check'], notes: 'Inside main maintenance bay', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-5366M', tailNumber: '5366M', type: '152', location: 'HAA Campus', status: 'Up', hoursRemaining: 82.5, totalHobbs: 4190.2, notes: 'Campus ramp ready for dispatch', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'plane-64942', tailNumber: '64942', type: '152', location: 'Madras', status: 'Up', hoursRemaining: 100.0, totalHobbs: 3500.0, notes: 'Tie-down row C', updatedAt: '2026-01-01T00:00:00.000Z' },
];

const GITHUB_DB_TOKEN = process.env.GITHUB_DB_TOKEN;
const GITHUB_DB_REPO = process.env.GITHUB_DB_REPO || 'elcapt-developer/rdm-fleet-tracker';
const GITHUB_DB_ISSUE_NUMBER = process.env.GITHUB_DB_ISSUE_NUMBER || '1';

let memoryFleet = [...SEED_DATA];
let lastFetchedAt = 0;

async function fetchFromGitHubIssue() {
  if (!GITHUB_DB_TOKEN) return null;
  const res = await fetch(`https://api.github.com/repos/${GITHUB_DB_REPO}/issues/${GITHUB_DB_ISSUE_NUMBER}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_DB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'RDMFleetTracker',
    },
  });
  if (!res.ok) {
    console.warn(`GitHub read returned ${res.status}`);
    return null;
  }
  const issue = await res.json();
  if (issue && issue.body) {
    try {
      const parsed = JSON.parse(issue.body);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing fleet json from issue body:', e);
    }
  }
  return null;
}

async function saveToGitHubIssue(fleetData) {
  if (!GITHUB_DB_TOKEN) return;
  const res = await fetch(`https://api.github.com/repos/${GITHUB_DB_REPO}/issues/${GITHUB_DB_ISSUE_NUMBER}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${GITHUB_DB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'RDMFleetTracker',
    },
    body: JSON.stringify({
      body: JSON.stringify(fleetData),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Failed saving to GitHub issue:', res.status, text);
    throw new Error(`GitHub Issue Save Failed: ${res.status}`);
  }
}

async function getFleet() {
  try {
    const data = await fetchFromGitHubIssue();
    if (data && Array.isArray(data) && data.length > 0) {
      memoryFleet = data;
      lastFetchedAt = Date.now();
      return data;
    }
  } catch (err) {
    console.warn('GitHub issue read error, falling back to memory:', err.message);
  }

  return memoryFleet && memoryFleet.length > 0 ? memoryFleet : SEED_DATA;
}

async function saveFleet(newFleet) {
  memoryFleet = newFleet;
  try {
    await saveToGitHubIssue(newFleet);
  } catch (err) {
    console.error('saveFleet GitHub error (persisting in memory):', err.message);
  }
}

// Merge utility: combines incoming changes with existing fleet using updatedAt timestamps
function mergeAircraftArrays(existingFleet, updates) {
  const map = new Map(existingFleet.map((p) => [p.id, p]));
  for (const up of updates) {
    const ex = map.get(up.id);
    if (!ex) {
      map.set(up.id, up);
    } else {
      const exTime = ex.updatedAt ? new Date(ex.updatedAt).getTime() : 0;
      const upTime = up.updatedAt ? new Date(up.updatedAt).getTime() : 0;
      if (upTime >= exTime) {
        map.set(up.id, { ...ex, ...up });
      }
    }
  }
  return Array.from(map.values());
}

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/status - diagnostic endpoint
app.get(['/api/status', '/status'], async (req, res) => {
  let connected = false;
  let error = null;
  let count = 0;

  try {
    const data = await fetchFromGitHubIssue();
    if (data) {
      connected = true;
      count = data.length;
    }
  } catch (e) {
    error = e.message;
  }

  res.json({
    status: 'ok',
    storageType: 'github-cloud-db',
    repo: GITHUB_DB_REPO,
    issueNumber: GITHUB_DB_ISSUE_NUMBER,
    connected,
    fleetCount: count,
    error,
  });
});

// GET /api/fleet - Real-time endpoint without stale CDN cache
app.get(['/api/fleet', '/fleet'], async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const fleet = await getFleet();
  res.json(fleet);
});

// GET /api/aircraft/:id
app.get(['/api/aircraft/:id', '/aircraft/:id'], async (req, res) => {
  const fleet = await getFleet();
  const plane = fleet.find((p) => p.id === req.params.id);
  if (!plane) return res.status(404).json({ error: 'Aircraft not found' });
  res.json(plane);
});

// POST /api/aircraft
app.post(['/api/aircraft', '/aircraft'], async (req, res) => {
  const { tailNumber, type, location, status } = req.body;
  if (!tailNumber || !type || !location) {
    return res.status(400).json({ error: 'Missing required aircraft fields' });
  }

  const cleanTail = String(tailNumber).trim().toUpperCase().replace(/^N/, '');
  const fleet = await getFleet();

  const newPlane = {
    id: `plane-${cleanTail}-${Date.now().toString(36)}`,
    tailNumber: cleanTail,
    type,
    location,
    status: status || 'Up',
    hoursRemaining: 100.0,
    updatedAt: req.body.updatedAt || new Date().toISOString(),
    updatedBy: req.body.updatedBy || 'Dispatch',
  };

  fleet.push(newPlane);
  await saveFleet(fleet);
  res.status(201).json(newPlane);
});

// PUT /api/aircraft/:id - Conflict-free update with timestamp merge
app.put(['/api/aircraft/:id', '/aircraft/:id'], async (req, res) => {
  const { id } = req.params;
  const currentFleet = await getFleet();
  const existing = currentFleet.find((p) => p.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Aircraft not found' });
  }

  const updatedPlane = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: req.body.updatedAt || new Date().toISOString(),
  };

  const merged = mergeAircraftArrays(currentFleet, [updatedPlane]);
  await saveFleet(merged);
  res.json(updatedPlane);
});

// PUT /api/fleet - Full fleet atomic save endpoint (Used by SAVE button)
app.put(['/api/fleet', '/fleet'], async (req, res) => {
  const incoming = req.body;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return res.status(400).json({ error: 'Expected non-empty array of aircraft' });
  }

  const nowIso = new Date().toISOString();
  // Stamp all planes with the exact save time so the latest save is unconditionally applied
  const stampedFleet = incoming.map((plane) => ({
    ...plane,
    updatedAt: plane.updatedAt && new Date(plane.updatedAt).getTime() > new Date(nowIso).getTime() - 60000
      ? plane.updatedAt
      : nowIso,
  }));

  await saveFleet(stampedFleet);
  res.json({ message: 'Fleet successfully saved', fleet: stampedFleet, savedAt: nowIso });
});

// DELETE /api/aircraft/:id
app.delete(['/api/aircraft/:id', '/aircraft/:id'], async (req, res) => {
  const { id } = req.params;
  let fleet = await getFleet();
  const index = fleet.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Aircraft not found' });
  }

  fleet = fleet.filter((p) => p.id !== id);
  await saveFleet(fleet);
  res.json({ message: 'Aircraft deleted successfully', id });
});

// POST /api/reset-fleet
app.post(['/api/reset-fleet', '/reset-fleet'], async (req, res) => {
  await saveFleet(SEED_DATA);
  res.json({ message: 'Fleet reset to seed configuration', fleet: SEED_DATA });
});

export default app;
