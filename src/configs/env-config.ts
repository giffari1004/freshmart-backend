import "dotenv/config";

export const PORT = Number(process.env.PORT) || 8001;
export const DATABASE_URL = process.env.DATABASE_URL || "";
export const JWT_SECRET = process.env.JWT_SECRET || "secret";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const WHITE_LIST = ["http://localhost:3000"];
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// --- Ditambahkan untuk features/auth ---
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
export const SMTP_HOST = process.env.SMTP_HOST || "";
export const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASS = process.env.SMTP_PASS || "";

// --- Ditambahkan untuk features/address ---
export const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY || "";
export const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY || "";
export const RAJAONGKIR_BASE_URL =
  process.env.RAJAONGKIR_BASE_URL || "https://api.rajaongkir.com/starter";
