import 'dotenv/config';

export const PORT = Number(process.env.PORT) || 8000;

export const DATABASE_URL = process.env.DATABASE_URL || '';

export const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const WHITE_LIST = [
  'http://localhost:3000',
];