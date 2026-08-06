import { ZodType, ZodError } from 'zod';
import { BadRequestError } from '../errors/BadRequestError';
export function validate<T>(
  schema: ZodType<T>,
  data: unknown,
  useSafeParse: boolean = false,
): T {
  try {
    if (useSafeParse) {
      const result = schema.safeParse(data);
      if (!result.success) throw result.error;
      return result.data;
    }
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.issues.map((i) => i.message).join(", ");
      throw new BadRequestError(message);
    }
    throw err;
  }
}