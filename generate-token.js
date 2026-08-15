import jwt from "jsonwebtoken";
import "dotenv/config";

// Ganti sesuai data user yang ada di database kamu
const payload = {
  id: "PASTE_USER_ID_UUID_DISINI",
  role: "SUPER_ADMIN", // atau "STORE_ADMIN"
  storeId: null,        // isi uuid store kalau role STORE_ADMIN, null kalau SUPER_ADMIN
};

const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
  expiresIn: "7d",
});

console.log("Token:", token);