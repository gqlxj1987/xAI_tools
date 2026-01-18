import fs from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

export async function readFileIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

export async function writeFile(filePath, content) {
  await ensureDir(filePath);
  await fs.writeFile(filePath, content, 'utf-8');
}
