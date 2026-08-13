import crypto from "crypto";

export function generateMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
) {
  const signatureString =
    orderId +
    statusCode +
    grossAmount +
    serverKey;

  return crypto
    .createHash("sha512")
    .update(signatureString)
    .digest("hex");
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
  serverKey: string,
) {
  const generatedSignature =
    generateMidtransSignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
    );

  return (
    generatedSignature ===
    signatureKey
  );
}