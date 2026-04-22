import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthRequest, generateToken } from '../middleware/auth';
import { createRateLimiter } from '../utils/rateLimit';

const router = Router();

const MCP_TOKEN_PREFIX = 'spk_mcp_';
const MCP_EXCHANGE_JWT_TTL_SECONDS = 60 * 60; // 1 hour

// IP-scoped brute-force guard for PAT exchange.
const mcpExchangeLimiter = createRateLimiter(10);

function generateMcpToken(): string {
  return MCP_TOKEN_PREFIX + crypto.randomBytes(32).toString('base64url');
}

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         isAnonymous:
 *           type: boolean
 *           description: Whether the user is an anonymous user
 *         globalPermissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of global permissions the user has
 *         groupPermissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of all permissions from all groups the user is a member of
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *     RegisterRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (min 6 characters)
 *       required:
 *         - name
 *         - email
 *         - password
 *     LoginRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *       required:
 *         - email
 *         - password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT authentication token
 *         user:
 *           $ref: '#/components/schemas/User'
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *     ChangePasswordRequest:
 *       type: object
 *       properties:
 *         oldPassword:
 *           type: string
 *           format: password
 *         newPassword:
 *           type: string
 *           format: password
 *       required:
 *         - oldPassword
 *         - newPassword
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @openapi
 * /api/auth/anonymous:
 *   post:
 *     summary: Create anonymous user
 *     description: Create a temporary anonymous user for using the app without registration
 *     tags:
 *       - Authentication
 *     responses:
 *       201:
 *         description: Anonymous user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/auth/anonymous', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();

    // Create anonymous user - data will be stored only in localStorage on client
    // We create a minimal DB record for authentication purposes
    const newUser = {
      name: 'Anonymous User',
      isAnonymous: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    const userId = result.insertedId.toString();

    // Create personal group for this user
    const personalGroup = {
      name: `Anonymous User's Personal Group`,
      isPersonal: true,
      members: [{
        userId: result.insertedId,
        role: 'admin'
      }],
      inviteEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const groupResult = await db.collection('groups').insertOne(personalGroup);

    // Update user with personal group ID
    await db.collection('users').updateOne(
      { _id: result.insertedId },
      { $set: { personalGroupId: groupResult.insertedId } }
    );

    // Generate token (no email for anonymous)
    const token = generateToken(userId, `anonymous-${userId}@temp.local`);

    // Return user info
    const userResponse = {
      _id: userId,
      name: newUser.name,
      isAnonymous: true,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Error creating anonymous user:', error);
    res.status(500).json({
      message: 'Failed to create anonymous user',
      code: 'ANONYMOUS_CREATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: Email already exists
 */
router.post('/auth/register', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Missing required fields: name, email, password',
        code: 'VALIDATION_ERROR'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isAnonymous: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    const userId = result.insertedId.toString();

    // Create personal group for this user
    const personalGroup = {
      name: `${name}'s Personal Group`,
      isPersonal: true,
      members: [{
        userId: result.insertedId,
        role: 'admin'
      }],
      inviteEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const groupResult = await db.collection('groups').insertOne(personalGroup);

    // Update user with personal group ID
    await db.collection('users').updateOne(
      { _id: result.insertedId },
      { $set: { personalGroupId: groupResult.insertedId } }
    );

    // Generate token
    const token = generateToken(userId, email);

    // Return user without password
    const userResponse = {
      _id: userId,
      name,
      email: email.toLowerCase(),
      isAnonymous: false,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      message: 'Failed to register user',
      code: 'REGISTER_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login
 *     description: Authenticate user and get JWT token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/auth/login', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Missing required fields: email, password',
        code: 'VALIDATION_ERROR'
      });
    }

    // Find user
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email);

    // Return user without password
    const userResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isAnonymous: user.isAnonymous || false,
      createdAt: user.createdAt
    };

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      message: 'Failed to login',
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get the currently authenticated user's information
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    // Get user's groups
    const groups = await db.collection('groups').find({
      'members.userId': new ObjectId(req.userId)
    }).toArray();

    // Determine active group
    let activeGroupId = user.activeGroupId;

    // If no active group set, prefer non-personal group over personal group
    if (!activeGroupId && groups.length > 0) {
      // Try to find first non-personal group
      const nonPersonalGroup = groups.find(g => !g.isPersonal);
      if (nonPersonalGroup) {
        activeGroupId = nonPersonalGroup._id;
      } else {
        // Fall back to personal group
        activeGroupId = user.personalGroupId || groups[0]._id;
      }
    }

    // Get user's global permissions
    let globalPermissions: string[] = [];
    if (user.globalRoles && user.globalRoles.length > 0) {
      const roles = await db.collection('roles')
        .find({ _id: { $in: user.globalRoles }, isGlobal: true })
        .toArray();
      globalPermissions = roles.flatMap((r: any) => r.permissions);
    }

    // Get user's group permissions - combine all permissions from all groups
    const groupPermissionsSet = new Set<string>();
    for (const group of groups) {
      const member = group.members.find((m: any) => m.userId.toString() === req.userId);
      if (member && member.role) {
        const role = await db.collection('roles').findOne({ _id: member.role, isGlobal: false });
        if (role && role.permissions) {
          role.permissions.forEach((perm: string) => groupPermissionsSet.add(perm));
        }
      }
    }
    const groupPermissions = Array.from(groupPermissionsSet);

    res.json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isAnonymous: user.isAnonymous || false,
      globalPermissions,
      groupPermissions,
      activeGroupId: activeGroupId?.toString(),
      personalGroupId: user.personalGroupId?.toString(),
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      message: 'Failed to fetch user',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout
 *     description: Logout user (client should remove token)
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/auth/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  // In a stateless JWT setup, logout is handled client-side by removing the token
  // Here we just return success. In a more complex setup, you might want to blacklist the token
  res.json({
    message: 'Logout successful'
  });
});

/**
 * @openapi
 * /api/auth/profile:
 *   put:
 *     summary: Update profile
 *     description: Update user's name and/or email
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       409:
 *         description: Email already exists
 */
router.put('/auth/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name, email } = req.body;

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await db.collection('users').findOne({
        email: email.toLowerCase(),
        _id: { $ne: new ObjectId(req.userId) }
      });

      if (existingUser) {
        return res.status(409).json({
          message: 'Email already in use',
          code: 'EMAIL_EXISTS'
        });
      }

      updateData.email = email.toLowerCase();
    }

    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(req.userId) },
      { $set: updateData },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result) {
      return res.status(404).json({
        message: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      _id: result._id.toString(),
      name: result.name,
      email: result.email,
      isAnonymous: result.isAnonymous || false,
      createdAt: result.createdAt
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      code: 'UPDATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Change user's password
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Invalid old password
 */
router.post('/auth/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: 'Missing required fields: oldPassword, newPassword',
        code: 'VALIDATION_ERROR'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get user with password
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid old password',
        code: 'INVALID_PASSWORD'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      message: 'Failed to change password',
      code: 'UPDATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/auth/active-group:
 *   post:
 *     summary: Set active group
 *     description: Set the user's active group for viewing pantry/shopping lists
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupId:
 *                 type: string
 *             required:
 *               - groupId
 *     responses:
 *       200:
 *         description: Active group updated
 *       403:
 *         description: User is not a member of this group
 */
/**
 * @openapi
 * components:
 *   schemas:
 *     McpTokenStatus:
 *       type: object
 *       properties:
 *         exists:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         lastUsedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     McpTokenResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Personal access token. Shown exactly once.
 *         createdAt:
 *           type: string
 *           format: date-time
 *     McpExchangeRequest:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *       required:
 *         - token
 *     McpExchangeResponse:
 *       type: object
 *       properties:
 *         jwt:
 *           type: string
 *         userId:
 *           type: string
 *         expiresAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /api/auth/mcp-token:
 *   get:
 *     summary: Get MCP token status
 *     description: Returns whether an MCP personal access token exists, plus creation and last-use timestamps. The token itself is never returned.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/McpTokenStatus'
 */
router.get('/auth/mcp-token', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { mcpTokenHash: 1, mcpTokenCreatedAt: 1, mcpTokenLastUsedAt: 1 } }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
    }

    res.json({
      exists: Boolean(user.mcpTokenHash),
      createdAt: user.mcpTokenCreatedAt ?? null,
      lastUsedAt: user.mcpTokenLastUsedAt ?? null
    });
  } catch (error) {
    console.error('Error fetching MCP token status:', error);
    res.status(500).json({ message: 'Failed to fetch MCP token status', code: 'FETCH_ERROR' });
  }
});

