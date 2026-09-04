import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'certiflow.json');

// In-memory representation
let dbStore: Record<string, string> = {};

export async function initDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = await fs.promises.readFile(dbPath, 'utf8');
      dbStore = JSON.parse(data);
    } else {
      await fs.promises.writeFile(dbPath, JSON.stringify(dbStore));
    }
  } catch (e) {
    console.error('Failed to init json db', e);
  }
}

async function persist() {
  try {
    await fs.promises.writeFile(dbPath, JSON.stringify(dbStore, null, 2));
  } catch (e) {
    console.error('Failed to save to json db', e);
  }
}

export async function setStore(key: string, value: string) {
  dbStore[key] = value;
  await persist();
}

export async function getStore(key: string): Promise<string | null> {
  return dbStore[key] || null;
}

export async function all(query?: string): Promise<{ key: string; value: string }[]> {
  return Object.keys(dbStore).map(key => ({
    key,
    value: dbStore[key]
  }));
}

initDb().catch(console.error);