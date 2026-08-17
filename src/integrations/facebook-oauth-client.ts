import axios from "axios";
import {
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_REDIRECT_URI,
} from "../configs/env-config";
import type { OAuthProfile } from "./oauth-types";

export function getFacebookAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: FACEBOOK_REDIRECT_URI,
    response_type: "code",
    scope: "email,public_profile",
  });

  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

/**
 * Tukar authorization code dari Facebook jadi profil user.
 *
 * Catatan penting: Facebook TIDAK SELALU mengembalikan email (kalau user
 * daftar Facebook-nya pakai nomor HP, atau menolak izin email). Kalau
 * email kosong, login ditolak dengan pesan jelas — karena `User.email`
 * di schema kita unique & wajib.
 */
export async function getFacebookProfile(code: string): Promise<OAuthProfile> {
  const { data: tokenData } = await axios.get(
    "https://graph.facebook.com/v19.0/oauth/access_token",
    {
      params: {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: FACEBOOK_REDIRECT_URI,
        code,
      },
    },
  );

  const { data: profile } = await axios.get("https://graph.facebook.com/me", {
    params: {
      fields: "id,name,email,picture",
      access_token: tokenData.access_token,
    },
  });

  if (!profile.email) {
    throw new Error(
      "Your Facebook account has no email associated. Please use another login method.",
    );
  }

  return {
    providerId: profile.id,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture?.data?.url,
  };
}
