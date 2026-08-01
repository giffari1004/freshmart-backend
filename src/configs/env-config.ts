import 'dotenv/config';

export const PORT = Number(process.env.PORT) || 8001;
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const JWT_SECRET = process.env.JWT_SECRET || 'secret';
export const WHITE_LIST = [
  'http://localhost:3000',
];
export const CLOUDINARY_CLOUD_NAME= process.env.CLOUDINARY_CLOUD_NAME
export const CLOUDINARY_API_KEY= process.env.CLOUDINARY_API_KEY
export const CLOUDINARY_API_SECRET= process.env.CLOUDINARY_API_SECRET