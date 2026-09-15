import crypto from "crypto";
import { TokenType, Prisma } from "../../generated/prisma";
import { prisma } from "../configs/prisma-client-config";
import { BadRequestError } from "../errors/BadRequestError";

const TOKEN_EXPIRY_HOURS = 1;

export async function issueAuthToken(
  userId: string,
  type: TokenType,
): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.authToken.create({ data: { userId, token, type, expiresAt } });

  return token;
}

export async function consumeAuthToken(
  token: string,
  type: TokenType,
  db: Prisma.TransactionClient = prisma,
) {
  const authToken = await db.authToken.findFirst({
    where: { token, type, usedAt: null },
  });

  if (!authToken) {
    throw new BadRequestError("Token is invalid or has already been used");
  }

  if (authToken.expiresAt < new Date()) {
    throw new BadRequestError("Token has expired, please request a new one");
  }

  await db.authToken.update({
    where: { id: authToken.id },
    data: { usedAt: new Date() },
  });

  return authToken;
}

export async function invalidateActiveTokens(userId: string, type: TokenType) {
  await prisma.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
}
