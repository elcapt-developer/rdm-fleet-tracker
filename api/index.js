import express from 'express';
import cors from 'cors';
import { Redis } from '@upstash/redis';

// Initial seed fleet data (21 aircraft across Madras, Sky Service, HAA Campus)
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

import { put, list } from '@vercel/blob';

const STORAGE_KEY = 'rdm_fleet_v2';
let memoryFleet = [...SEED_DATA];

// Initialize Redis / Upstash / Vercel KV if environment variables are provided
let redis = null;
const redisUrl =
  process.env.FLEET_REST_API_URL ||
  process.env.FLEET_URL ||
  process.env.REDIS_REST_API_URL ||
  process.env.STORAGE_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.STORAGE_URL ||
  process.env.KV_REST_API_URL ||
  process.env.REDIS_URL;

const redisToken =
  process.env.FLEET_REST_API_TOKEN ||
  process.env.FLEET_TOKEN ||
  process.env.REDIS_REST_API_TOKEN ||
  process.env.STORAGE_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.STORAGE_TOKEN ||
  process.env.KV_REST_API_TOKEN;

if (redisUrl && redisToken) {
  try {
    redis = new Redis({ url: redisUrl, token: redisToken });
  } catch (err) {
    console.warn('Could not initialize Redis client, using fallback store:', err);
  }
}

async function getFleet() {
  // 1. Try Upstash Redis / KV
  if (redis) {
    try {
      const data = await redis.get(STORAGE_KEY);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      await redis.set(STORAGE_KEY, SEED_DATA);
      return SEED_DATA;
    } catch (err) {
      console.error('Redis read error:', err);
    }
  }

  // 2. Try Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: 'rdm-fleet-v2.json' });
      if (blobs && blobs.length > 0) {
        const res = await fetch(blobs[0].url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      }
      await put('rdm-fleet-v2.json', JSON.stringify(SEED_DATA), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return SEED_DATA;
    } catch (err) {
      console.error('Blob read error:', err);
    }
  }

  return memoryFleet;
}

async function saveFleet(newFleet) {
  memoryFleet = newFleet;

  // Save to Redis if available
  if (redis) {
    try {
      await redis.set(STORAGE_KEY, newFleet);
    } catch (err) {
      console.error('Redis write error:', err);
    }
  }

  // Save to Vercel Blob if available
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put('rdm-fleet-v2.json', JSON.stringify(newFleet), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } catch (err) {
      console.error('Blob write error:', err);
    }
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/fleet
app.get(['/api/fleet', '/fleet'], async (req, res) => {
  // Edge Cache: Shields Redis / Blob for concurrent viewers, but forbids browser local caching
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=2, stale-while-revalidate=4, must-revalidate');
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
    updatedAt: new Date().toISOString(),
    updatedBy: req.body.updatedBy || 'Dispatch',
  };

  fleet.push(newPlane);
  await saveFleet(fleet);
  res.status(201).json(newPlane);
});

// PUT /api/aircraft/:id
app.put(['/api/aircraft/:id', '/aircraft/:id'], async (req, res) => {
  const { id } = req.params;
  const fleet = await getFleet();
  const index = fleet.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Aircraft not found' });
  }

  const existing = fleet[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  fleet[index] = updated;
  await saveFleet(fleet);
  res.json(updated);
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
