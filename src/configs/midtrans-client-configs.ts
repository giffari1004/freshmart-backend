import midtransClient from "midtrans-client";

const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
const clientKey = process.env.MIDTRANS_CLIENT_KEY?.trim();

if (!serverKey) {
  throw new Error("MIDTRANS_SERVER_KEY is not configured");
}

if (!clientKey) {
  throw new Error("MIDTRANS_CLIENT_KEY is not configured");
}

const isProduction =
  process.env.MIDTRANS_IS_PRODUCTION?.trim().toLowerCase() === "true";

export const snap = new midtransClient.Snap({
  isProduction,
  serverKey,
  clientKey,
});