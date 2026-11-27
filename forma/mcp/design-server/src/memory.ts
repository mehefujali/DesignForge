import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";

export interface DesignMemoryStore {
  projectRoot: string;
  memoryDir: string;
}

const ALLOWED_KEYS = new Set([
  "brief",
  "references",
  "design-dna",
  "exceptions",
  "audit-history",
  "refinements",
]);

/**
 * Resolves the `.forma` memory directory for a project root,
 * ensuring the target file stays strictly inside `.forma/`.
 */
export function resolveMemoryFile(projectRoot: string, key: string): string {
  if (!ALLOWED_KEYS.has(key)) {
    throw new Error(`Invalid design memory key: ${key}`);
  }
  const absRoot = resolve(projectRoot);
  const memoryDir = resolve(absRoot, ".forma");
  const target = resolve(memoryDir, `${key}.json`);
  if (!target.startsWith(memoryDir + sep)) {
    throw new Error("Path traversal detected in design memory resolution");
  }
  return target;
}

export function readMemory<T>(projectRoot: string, key: string, fallback: T): T {
  const filePath = resolveMemoryFile(projectRoot, key);
  if (!existsSync(filePath)) {
    return fallback;
  }
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export function writeMemory<T>(projectRoot: string, key: string, data: T): string {
  const filePath = resolveMemoryFile(projectRoot, key);
  const dir = resolve(projectRoot, ".forma");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return filePath;
}

export interface MemoryException {
  pattern: string;
  justification: string;
  approvedAt: string;
}

export function addApprovedException(
  projectRoot: string,
  pattern: string,
  justification: string
): MemoryException[] {
  const existing = readMemory<MemoryException[]>(projectRoot, "exceptions", []);
  const updated = [
    ...existing.filter((e) => e.pattern !== pattern),
    { pattern, justification, approvedAt: new Date().toISOString() },
  ];
  writeMemory(projectRoot, "exceptions", updated);
  return updated;
}
