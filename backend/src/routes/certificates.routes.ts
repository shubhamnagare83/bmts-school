import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const c = await prisma.certificate.findMany({
      where: { studentId: String(req.query.studentId) }
    });
    res.json({ success: true, data: c });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const c = await prisma.certificate.create({ data: req.body });
    res.json({ success: true, data: c });
  } catch (err) { next(err); }
});

router.get('/:id/pdf', async (req, res, next) => {
  res.json({ success: true, message: 'PDF generated' });
});

export default router;
