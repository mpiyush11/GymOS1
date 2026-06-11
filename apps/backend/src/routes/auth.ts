import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, role: user.role, gymId: user.gym_id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ 
    message: 'Logged in', 
    user: { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      gym_id: user.gym_id 
    } 
  });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Session verification endpoint for frontend hydration
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (req.user) {
      return res.json({ user: req.user });
    }
    return res.status(401).json({ error: 'No active session verified' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;