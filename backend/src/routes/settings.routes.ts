import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    let settings = await prisma.schoolSettings.findFirst();
    if (!settings) {
      settings = await prisma.schoolSettings.create({
        data: {
          schoolName: 'Bharat Ratna Mother Teresa English School',
          address: 'Gangapur Dist. Chha. Sambhajinagar - 431109',
          phone: '+91 9876543210',
          email: 'contact@mtfschool.edu',
          motto: 'Education for Excellence',
          principalName: 'Dr. S. K. Sharma',
        }
      });
    } else if (settings.schoolName !== 'Bharat Ratna Mother Teresa English School') {
      settings = await prisma.schoolSettings.update({
        where: { id: settings.id },
        data: {
          schoolName: 'Bharat Ratna Mother Teresa English School',
          address: 'Gangapur Dist. Chha. Sambhajinagar - 431109',
        }
      });
    }
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

router.put('/', authenticateToken, authorize('ADMIN'), async (req, res, next) => {
  try {
    const settings = await prisma.schoolSettings.findFirst();
    const updated = await prisma.schoolSettings.update({
      where: { id: settings!.id },
      data: req.body
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.post('/logo', authenticateToken, authorize('ADMIN'), async (req, res, next) => {
  res.json({ success: true, message: 'Logo uploaded' });
});

export default router;
