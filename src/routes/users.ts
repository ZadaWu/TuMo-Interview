import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mysqlClient from '../util/getMysql';

const router = express.Router();

interface UserSignupRequest {
  email: string;
  password: string;
}

interface User {
  id: number;
  email: string;
  password: string;
}

// Signup route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body as UserSignupRequest;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Check if email exists
      const existingUser = await mysqlClient.query<User[]>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Insert user
      const result = await mysqlClient.query<{insertId: number}>(
        'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
        [email, hashedPassword, username]
      );

      const token = jwt.sign(
        { userId: result.insertId },
        process.env.JWT_SECRET || '',
        { expiresIn: '24h' }
      );

      res.status(201).json({ token });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error creating user' });
    }

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as UserSignupRequest;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      // Find user
      const users = await mysqlClient.query<User[]>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];

      // Compare password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || '',
        { expiresIn: '24h' }
      );

      res.json({ token });

    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;