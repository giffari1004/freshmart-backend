// import jwt from "jsonwebtoken";
// import "dotenv/config";

// // Ganti sesuai data user yang ada di database kamu
// const payload = {
//   id: "9378c02a-37f9-4dc3-8a22-39e6e495e9b9",
//   role: "SUPER_ADMIN", // atau "STORE_ADMIN"
//   storeId: null,        // isi uuid store kalau role STORE_ADMIN, null kalau SUPER_ADMIN
// };

// const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
//   expiresIn: "7d",
// });

// console.log("Token:", token);