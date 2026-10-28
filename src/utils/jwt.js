import jwt from 'jsonwebtoken';
import logger from '#config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set');
}

const JWT_EXPIRATION_IN = '1d';

export const jwttoken = {
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION_IN });
    } catch (error) {
      logger.error('Failed to authenticate token', error);
      throw new Error('Failed to authenticate token', { cause: error });
    }
  },
  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.error('Failed to verify token', error);
      throw new Error('Failed to verify token', { cause: error });
    }
  },
};
