import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env-config";
import { BadRequestError } from "../errors/BadRequestError";

const OAUTH_STATE_EXPIRES_IN = "10m";

interface OAuthStatePayload {
  purpose: "social-login";
  referralCode?: string;
}

export function createOAuthState(referralCode?: string) {
  return jwt.sign(
    {
      purpose: "social-login",
      referralCode,
    },
    JWT_SECRET,
    { expiresIn: OAUTH_STATE_EXPIRES_IN },
  );
}

export function verifyOAuthState(state: string) {
  try {
    const payload = jwt.verify(state, JWT_SECRET) as OAuthStatePayload;

    if (payload.purpose !== "social-login") {
      throw new BadRequestError("Invalid OAuth state");
    }

    return payload;
  } catch {
    throw new BadRequestError("Invalid or expired OAuth state");
  }
}
