import { AppError } from "./AppError";
export class UnAuthorizedError extends AppError {
  constructor(message: string) {
    super(401, message);
  }
}

