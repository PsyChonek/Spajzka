import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../rbac/middleware';
import { resolveGroupId, handleGroupResolutionError } from '../utils/resolveGroup';

const router = Router();

const VALID_ENTITY_TYPES = new Set([
  'pantry',
  'shopping',
  'mealPlan',
  'recipe',
  'tag',
  'item',
  'group'
]);

const VALID_ACTIONS = new Set([
  'create',
  'update',
  'delete',
  'join',
  'leave',
  'kick',
  'role_change'
]);

/**
 * @openapi
 * components:
 *   schemas:
 *     HistoryEntry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         groupId:
 *           type: string
 *         userId:
 *           type: string
 *         userEmail:
 *           type: string
 *           nullable: true
 *         action:
 *           type: string
 *           enum: [create, update, delete, join, leave, kick, role_change]
 *         entityType:
 *           type: string
 *           enum: [pantry, shopping, mealPlan, recipe, tag, item, group]
 *         entityId:
 *           type: string
 *         entityName:
 *           type: string
 *         changes:
 *           type: object
 *           nullable: true
 *           properties:
 *             before:
 *               type: object
 *             after:
 *               type: object
 *         metadata:
 *           type: object
 *           nullable: true
 *         timestamp:
 *           type: string
 *           format: date-time
 *     HistoryListResponse:
 *       type: object
 *       properties:
 *         entries:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/HistoryEntry'
 *         nextCursor:
 *           type: string
 *           nullable: true
 */

/**
 * @openapi
 * /api/history:
 *   get:
 *     summary: List activity history for a group
 *     description: |
 *       Return append-only activity history entries for the authenticated user's
 *       active group (or the supplied `groupId`) in reverse chronological order.
 *       Supports filtering by entity type and action, and cursor-based pagination
 *       via `before` (ISO timestamp of the last entry from the previous page).
 *     tags:
 *       - History
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupId
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         required: false
 *         description: Comma-separated list of entity types to include
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         required: false
 *         schema:
 *           type: string
 *           enum: [create, update, delete, join, leave, kick, role_change]
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 200
 *       - in: query
 *         name: before
 *         required: false
 *         description: ISO-8601 timestamp; only return entries strictly older than this
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Paginated history entries
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HistoryListResponse'
 */
router.get('/history', authMiddleware, requirePermission('history:read'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const groupId = await resolveGroupId(db, req, req.userId!);

    const rawLimit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;

    const filter: any = { groupId };

    const entityTypeRaw = typeof req.query.entityType === 'string' ? req.query.entityType : '';
    if (entityTypeRaw) {
      const requested = entityTypeRaw.split(',').map(s => s.trim()).filter(Boolean);
      const valid = requested.filter(t => VALID_ENTITY_TYPES.has(t));
      if (valid.length === 0) {
        return res.status(400).json({ message: 'Invalid entityType', code: 'VALIDATION_ERROR' });
      }
      filter.entityType = valid.length === 1 ? valid[0] : { $in: valid };
    }

    const actionRaw = typeof req.query.action === 'string' ? req.query.action : '';
    if (actionRaw) {
      if (!VALID_ACTIONS.has(actionRaw)) {
        return res.status(400).json({ message: 'Invalid action', code: 'VALIDATION_ERROR' });
      }
      filter.action = actionRaw;
    }

    const beforeRaw = typeof req.query.before === 'string' ? req.query.before : '';
    if (beforeRaw) {
      const beforeDate = new Date(beforeRaw);
      if (isNaN(beforeDate.getTime())) {
        return res.status(400).json({ message: 'Invalid before timestamp', code: 'VALIDATION_ERROR' });
      }
      filter.timestamp = { $lt: beforeDate };
    }

    const entries = await db.collection('historyLog')
      .find(filter)
      .sort({ timestamp: -1, _id: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = entries.length > limit;
    const page = hasMore ? entries.slice(0, limit) : entries;
    const nextCursor = hasMore ? page[page.length - 1].timestamp.toISOString() : null;

    res.json({
      entries: page.map(e => ({
        _id: e._id.toString(),
        groupId: e.groupId.toString(),
        userId: e.userId?.toString?.() ?? null,
        userEmail: e.userEmail ?? null,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId,
        entityName: e.entityName,
        changes: e.changes ?? null,
        metadata: e.metadata ?? null,
        timestamp: e.timestamp
      })),
      nextCursor
    });
  } catch (error) {
    if (handleGroupResolutionError(error, res)) return;
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Failed to fetch history', code: 'FETCH_ERROR' });
  }
});

export default router;
