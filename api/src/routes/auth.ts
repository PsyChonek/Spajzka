import { Router, Response } from 'express';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthRequest, generateToken } from '../middleware/auth';

const router = Router();

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

    res.json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isAnonymous: user.isAnonymous || false,
      globalPermissions,
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
