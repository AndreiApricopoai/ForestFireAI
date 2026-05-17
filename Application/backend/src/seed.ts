/**
 * seed.ts — One-time database seed script.
 *
 * Run with:
 *   npx ts-node src/seed.ts
 *
 * What it does:
 *   1. Connects to MongoDB using the same URI as the app
 *   2. Creates an admin user (if one doesn't exist yet)
 *   3. Creates 3 camera documents matching the videos in the cameras/ folder
 *
 * Safe to run multiple times — uses upsert/findOrCreate logic.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

// ─── MongoDB URIs ────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set in .env');
  process.exit(1);
}

// ─── Minimal schemas (mirror the app schemas) ────────────────────────────────

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
});

const CameraSchema = new mongoose.Schema(
  {
    name: String,
    location: String,
    region: { type: String, default: '' },
    sourceUrl: { type: String, unique: true },
    isActive: { type: Boolean, default: true },
    status: { type: String, default: 'inactive' },
    analysisIntervalSeconds: { type: Number, default: 5 },
    confidenceThreshold: { type: Number, default: 0.45 },
    latestDetection: { type: Object, default: null },
  },
  { timestamps: true },
);

// ─── Seed data ───────────────────────────────────────────────────────────────

const ADMIN_USER = {
  name: 'Admin',
  email: 'admin@forestfire.dev',
  password: 'Admin1234',
  role: 'admin',
};

/**
 * The sourceUrl must match the filename inside the cameras/ folder exactly.
 * The Python worker builds the full path:  CAMERAS_FOLDER + sourceUrl
 */
const CAMERAS = [
  {
    name: 'Camera 1 — Forest North',
    location: 'North Sector',
    region: 'Zone A',
    sourceUrl: 'camera1.mp4',
    isActive: true,
    analysisIntervalSeconds: 5,
    confidenceThreshold: 0.45,
  },
  {
    name: 'Camera 2 — Forest East',
    location: 'East Sector',
    region: 'Zone B',
    sourceUrl: 'camera2.mp4',
    isActive: true,
    analysisIntervalSeconds: 5,
    confidenceThreshold: 0.45,
  },
  {
    name: 'Camera 3 — Forest South',
    location: 'South Sector',
    region: 'Zone C',
    sourceUrl: 'camera3.mp4',
    isActive: true,
    analysisIntervalSeconds: 5,
    confidenceThreshold: 0.45,
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('Connected.\n');

  const UserModel = mongoose.model('User', UserSchema);
  const CameraModel = mongoose.model('Camera', CameraSchema);

  // ── Admin user ──────────────────────────────────────────────────────────────
  const existingAdmin = await UserModel.findOne({ email: ADMIN_USER.email });

  if (existingAdmin) {
    console.log(`Admin user already exists: ${ADMIN_USER.email}`);
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 10);
    await UserModel.create({ ...ADMIN_USER, password: hashedPassword });
    console.log(`Admin user created:`);
    console.log(`  Email:    ${ADMIN_USER.email}`);
    console.log(`  Password: ${ADMIN_USER.password}`);
  }

  console.log();

  // ── Cameras ─────────────────────────────────────────────────────────────────
  for (const cam of CAMERAS) {
    const existing = await CameraModel.findOne({ sourceUrl: cam.sourceUrl });

    if (existing) {
      console.log(`Camera already exists: "${cam.name}" (${cam.sourceUrl})`);
    } else {
      const created = await CameraModel.create(cam);
      console.log(
        `Camera created: "${cam.name}" — id: ${(created._id as mongoose.Types.ObjectId).toString()}`,
      );
    }
  }

  console.log('\nSeed complete.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
