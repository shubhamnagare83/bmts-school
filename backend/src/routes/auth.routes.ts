import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRY, JWT_REFRESH_EXPIRY } from '../config/jwt.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const rawLogin = req.body.login || req.body.username || req.body.email;
    const password = req.body.password;

    if (!rawLogin || !password) {
      return res.status(400).json({ success: false, error: 'Login and password are required' });
    }
    
    const login = String(rawLogin).trim().toLowerCase();

    // Accept either the email address or the username as the login identifier.
    // Students are issued a username equal to their admission number (e.g.
    // "adm001"), and the Profile page presents that username as their
    // "Login ID" — so matching on email alone locked every student out.
    // Emails and usernames are stored lowercase, and `login` is lowercased
    // above, which keeps this case-insensitive on any database.
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: login }, { username: login }],
      },
      include: {
        teacher: true,
        admin: true,
        student: true,
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const payload = { id: user.id, role: user.role, email: user.email };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY as any });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY as any });


    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        token: accessToken,
        accessToken,
        user: { id: user.id, email: user.email, username: user.username, role: user.role }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ success: false, error: 'No refresh token' });

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
      if (err) return res.status(403).json({ success: false, error: 'Invalid refresh token' });

      const payload = { id: decoded.id, role: decoded.role, email: decoded.email };
      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY as any });

      res.json({ success: true, data: { accessToken, token: accessToken } });
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        admin: true,
        teacher: true,
        student: true
      }
    });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authenticateToken, async (req: any, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { email, password } = req.body;
    const updateData: any = {};

    if (email) {
      const emailTrim = String(email).trim().toLowerCase();
      // Check if email already taken
      const existing = await prisma.user.findFirst({
        where: {
          email: emailTrim,
          NOT: { id: userId }
        }
      });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Email address is already in use by another account' });
      }
      updateData.email = emailTrim;
    }

    if (password) {
      if (String(password).trim().length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields provided for update' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        admin: true,
        teacher: true,
        student: true
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, message: 'Profile updated successfully', data: safeUser });
  } catch (error) {
    next(error);
  }
});

export default router;
