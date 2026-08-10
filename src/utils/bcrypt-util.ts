import bcrypt from "bcrypt";
export class BcryptUtil {
  static hashPassword(password: string, saltRounds: number = 10) {
    return bcrypt.hash(password, saltRounds);
  }
  static comparePassword(inputPassword: string, dbPassword: string) {
    return bcrypt.compare(inputPassword, dbPassword);
  }
}
