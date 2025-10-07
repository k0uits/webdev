import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = '7d';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const user = new User({ name, email, password });
    await user.save();
    const safeUser = { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt };
    return res.status(201).json({ message: 'User registered successfully', user: safeUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const profile = async (req: Request, res: Response) => {
  try {
    // req.user is ad ded by authMiddleware
    // @ts-ignore
    const user = req.user;
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
