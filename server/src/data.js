import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dirname, '..', 'data');

export function readJSON(filename, fallback = null) {
  try {
    const data = readFileSync(join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

export function writeJSON(filename, data) {
  writeFileSync(join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');
}
