import { Router, Response } from 'express';
import { getDatabase } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Role ID
 *         name:
 *           type: string
 *           description: Role display name
 *         description:
 *           type: string
 *           description: Role description
 *         isGlobal:
 *           type: boolean
 *           description: Whether this is a global role or group role
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of permissions for this role
 */

/**
 * @openapi
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve all available roles with their permissions
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 */
router.get('/roles', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const roles = await db.collection('roles').find({}).toArray();

    return res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({
      message: 'Failed to fetch roles',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     description: Retrieve a specific role with its permissions
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID (e.g., admin, moderator, member, system_moderator)
 *     responses:
 *       200:
 *         description: Role details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 */
router.get('/roles/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const role = await db.collection('roles').findOne({ _id: id } as any);

    if (!role) {
      return res.status(404).json({
        message: 'Role not found',
        code: 'NOT_FOUND'
      });
    }

    return res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return res.status(500).json({
      message: 'Failed to fetch role',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