/**
 * @openapi
 * /api/auth/mcp-token:
 *   post:
 *     summary: Generate or rotate MCP token
 *     description: Creates a new personal access token for MCP access. Replaces any existing token. Returns the plaintext token exactly once.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/McpTokenResponse'
 *       403:
 *         description: Anonymous users cannot generate MCP tokens
 */
router.post('/auth/mcp-token', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { isAnonymous: 1 } }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
    }

    if (user.isAnonymous) {
      return res.status(403).json({
        message: 'Anonymous users cannot generate MCP tokens. Register or log in first.',
        code: 'ANONYMOUS_NOT_ALLOWED'
      });
    }

    const token = generateMcpToken();
    const hash = await bcrypt.hash(token, 10);
    const createdAt = new Date();

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.userId) },
      {
        $set: {
          mcpTokenHash: hash,
          mcpTokenCreatedAt: createdAt,
          mcpTokenLastUsedAt: null,
          updatedAt: createdAt
        }
      }
    );

    res.json({ token, createdAt });
  } catch (error) {
    console.error('Error generating MCP token:', error);
    res.status(500).json({ message: 'Failed to generate MCP token', code: 'GENERATE_ERROR' });
  }
});

/**
 * @openapi
 * /api/auth/mcp-token:
 *   delete:
 *     summary: Revoke MCP token
 *     description: Revokes the user's active MCP personal access token. Takes effect immediately.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token revoked
 */
