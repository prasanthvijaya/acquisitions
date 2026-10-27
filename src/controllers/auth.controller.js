import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { signupSchema, signInSchema } from '#validations/auth.validation.js';
import { formatValidationErrors } from '#utils/format.js';
import { createUser } from '#services/auth.service.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationErrors(validationResult.error)
      });
    }

    const { name, email, password, role } = validationResult.data;

    const user = await createUser({ name, email, password, role });
    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });

    cookies.set(res, 'token', token);

    logger.info(`User registered successfully: ${email}`);

    return res.status(201).json({
      message: 'User registered',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    logger.error('Failed to sign up user', error);

    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ message: 'Email already exists' });
    }

    return next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationErrors(validationResult.error)
      });
    }

    const { email, password } = validationResult.data;
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });
    cookies.set(res, 'token', token);

    logger.info(`User signed in successfully: ${email}`);

    return res.status(200).json({
      message: 'User signed in',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    logger.error('Failed to sign in user', error);
    return next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    cookies.clear(res, 'token');
    logger.info('User signed out successfully');

    return res.status(200).json({ message: 'User signed out' });
  } catch (error) {
    logger.error('Failed to sign out user', error);
    return next(error);
  }
};