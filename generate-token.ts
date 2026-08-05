// generate-token.ts (di root folder backend)
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./src/configs/env-config";

const token = jwt.sign(
  { id: "test-id-123", role: "SUPER_ADMIN", storeId: null },
  JWT_SECRET,
  { expiresIn: "24h" }, // dipanjangin biar nggak keburu expired pas testing
);

console.log(token);