router.delete('/auth/mcp-token', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.userId) },
      {
        $set: {
          mcpTokenHash: null,
          mcpTokenCreatedAt: null,
          mcpTokenLastUsedAt: null,
          updatedAt: new Date()
        }
      }
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Error revoking MCP token:', error);
    res.status(500).json({ message: 'Failed to revoke MCP token', code: 'REVOKE_ERROR' });
  }
});

/**
 * @openapi
 * /api/auth/mcp-exchange:
 *   post:
 *     summary: Exchange MCP personal access token for a JWT
 *     description: Used by the MCP server to turn a user's PAT into a short-lived JWT. Not behind JWT auth — the PAT is the credential. Rate-limited per IP.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/McpExchangeRequest'
 *     responses:
 *       200:
 *         description: Exchange successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/McpExchangeResponse'
 *       401:
 *         description: Invalid or revoked PAT
 *       429:
 *         description: Too many exchange attempts from this IP
 */
router.post('/auth/mcp-exchange', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!mcpExchangeLimiter.consume(clientIp)) {
    return res.status(429).json({
      message: 'Too many exchange attempts. Try again later.',
      code: 'RATE_LIMITED'
    });
  }

  try {
    const { token } = req.body ?? {};

    if (typeof token !== 'string' || !token.startsWith(MCP_TOKEN_PREFIX)) {
      return res.status(401).json({ message: 'Invalid token', code: 'INVALID_TOKEN' });
    }

    const db = getDatabase();

    // We cannot index bcrypt hashes, so we scan candidates with a token set.
    // In practice mcpTokenHash is a single-token-per-user column; the set of
    // users with an active MCP token is small relative to the full users
    // collection. If this collection grows, add a short per-token indexable
    // prefix hash as a secondary lookup field.
    const candidates = await db.collection('users')
      .find({ mcpTokenHash: { $ne: null } }, { projection: { mcpTokenHash: 1, email: 1 } })
      .toArray();

    let matched: { _id: ObjectId; email: string } | null = null;
    for (const candidate of candidates) {
      if (candidate.mcpTokenHash && await bcrypt.compare(token, candidate.mcpTokenHash)) {
        matched = { _id: candidate._id, email: candidate.email };
        break;
      }
    }

    if (!matched) {
      return res.status(401).json({
        message: 'Invalid or revoked MCP token.',
        code: 'INVALID_MCP_TOKEN'
      });
    }

    // Best-effort lastUsedAt update — not on the hot path.
    db.collection('users').updateOne(
      { _id: matched._id },
      { $set: { mcpTokenLastUsedAt: new Date() } }
    ).catch(err => console.error('Failed to update mcpTokenLastUsedAt:', err));

    const jwtToken = generateToken(matched._id.toString(), matched.email, `${MCP_EXCHANGE_JWT_TTL_SECONDS}s`);
    const expiresAt = new Date(Date.now() + MCP_EXCHANGE_JWT_TTL_SECONDS * 1000);

    res.json({
      jwt: jwtToken,
      userId: matched._id.toString(),
      expiresAt
    });
  } catch (error) {
    console.error('Error exchanging MCP token:', error);
    res.status(500).json({ message: 'Failed to exchange MCP token', code: 'EXCHANGE_ERROR' });
  }
});

router.post('/auth/active-group', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { groupId } = req.body;


    if (!groupId) {
      return res.status(400).json({
        message: 'Missing required field: groupId',
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify user is a member of this group
    const group = await db.collection('groups').findOne({
      _id: new ObjectId(groupId),
      'members.userId': new ObjectId(req.userId)
    });

    // Update user's active group
    const updateResult = await db.collection('users').updateOne(
      { _id: new ObjectId(req.userId) },
      {
        $set: {
          activeGroupId: new ObjectId(groupId),
          updatedAt: new Date()
        }
      }
    );

    res.json({
      message: 'Active group updated',
      activeGroupId: groupId
    });
  } catch (error) {
    console.error('Error setting active group:', error);
    res.status(500).json({
      message: 'Failed to set active group',
      code: 'UPDATE_ERROR'
    });
  }
});

export default router;
