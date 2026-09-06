import rateLimit from "express-rate-limit";

// Rate limit lebih ketat khusus endpoint sensitif (login, register, reset
// password) — di luar global limiter yang sudah ada di app.ts, karena
// endpoint ini yang paling rawan brute-force/abuse.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
