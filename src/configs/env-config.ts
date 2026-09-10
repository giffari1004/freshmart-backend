import "dotenv/config";

export const PORT = Number(process.env.PORT) || 8001;
export const DATABASE_URL = process.env.DATABASE_URL || "";
export const JWT_SECRET = process.env.JWT_SECRET || "secret";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const WHITE_LIST = [
  "http://localhost:3000",
  "https://freshmart-frontend-six.vercel.app",
];
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// --- Ditambahkan untuk features/auth ---
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "FreshMart <onboarding@freshmart.space>";

// --- Ditambahkan untuk features/address ---
export const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY || "";
export const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY || "";
export const RAJAONGKIR_BASE_URL =
  process.env.RAJAONGKIR_BASE_URL || "https://api.rajaongkir.com/starter";

// --- Ditambahkan untuk features/social-login ---
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
export const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:8001/api/v1/social-login/google/callback";
export const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "";
export const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
export const FACEBOOK_REDIRECT_URI =
  process.env.FACEBOOK_REDIRECT_URI ||
  "http://localhost:8001/api/v1/social-login/facebook/callback";

export const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
export const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
