import { AppError } from "./AppError";

export class Forbidden extends AppError {
  constructor(message: string) {
    super(403, message);
  }
}