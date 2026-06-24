import fs from 'fs';
import path from 'path';

let basePath = 'test/fixtures';

export function setFixturePath(newBasePath) {
  basePath = newBasePath;
}

export function fixture(relativePath) {
  const fullPath = path.resolve(basePath, relativePath);
  const content = fs.readFileSync(fullPath, { encoding: 'utf8' });
  if (relativePath.endsWith('.json')) {
    return JSON.parse(content);
  }
  return content;
}
