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

console.log("MIDTRANS MODE:", isProduction ? "PRODUCTION" : "SANDBOX");
console.log("MIDTRANS SERVER KEY PREFIX:", serverKey.slice(0, 15));
console.log("MIDTRANS SERVER KEY LENGTH:", serverKey.length);

export const snap = new midtransClient.Snap({
  isProduction,
  serverKey,
  clientKey,
});



// import midtransClient from "midtrans-client";

// const serverKey =
//   process.env.MIDTRANS_SERVER_KEY;

// const clientKey =
//   process.env.MIDTRANS_CLIENT_KEY;

// if (!serverKey) {
//   throw new Error(
//     "MIDTRANS_SERVER_KEY is not configured",
//   );
// }

// if (!clientKey) {
//   throw new Error(
//     "MIDTRANS_CLIENT_KEY is not configured",
//   );
// }

// export const snap =
//   new midtransClient.Snap({
//     isProduction:
//       process.env.MIDTRANS_IS_PRODUCTION ===
//       "true",

//     serverKey,

//     clientKey,
//   });
//   console.log("MIDTRANS MODE:", process.env.MIDTRANS_IS_PRODUCTION);
// console.log(
//   "MIDTRANS SERVER KEY:",
//   process.env.MIDTRANS_SERVER_KEY?.slice(0, 15),
// );