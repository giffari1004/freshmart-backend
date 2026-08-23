import axios from "axios";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} from "../configs/env-config";
import type { OAuthProfile } from "./oauth-types";

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Tukar authorization code dari Google jadi profil user. Dipanggil dari
 * callback endpoint setelah user setuju di consent screen Google.
 */
export async function getGoogleProfile(code: string): Promise<OAuthProfile> {
  const { data: tokenData } = await axios.post(
    "https://oauth2.googleapis.com/token",
    {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
      code,
    },
  );

  const { data: profile } = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  );

  return {
    providerId: profile.sub,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture,
  };
}
