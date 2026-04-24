import { Db, ObjectId } from 'mongodb';

export type HistoryAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'join'
  | 'leave'
  | 'kick'
  | 'role_change';

export type HistoryEntityType =
  | 'pantry'
  | 'shopping'
  | 'mealPlan'
  | 'recipe'
  | 'tag'
  | 'item'
  | 'group';

export interface HistoryEntryInput {
  groupId: ObjectId;
  userId: string;
  userEmail?: string;
  action: HistoryAction;
  entityType: HistoryEntityType;
  entityId: string | ObjectId;
  entityName: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Append a single history event. Never throws — failures are logged and
 * swallowed so that a history-log outage cannot break user-facing mutations.
 */
export async function logHistory(db: Db, entry: HistoryEntryInput): Promise<void> {
  try {
    await db.collection('historyLog').insertOne({
      groupId: entry.groupId,
      userId: new ObjectId(entry.userId),
      userEmail: entry.userEmail ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: typeof entry.entityId === 'string' ? entry.entityId : entry.entityId.toString(),
      entityName: entry.entityName,
      changes: entry.changes ?? null,
      metadata: entry.metadata ?? null,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[historyLog] failed to append entry', {
      entityType: entry.entityType,
      action: entry.action,
      entityId: entry.entityId?.toString?.() ?? entry.entityId,
      error: err instanceof Error ? err.message : err
    });
  }
}

/**
 * Compute a minimal field-level diff. Only keys that actually differ land in
 * the result. Returns `null` when nothing changed (caller should skip logging).
 *
 * Equality uses `JSON.stringify` — good enough for our flat documents with
 * primitives, short arrays, and ObjectIds (which stringify deterministically).
 */
export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields?: string[]
): { before: Record<string, unknown>; after: Record<string, unknown> } | null {
  const keys = fields ?? Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  const diffBefore: Record<string, unknown> = {};
  const diffAfter: Record<string, unknown> = {};

  for (const key of keys) {
    const a = before?.[key];
    const b = after?.[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diffBefore[key] = a ?? null;
      diffAfter[key] = b ?? null;
    }
  }

  if (Object.keys(diffAfter).length === 0) {
    return null;
  }
  return { before: diffBefore, after: diffAfter };
}
