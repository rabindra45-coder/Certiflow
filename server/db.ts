import path from 'path';
import fs from 'fs';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dataDir = isServerless ? '/tmp' : path.resolve(process.cwd(), 'data');

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (e) {
  // Ignore filesystem creation errors
}

const dbPath = path.join(dataDir, 'certiflow.json');

// In-memory representation
let dbStore: Record<string, string> = {};

export async function initDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = await fs.promises.readFile(dbPath, 'utf8');
      dbStore = JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to init json db', e);
  }
}

async function persist() {
  try {
    await fs.promises.writeFile(dbPath, JSON.stringify(dbStore, null, 2));
  } catch (e) {
    // In serverless, memory store remains active even if file writing is restricted
  }
}

export async function setStore(key: string, value: string) {
  dbStore[key] = value;
  await persist();
}

export async function getStore(key: string): Promise<string | null> {
  return dbStore[key] || null;
}

export async function all(_query?: string): Promise<{ key: string; value: string }[]> {
  return Object.keys(dbStore).map(key => ({
    key,
    value: dbStore[key]
  }));
}

initDb().catch(console.error);