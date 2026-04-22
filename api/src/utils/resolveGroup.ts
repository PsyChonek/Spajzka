import { Db, ObjectId } from 'mongodb';
import { Request } from 'express';

export class GroupResolutionError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

/**
 * Resolve the effective groupId for a user-authenticated request.
 *
 * Priority:
 *   1. Client-supplied `groupId` in request body or query string. Used by the
 *      MCP server, which passes groupId explicitly on every group-scoped call.
 *      Membership is verified — a user cannot read or write another group's
 *      data by guessing its ID.
 *   2. `user.activeGroupId` — the group the web UI last selected. Used when
 *      the client does not supply a groupId.
 *   3. Bootstrap fallback: first non-personal group, then personal group.
 *      When this path is taken, `activeGroupId` is persisted so subsequent
 *      implicit calls are cheaper.
 *
 * Throws `GroupResolutionError` with an HTTP status if resolution fails.
 */
export async function resolveGroupId(db: Db, req: Request, userId: string): Promise<ObjectId> {
  const bodyGroupId = typeof req.body === 'object' && req.body ? (req.body as any).groupId : undefined;
  const queryGroupId = (req.query as any)?.groupId;
  const supplied = typeof bodyGroupId === 'string' ? bodyGroupId : typeof queryGroupId === 'string' ? queryGroupId : undefined;

  if (supplied !== undefined) {
    if (!ObjectId.isValid(supplied)) {
      throw new GroupResolutionError(400, 'VALIDATION_ERROR', 'Invalid groupId');
    }
    const group = await db.collection('groups').findOne({
      _id: new ObjectId(supplied),
      'members.userId': new ObjectId(userId)
    });
    if (!group) {
      throw new GroupResolutionError(403, 'NOT_IN_GROUP', 'User is not a member of the requested group');
    }
    return group._id;
  }

  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  if (!user) {
    throw new GroupResolutionError(404, 'NOT_FOUND', 'User not found');
  }

  if (user.activeGroupId) {
    return user.activeGroupId;
  }

  const nonPersonal = await db.collection('groups').findOne({
    'members.userId': new ObjectId(userId),
    isPersonal: { $ne: true }
  });
  const fallback = nonPersonal ?? await db.collection('groups').findOne({
    'members.userId': new ObjectId(userId),
    isPersonal: true
  });

  if (!fallback) {
    throw new GroupResolutionError(404, 'NOT_IN_GROUP', 'User is not in any group');
  }

  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { activeGroupId: fallback._id } }
  );
  return fallback._id;
}

export function handleGroupResolutionError(err: unknown, res: import('express').Response): boolean {
  if (err instanceof GroupResolutionError) {
    res.status(err.status).json({ message: err.message, code: err.code });
    return true;
  }
  return false;
}
