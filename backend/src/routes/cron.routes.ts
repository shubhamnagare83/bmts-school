// src/routes/cron.routes.ts
import { Router } from 'express';
import { authorize } from '../middleware/roleGuard.js';
import { runAutoAttendanceNow } from '../cron/attendanceAutoGenerate.js';
import { UserRole } from '../types/enums.js';

const router = Router();

router.get('/run-attendance', authorize(UserRole.ADMIN), async (req, res) => {
  try {
    await runAutoAttendanceNow();
    res.json({ success: true, message: 'Auto-attendance executed' });
  } catch (error) {
    console.error('Manual attendance run error:', error);
    res.status(500).json({ success: false, error: 'Failed to run attendance' });
  }
});

export default router;
