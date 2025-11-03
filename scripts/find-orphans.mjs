#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.argv[2] || path.join(process.cwd(), 'src'));

const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
const routeEntryNames = new Set(['page.tsx','layout.tsx','error.tsx','global-error.tsx','not-found.tsx','route.ts','loading.tsx']);

/** @type {Map<string,{imports:Set<string>, importedBy:Set<string>}>} */
const graph = new Map();

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.has(path.extname(p))) {
      const rel = path.relative(ROOT, p);
      graph.set(rel, { imports: new Set(), importedBy: new Set() });
    }
  }
}

function readImports(filePath) {
  const abs = path.join(ROOT, filePath);
  let content = '';
  try { content = fs.readFileSync(abs, 'utf8'); } catch { return []; }
  const results = [];
  const importRegex = /(?:import\s+[^'";]+\s+from\s+|import\s*\(|export\s+\*\s+from\s+|require\()\s*["']([^"']+)["']/g;
  let m;
  while ((m = importRegex.exec(content))) {
    const spec = m[1];
    if (spec.startsWith('@/')) {
      results.push(spec); // handle alias in resolver
      continue;
    }
    if (!spec.startsWith('.')) continue; // only relative paths
    results.push(spec);
  }
  return results;
}

function resolveImport(fromFile, spec) {
  if (spec.startsWith('@/')) {
    const p = spec.slice(2); // Remove '@/'
    const candRoot = path.join(ROOT, p);
    const tryPaths = [];
    if (exts.has(path.extname(candRoot))) tryPaths.push(candRoot);
    for (const ext of exts) tryPaths.push(candRoot + ext);
    for (const ext of exts) tryPaths.push(path.join(candRoot, 'index' + ext));
    for (const pth of tryPaths) {
      const rel = path.relative(ROOT, pth);
      if (graph.has(rel)) return rel;
    }
    return null;
  }
  const fromAbs = path.join(ROOT, fromFile);
  const base = path.dirname(fromAbs);
  const tryPaths = [];
  const cand = path.resolve(base, spec);
  // direct file with extension
  if (exts.has(path.extname(cand))) tryPaths.push(cand);
  // add extensions
  for (const ext of exts) tryPaths.push(cand + ext);
  // index files inside directory
  for (const ext of exts) tryPaths.push(path.join(cand, 'index' + ext));
  for (const p of tryPaths) {
    const rel = path.relative(ROOT, p);
    if (graph.has(rel)) return rel;
  }
  return null;
}

// Build file list
walk(ROOT);

// Build edges
for (const file of graph.keys()) {
  const imports = readImports(file);
  for (const spec of imports) {
    const resolved = resolveImport(file, spec);
    if (resolved) {
      graph.get(file).imports.add(resolved);
      graph.get(resolved).importedBy.add(file);
    }
  }
}

function isRouteEntry(file) {
  const bn = path.basename(file);
  if (routeEntryNames.has(bn)) return true;
  if (file.startsWith('app' + path.sep) && (bn === 'layout.tsx' || bn === 'page.tsx')) return true;
  return false;
}

// Find orphans
const orphans = [];
for (const [file, data] of graph.entries()) {
  if (isRouteEntry(file)) continue;
  // ignore barrels that are re-exported only
  if (file.endsWith('/index.ts')) continue;
  if (data.importedBy.size === 0) {
    orphans.push(file);
  }
}

orphans.sort();
console.log(JSON.stringify({ root: ROOT, orphanCount: orphans.length, orphans }, null, 2));
