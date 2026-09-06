import crypto from "crypto";
import { prisma } from "../configs/prisma-client-config";

// Tanpa karakter ambigu (I, O, 0, 1) supaya gampang dibaca/diketik user.
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length: number) {
  return Array.from(
    { length },
    () => CHARS[crypto.randomInt(CHARS.length)],
  ).join("");
}

/**
 * Generate kode referral unik. Retry beberapa kali kalau kebetulan bentrok
 * — peluangnya sangat kecil, tapi tetap dijaga untuk mencegah race
 * condition saat sistem sudah punya banyak user.
 */
export async function generateUniqueReferralCode(length = 8): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode(length);
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique referral code, please retry");
}
